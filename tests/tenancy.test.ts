import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const database=new PGlite();
const admin="10000000-0000-0000-0000-000000000001",teacher="10000000-0000-0000-0000-000000000002",guardian="10000000-0000-0000-0000-000000000003",other="10000000-0000-0000-0000-000000000004";
const schoolA="20000000-0000-0000-0000-000000000001",schoolB="20000000-0000-0000-0000-000000000002";
beforeAll(async()=>{
  await database.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,raw_user_meta_data jsonb DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
  await database.exec(readFileSync("supabase/migrations/202610270001_identity_and_tenancy.sql","utf8"));
  await database.exec(`INSERT INTO auth.users(id) VALUES ('${admin}'),('${teacher}'),('${guardian}'),('${other}');
    INSERT INTO public.schools(id,name,slug) VALUES ('${schoolA}','School A','school-a'),('${schoolB}','School B','school-b');
    INSERT INTO public.school_memberships(school_id,user_id,role) VALUES ('${schoolA}','${admin}','school_admin'),('${schoolA}','${teacher}','teacher'),('${schoolA}','${guardian}','guardian'),('${schoolB}','${other}','school_admin');`);
});
async function asUser(id:string){await database.exec(`BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${id}',true);`);}
afterEach(async()=>{await database.exec("ROLLBACK");});
afterAll(async()=>{await database.close();});
describe("PostgreSQL row-level security (real PostgreSQL engine via PGlite)",()=>{
  it("school A administrator cannot read or update school B",async()=>{
    await asUser(admin);const {rows}=await database.query<{id:string}>("SELECT id FROM public.schools");expect(rows.map(r=>r.id)).toEqual([schoolA]);
    const result=await database.query("UPDATE public.schools SET name='Intrusion' WHERE id=$1 RETURNING id",[schoolB]);expect(result.rows).toHaveLength(0);
  });
  it("teacher can read own membership but cannot read staff list or change branding",async()=>{
    await asUser(teacher);expect((await database.query("SELECT * FROM public.school_memberships")).rows).toHaveLength(1);
    expect((await database.query("UPDATE public.schools SET name='Changed' RETURNING id")).rows).toHaveLength(0);
  });
  it("guardian cannot see another user's profile or audit entries",async()=>{
    await asUser(guardian);expect((await database.query("SELECT * FROM public.profiles WHERE id=$1",[admin])).rows).toHaveLength(0);
    expect((await database.query("SELECT * FROM public.audit_logs")).rows).toHaveLength(0);
  });
  it("client cannot promote its own role",async()=>{
    await asUser(teacher);await expect(database.exec("UPDATE public.school_memberships SET role='school_admin'")).rejects.toThrow(/permission denied/);
  });
  it("client cannot toggle school activation",async()=>{
    await asUser(admin);await expect(database.exec("UPDATE public.schools SET active=false")).rejects.toThrow(/permission denied/);
  });
  it("authorised school profile updates create an audit entry",async()=>{
    await asUser(admin);await database.exec("UPDATE public.schools SET name='Updated School A'");
    const {rows}=await database.query<{actor_id:string;action:string;after_data:{name:string}}>("SELECT actor_id,action,after_data FROM public.audit_logs WHERE action='update'");
    expect(rows).toHaveLength(1);expect(rows[0].actor_id).toBe(admin);expect(rows[0].after_data.name).toBe("Updated School A");
  });
  it("cannot write or delete audit records from a school account",async()=>{
    await asUser(admin);await expect(database.exec("DELETE FROM public.audit_logs")).rejects.toThrow(/permission denied/);
  });
  it("inactive membership revokes school access",async()=>{
    await database.exec(`BEGIN; UPDATE public.school_memberships SET active=false WHERE user_id='${teacher}'; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${teacher}',true);`);
    expect((await database.query("SELECT * FROM public.schools")).rows).toHaveLength(0);
  });
  it("anonymous requests cannot read school data",async()=>{
    await database.exec("BEGIN; SET LOCAL ROLE anon;");await expect(database.exec("SELECT * FROM public.schools")).rejects.toThrow(/permission denied/);
  });
});
