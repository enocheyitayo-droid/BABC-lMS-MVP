// Generate an initial hosted schema from a CLEAN fictional school, never the
// user's local database. Once deployed, create a new migration instead of
// changing this file's output.
import { writeFileSync,existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { SchoolDatabase,passwordHash,today } from "../src/lib/babc/database";
import { AcademicRecords } from "../src/lib/babc/academics";
const target="netlify/database/migrations/202610280001_babc_mvp.sql";
if(existsSync(target)&&!process.argv.includes("--replace-unapplied"))throw new Error("Migration already exists. Never rewrite a deployed migration.");
const password=process.env.BABC_SEED_PASSWORD;if(!password)throw new Error("Set the requested initial test password in BABC_SEED_PASSWORD.");
const db=new SchoolDatabase(":memory:",true),sql=db.sql;
try{
  const ids:Record<string,string>={};for(const [role,name,email] of [["principal","Principal Eyitayo","principal@babc.school"],["ict","ICT Eyitayo","ict@babc.school"],["teacher","Teacher Eyitayo","teacher@babc.school"],["academic_lead","Academic Lead Eyitayo","academic@babc.school"],["bursar","Bursar Eyitayo","bursar@babc.school"]]){ids[role]=randomUUID();sql.prepare("INSERT INTO accounts(id,name,email,role,password_hash,status) VALUES(?,?,?,?,?,'Active')").run(ids[role],name,email,role,passwordHash(password));}
  const student=randomUUID(),account=randomUUID();sql.prepare("INSERT INTO students(id,admission,name,class_name) VALUES(?,'BABC26003','Eyitayo','SS 1A')").run(student);sql.prepare("INSERT INTO accounts(id,name,email,role,student_id,password_hash,status) VALUES(?,'Eyitayo',?,'student',?,?,'Active')").run(account,`student:${student}`,student,passwordHash(password));sql.prepare("INSERT INTO student_login_defaults VALUES(?)").run(account);sql.prepare("INSERT INTO enrollments VALUES(?,'2026/2027','SS 1A','Active')").run(student);sql.prepare("INSERT INTO assignments VALUES(?,?,'Mathematics','SS 1A')").run(randomUUID(),ids.teacher);sql.prepare("INSERT INTO class_teachers VALUES('SS 1A',?)").run(ids.teacher);
  const records=new AcademicRecords(db),actor=sql.prepare("SELECT * FROM accounts WHERE id=?").get(ids.academic_lead) as unknown as Parameters<typeof records.create>[0];records.create(actor,{session:"2026/2027",term:"First term",kind:"Midterm",className:"SS 1A",due:today()});
  const literal=(value:unknown)=>value===null?"NULL":typeof value==="number"?String(value):`'${String(value).replaceAll("'","''")}'`;
  let out="-- BABC MVP: durable school records and fictional demonstration accounts.\nCREATE SCHEMA IF NOT EXISTS babc_school;\nSET search_path TO babc_school, public;\n\n";
  const tables=sql.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid").all() as {name:string;sql:string}[];
  const pending=[...tables],ordered:typeof tables=[];while(pending.length){const index=pending.findIndex(t=>(sql.prepare(`PRAGMA foreign_key_list(${t.name})`).all() as {table:string}[]).every(f=>ordered.some(done=>done.name===f.table)||f.table===t.name));if(index<0)throw new Error("Cyclic schema dependency");ordered.push(pending.splice(index,1)[0]);}
  for(const table of ordered)out+=table.sql.replaceAll("CURRENT_TIMESTAMP","to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS.US')")+";\n";
  const indexes=sql.prepare("SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL").all() as {sql:string}[];for(const i of indexes)out+=i.sql+";\n";
  out+="\n-- Only generated fictional data; no local school records or sessions are uploaded.\n";
  for(const table of ordered){if(["sessions","login_attempts"].includes(table.name))continue;const rows=sql.prepare(`SELECT * FROM ${table.name}`).all();for(const row of rows){const keys=Object.keys(row);out+=`INSERT INTO ${table.name} (${keys.join(",")}) VALUES (${keys.map(k=>literal(row[k])).join(",")});\n`;}}
  writeFileSync(target,out,"utf8");console.log("Generated clean hosted migration with requested role logins.");
}finally{sql.close();}
