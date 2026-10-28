import { mkdtempSync,rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe,it,expect } from "vitest";
import { SchoolDatabase,passwordHash,passwordMatches,studentSurname } from "@/lib/babc/database";

describe("Student admission and surname login",()=>{
  it("uses the recorded surname including compound surnames",()=>{
    expect(studentSurname("  Ade-Ojo, Oluwaseun ")).toBe("ADE-OJO");
    expect(studentSurname("Van der West, Joy")).toBe("VAN DER WEST");
    expect(studentSurname("Balogun Damilola")).toBe("BALOGUN");
    expect(()=>studentSurname("   ")).toThrow("surname");
  });
  it("requires uppercase surname, rejects student email, and preserves staff email login",()=>{
    const db=new SchoolDatabase(":memory:",true);
    try{
      expect(db.authenticate(" babc/26/001 ","AKINWALE").student_id).toBe("s1");
      expect(()=>db.authenticate("BABC/26/001","akinwale")).toThrow("incorrect");
      expect(()=>db.authenticate("student@demo.babc.local","AKINWALE")).toThrow("incorrect");
      db.sql.prepare("UPDATE accounts SET password_hash=? WHERE id='demo-teacher'").run(passwordHash("Staff-password-2026"));
      expect(db.authenticate("TEACHER@DEMO.BABC.LOCAL","Staff-password-2026").role).toBe("teacher");
      const id=db.registerStudent({admission:"babc/26/002",code:"BABC-DEMO-002"});
      expect(()=>db.authenticate("BABC/26/002","BALOGUN")).toThrow("approval");
      db.sql.prepare("UPDATE accounts SET status='Active' WHERE id=?").run(id);
      expect(db.authenticate("BABC/26/002","BALOGUN").id).toBe(id);
    }finally{db.sql.close();}
  });
  it("upgrades existing student passwords once, revokes sessions and preserves status and later passwords",()=>{
    const folder=mkdtempSync(join(tmpdir(),"babc-login-")),path=join(folder,"school.sqlite");
    let db=new SchoolDatabase(path,true);
    try{
      const session=db.createSession("demo-student");
      db.sql.prepare("DELETE FROM student_login_defaults WHERE account_id='demo-student'").run();
      db.sql.prepare("UPDATE accounts SET password_hash=?,status='Suspended' WHERE id='demo-student'").run(passwordHash("Old-password-2026"));
      db.sql.close();db=new SchoolDatabase(path,true);
      const account=db.sql.prepare("SELECT password_hash,status FROM accounts WHERE id='demo-student'").get() as {password_hash:string;status:string};
      expect(passwordMatches("AKINWALE",account.password_hash)).toBe(true);
      expect(account.status).toBe("Suspended");
      expect(db.sql.prepare("SELECT * FROM sessions WHERE token_hash IS NOT NULL").all()).toHaveLength(0);
      expect(db.session(session.token)).toBeUndefined();
      db.sql.prepare("UPDATE accounts SET password_hash=?,status='Active' WHERE id='demo-student'").run(passwordHash("Later-password-2026"));
      db.sql.close();db=new SchoolDatabase(path,true);
      expect(db.authenticate("BABC/26/001","Later-password-2026").role).toBe("student");
      expect(()=>db.authenticate("BABC/26/001","AKINWALE")).toThrow("incorrect");
    }finally{db.sql.close();rmSync(folder,{recursive:true,force:true});}
  });
});
