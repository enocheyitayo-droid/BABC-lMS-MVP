import { afterEach,beforeEach,describe,expect,it,vi } from "vitest";
import { SchoolDatabase,type Account } from "@/lib/babc/database";
const context=vi.hoisted(()=>({database:undefined as unknown,actor:undefined as unknown}));
vi.mock("server-only",()=>({}));
vi.mock("@/lib/babc/server",()=>({schoolDb:()=>context.database,requireAccount:async(roles:string[])=>{const actor=context.actor as Account;if(!roles.includes(actor.role))throw new Error("Permission denied");return actor;},babcDemoEnabled:()=>true,setSession:async()=>{},homeFor:()=>"/portal"}));
vi.mock("next/cache",()=>({revalidatePath:()=>{}}));
vi.mock("next/headers",()=>({cookies:async()=>({})}));
vi.mock("next/navigation",()=>({redirect:(path:string)=>{throw new Error(`Redirect:${path}`);}}));
import { saveSchoolClass } from "@/lib/babc/actions";
let db:SchoolDatabase;
beforeEach(()=>{db=new SchoolDatabase(":memory:",true);context.database=db;context.actor=db.sql.prepare("SELECT * FROM accounts WHERE id='demo-teacher'").get() as Account;});
afterEach(()=>db.sql.close());
function form(values:Record<string,string>){const f=new FormData();Object.entries(values).forEach(([key,value])=>f.set(key,value));return f;}
describe("server-enforced subject registers",()=>{
  it("saves assigned subject marks only for students in that class",async()=>{
    const result=await saveSchoolClass(form({assignment_id:"a1",mode:"scores","ca-s1":"32","exam-s1":"51","ca-s2":"40","exam-s2":"60"}));
    expect(result.success).toBeDefined();
    expect(db.sql.prepare("SELECT ca,exam FROM scores WHERE student_id='s1' AND assignment_id='a1'").get()).toEqual({ca:32,exam:51});
    expect(db.sql.prepare("SELECT * FROM scores WHERE student_id='s2'").get()).toBeUndefined();
  });
  it("rejects updates to another subject teacher’s assignment",async()=>{
    db.sql.prepare("INSERT INTO accounts(id,name,email,role,status) VALUES('other','Other Teacher','other@example.test','teacher','Active')").run();
    db.sql.prepare("INSERT INTO assignments VALUES('other-class','other','Mathematics','SS 1A')").run();
    const result=await saveSchoolClass(form({assignment_id:"other-class",mode:"scores","ca-s1":"40","exam-s1":"60"}));
    expect(result.error).toContain("not assigned");
    expect(db.sql.prepare("SELECT * FROM scores").all()).toHaveLength(0);
  });
  it("rolls back the class submission if one student has invalid marks",async()=>{
    const result=await saveSchoolClass(form({assignment_id:"a1",mode:"scores","ca-s1":"30","exam-s1":"50","ca-s3":"41","exam-s3":"50"}));
    expect(result.error).toContain("0–40");
    expect(db.sql.prepare("SELECT * FROM scores").all()).toHaveLength(0);
  });
  it("saves attendance for the assigned class and excludes forged students",async()=>{
    const result=await saveSchoolClass(form({assignment_id:"a1",mode:"attendance",date:"2026-10-27","status-s1":"Present","status-s3":"Absent","status-s8":"Late","status-s2":"Present"}));
    expect(result.success).toBeDefined();
    expect(db.sql.prepare("SELECT * FROM attendance").all()).toHaveLength(3);
    expect(db.sql.prepare("SELECT * FROM attendance WHERE student_id='s2'").get()).toBeUndefined();
  });
  it("does not let a student or bursar write academic registers",async()=>{
    for(const id of ["demo-student","demo-bursar"]){context.actor=db.sql.prepare("SELECT * FROM accounts WHERE id=?").get(id);await expect(saveSchoolClass(form({assignment_id:"a1",mode:"scores"}))).rejects.toThrow("Permission denied");}
  });
});
