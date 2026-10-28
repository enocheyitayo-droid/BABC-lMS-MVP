import { afterEach,beforeEach,describe,expect,it } from "vitest";
import { SchoolDatabase,type Account,schoolRoles } from "@/lib/babc/database";
import { navigationFor } from "@/lib/babc/navigation";
describe("focused school navigation",()=>{
  it("shows only everyday teacher tasks and adds My class only for class teachers",()=>{
    const subjectTeacher=navigationFor("teacher");
    expect(subjectTeacher.primary.map(l=>l.key)).toEqual(["overview","subjects","notices"]);
    const classTeacher=navigationFor("teacher",true);
    expect(classTeacher.primary.map(l=>l.key)).toEqual(["overview","subjects","myclass","notices"]);
    expect(classTeacher.more.map(l=>l.key)).not.toContain("finance");
  });
  it("keeps administration short while retaining the less frequent tools",()=>{
    const principal=navigationFor("principal");
    expect(principal.primary.map(l=>l.key)).toEqual(["overview","students","finance","purse"]);
    expect(principal.more.map(l=>l.key)).toEqual(expect.arrayContaining(["salaries","debtors","results","activity"]));
    for(const role of schoolRoles){const nav=navigationFor(role,true);const keys=[...nav.primary,...nav.more].map(l=>l.key);expect(new Set(keys).size).toBe(keys.length);}
  });
});
describe("class teacher responsibilities",()=>{
  let db:SchoolDatabase;
  const teacher=()=>db.sql.prepare("SELECT * FROM accounts WHERE id='demo-teacher'").get() as Account;
  beforeEach(()=>{db=new SchoolDatabase(":memory:",true);});
  afterEach(()=>db.sql.close());
  it("keeps class teacher duties separate from subject assignments",()=>{
    expect(db.formClasses(teacher())).toEqual(["JSS 1A"]);
    expect(db.classRegisterRows(teacher(),"a1","2026-10-27")).toHaveLength(3);
    expect(()=>db.formClassStudents(teacher(),"SS 1A","2026-10-27")).toThrow("class teacher");
  });
  it("returns plain rows for the class attendance client component",()=>{
    const rows=db.formClassStudents(teacher(),"JSS 1A","2026-10-27");
    expect(rows.map(r=>r.id).sort()).toEqual(["s2","s4","s7"]);
    expect(rows.every(r=>Object.getPrototypeOf(r)===Object.prototype)).toBe(true);
  });
  it("saves daily class attendance without changing lesson attendance or outsiders",()=>{
    db.saveFormAttendance(teacher(),"JSS 1A","2026-10-27",{s2:"Present",s4:"Late",s7:"Absent",s1:"Present"});
    expect(db.sql.prepare("SELECT * FROM class_attendance").all()).toHaveLength(3);
    expect(db.sql.prepare("SELECT * FROM class_attendance WHERE student_id='s1'").get()).toBeUndefined();
    expect(db.sql.prepare("SELECT * FROM attendance").all()).toHaveLength(0);
  });
  it("does not let an unrelated teacher update another class",()=>{
    db.sql.prepare("INSERT INTO accounts(id,name,email,role,status) VALUES('other','Another Teacher','another@example.test','teacher','Active')").run();
    const other=db.sql.prepare("SELECT * FROM accounts WHERE id='other'").get() as Account;
    expect(db.formClasses(other)).toEqual([]);
    expect(()=>db.saveFormAttendance(other,"JSS 1A","2026-10-27",{s2:"Present",s4:"Present",s7:"Present"})).toThrow("class teacher");
  });
  it("rolls back every row when one attendance status is missing or invalid",()=>{
    expect(()=>db.saveFormAttendance(teacher(),"JSS 1A","2026-10-27",{s2:"Present",s4:"Invalid",s7:"Present"})).toThrow("attendance status");
    expect(db.sql.prepare("SELECT * FROM class_attendance").all()).toHaveLength(0);
  });
  it("updates class teacher access immediately after reassignment",()=>{
    db.sql.prepare("INSERT INTO accounts(id,name,email,role,status) VALUES('other','Another Teacher','another@example.test','teacher','Active')").run();
    db.sql.prepare("UPDATE class_teachers SET teacher_id='other' WHERE class_name='JSS 1A'").run();
    expect(db.formClasses(teacher())).toEqual([]);
    expect(()=>db.formClassStudents(teacher(),"JSS 1A","2026-10-27")).toThrow("class teacher");
  });
});
