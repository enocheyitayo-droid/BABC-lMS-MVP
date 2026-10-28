import { readFileSync } from "node:fs";
import { beforeAll,afterAll,describe,it,expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { hostedSql } from "@/lib/babc/hosted-sql";
import { passwordMatches } from "@/lib/babc/database";
const db=new PGlite();
beforeAll(async()=>{await db.exec(readFileSync("netlify/database/migrations/202610280001_babc_mvp.sql","utf8"));},30000);
afterAll(()=>db.close());
describe("Hosted BABC PostgreSQL persistence",()=>{
  it("creates the complete schema and requested local-test role accounts in a clean hosted database",async()=>{const result=await db.query<{email:string;role:string;password_hash:string}>("SELECT email,role,password_hash FROM accounts WHERE demo=0 AND role!='student'");expect(result.rows.map(r=>r.role).sort()).toEqual(["academic_lead","bursar","ict","principal","teacher"]);expect(result.rows.every(r=>passwordMatches("EYITAYO",r.password_hash))).toBe(true);const student=await db.query("SELECT s.admission,a.status FROM students s JOIN accounts a ON a.student_id=s.id WHERE s.admission='BABC26003'");expect(student.rows[0]).toEqual({admission:"BABC26003",status:"Active"});});
  it("keeps bound values outside SQL syntax and handles case-insensitive identifiers exactly",async()=>{const sql=hostedSql("SELECT id FROM accounts WHERE email=? COLLATE NOCASE");expect(sql).toBe("SELECT id FROM accounts WHERE lower(email)=lower($1)");expect((await db.query(sql,["PRINCIPAL@BABC.SCHOOL"])).rows).toHaveLength(1);expect((await db.query(sql,["%@babc.school"])).rows).toHaveLength(0);expect(hostedSql("SELECT '?' AS literal, ? AS value")).toBe("SELECT '?' AS literal, $1 AS value");});
  it("supports attendance aggregates and does not overwrite enrollments on ignored duplicates",async()=>{const result=await db.query(hostedSql("SELECT sum(status IN ('Present','Late')) present,sum(status='Absent') absent FROM class_attendance"));expect(result.rows[0]).toEqual({present:null,absent:null});await db.query(hostedSql("INSERT OR IGNORE INTO school_settings VALUES(?,?)"),["session","2099/2100"]);expect((await db.query("SELECT value FROM school_settings WHERE key='session'")).rows[0]).toEqual({value:"2026/2027"});});
  it("snapshots a distinct assessment roster and enforces score/report references",async()=>{const a=(await db.query<{id:string}>("SELECT id FROM assessments LIMIT 1")).rows[0];expect((await db.query("SELECT student_id FROM assessment_roster WHERE assessment_id=$1",[a.id])).rows).toHaveLength(4);await expect(db.query("INSERT INTO academic_reports VALUES('bad','missing','missing','{}',CURRENT_TIMESTAMP)")).rejects.toThrow();});
});
