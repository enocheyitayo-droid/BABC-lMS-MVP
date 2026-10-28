import type { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname,join } from "node:path";
import { randomUUID } from "node:crypto";

export function initializeMvp(sql:DatabaseSync,path:string) {
  const schema=(sql.prepare("SELECT sql FROM sqlite_master WHERE name='accounts'").get() as {sql:string}).sql;
  if(!schema.includes("'parent'")) {
    if(path!==":memory:"){const dir=join(dirname(path),"backups");mkdirSync(dir,{recursive:true});sql.prepare("VACUUM INTO ?").run(join(dir,`before-mvp-${randomUUID()}.sqlite`));}
    sql.exec("PRAGMA foreign_keys=OFF");
    try{sql.exec(`BEGIN IMMEDIATE;
      CREATE TABLE accounts_mvp(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,role TEXT NOT NULL CHECK(role IN ('principal','ict','bursar','academic_lead','teacher','student','parent')),student_id TEXT UNIQUE REFERENCES students(id),password_hash TEXT,status TEXT NOT NULL CHECK(status IN ('Pending','Active','Suspended')),demo INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      INSERT INTO accounts_mvp SELECT * FROM accounts;
      DROP TABLE accounts;
      ALTER TABLE accounts_mvp RENAME TO accounts;
      COMMIT;`);}catch(error){sql.exec("ROLLBACK");throw error;}finally{sql.exec("PRAGMA foreign_keys=ON");}
    if(sql.prepare("PRAGMA foreign_key_check").all().length)throw new Error("School database references need repair.");
  }
  sql.exec(`
    CREATE TABLE IF NOT EXISTS school_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
    INSERT OR IGNORE INTO school_settings VALUES('session','2026/2027');
    INSERT OR IGNORE INTO school_settings VALUES('term','First term');
    CREATE TABLE IF NOT EXISTS enrollments(student_id TEXT NOT NULL REFERENCES students(id),session TEXT NOT NULL,class_name TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Active',PRIMARY KEY(student_id,session));
    INSERT OR IGNORE INTO enrollments SELECT id,(SELECT value FROM school_settings WHERE key='session'),class_name,status FROM students s WHERE NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id=s.id);
    CREATE TABLE IF NOT EXISTS assessments(id TEXT PRIMARY KEY,session TEXT NOT NULL,term TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('Midterm','End of term')),class_name TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Checked','Approved','Published')),due_date TEXT NOT NULL,created_by TEXT NOT NULL REFERENCES accounts(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(session,term,kind,class_name,revision));
    CREATE TABLE IF NOT EXISTS assessment_roster(assessment_id TEXT REFERENCES assessments(id),student_id TEXT REFERENCES students(id),name TEXT NOT NULL,admission TEXT NOT NULL,comment TEXT NOT NULL DEFAULT '',PRIMARY KEY(assessment_id,student_id));
    CREATE TABLE IF NOT EXISTS assessment_subjects(id TEXT PRIMARY KEY,assessment_id TEXT NOT NULL REFERENCES assessments(id),subject TEXT NOT NULL,teacher_id TEXT NOT NULL REFERENCES accounts(id),status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Submitted')),UNIQUE(assessment_id,subject));
    CREATE TABLE IF NOT EXISTS assessment_scores(subject_id TEXT REFERENCES assessment_subjects(id),student_id TEXT REFERENCES students(id),ca INTEGER NOT NULL,exam INTEGER NOT NULL,PRIMARY KEY(subject_id,student_id));
    CREATE TABLE IF NOT EXISTS academic_reports(id TEXT PRIMARY KEY,assessment_id TEXT REFERENCES assessments(id),student_id TEXT REFERENCES students(id),snapshot TEXT NOT NULL,published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(assessment_id,student_id));
    CREATE TABLE IF NOT EXISTS guardian_links(account_id TEXT REFERENCES accounts(id),student_id TEXT REFERENCES students(id),PRIMARY KEY(account_id,student_id));
    CREATE TABLE IF NOT EXISTS support_notes(id TEXT PRIMARY KEY,student_id TEXT REFERENCES students(id),author_id TEXT REFERENCES accounts(id),note TEXT NOT NULL,follow_up TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Resolved')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS timetable(id TEXT PRIMARY KEY,session TEXT NOT NULL,class_name TEXT NOT NULL,subject TEXT NOT NULL,teacher_id TEXT NOT NULL REFERENCES accounts(id),weekday INTEGER NOT NULL CHECK(weekday BETWEEN 1 AND 5),starts TEXT NOT NULL,ends TEXT NOT NULL,room TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS substitutions(id TEXT PRIMARY KEY,slot_id TEXT REFERENCES timetable(id),school_date TEXT NOT NULL,teacher_id TEXT NOT NULL REFERENCES accounts(id),UNIQUE(slot_id,school_date));
    CREATE TABLE IF NOT EXISTS staff_meetings(id TEXT PRIMARY KEY,title TEXT NOT NULL,school_date TEXT NOT NULL,starts TEXT NOT NULL,link TEXT NOT NULL,minutes TEXT NOT NULL DEFAULT '',created_by TEXT REFERENCES accounts(id));
  `);
}
