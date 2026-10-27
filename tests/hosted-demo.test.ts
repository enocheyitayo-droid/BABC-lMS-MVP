import { afterAll,expect,it,vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
vi.mock("server-only",()=>({}));
import { PostgresDatabase } from "@/lib/demo/postgres";
import { postgresSql } from "@/lib/demo/postgres-sql";
const database=new PostgresDatabase("postgresql://test",resolve("tests/fixtures/embedded-pg.cjs"));
afterAll(()=>database.close());
it("uses the shipped migration with the hosted PostgreSQL driver bridge",()=>{
  database.exec(readFileSync("netlify/database/migrations/202610270001_demo.sql","utf8"));
  database.prepare("INSERT INTO workspaces VALUES(?,?,?,?)").run("test-space","test-token","teacher","2099-12-31");
  database.prepare("INSERT INTO pupils(id,workspace,admission,first_name,last_name,class_name,guardian) VALUES(?,?,?,?,?,?,?)").run("p1","test-space","A001","Test","Pupil","Primary 3","Guardian");
  database.prepare("INSERT OR IGNORE INTO staff VALUES(?,?,?,?)").run("test-space","s1","Test Teacher","Teacher");
  database.prepare("INSERT OR IGNORE INTO staff VALUES(?,?,?,?)").run("test-space","s1","Test Teacher","Teacher");
  expect(database.prepare("SELECT count(*) AS n FROM staff WHERE workspace=?").get("test-space")?.n).toBe(1);
  database.exec("BEGIN IMMEDIATE");database.prepare("INSERT INTO charges VALUES(?,?,?,?,?)").run("c1","test-space","p1","Tuition",100000);database.exec("COMMIT");
  database.exec("BEGIN IMMEDIATE");database.prepare("INSERT INTO charges VALUES(?,?,?,?,?)").run("c2","test-space","p1","Void",50000);database.exec("ROLLBACK");
  expect(database.prepare("SELECT sum(amount) AS n FROM charges WHERE workspace=?").get("test-space")?.n).toBe(100000);
  expect(database.prepare("SELECT * FROM pupils WHERE workspace=?").all("other-space")).toHaveLength(0);
},60000);
it("keeps question marks inside SQL strings and binds values separately",()=>{
  expect(postgresSql("SELECT 'why?',?,'it''s ?',?")).toBe("SELECT 'why?',$1,'it''s ?',$2");
});
