"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccount,schoolDb } from "./server";
import { AcademicRecords,validSession } from "./academics";
import { SchoolOperations } from "./school-operations";
import { allowed } from "./database";
import { manualBackup } from "./backups";
import { join } from "node:path";

function value(form:FormData,key:string,max=2000){const value=String(form.get(key)||"").trim();if(value.length>max)throw new Error("An entry is too long.");return value;}
export async function academicAction(form:FormData){
  const actor=await requireAccount(),db=schoolDb(),records=new AcademicRecords(db);let id=value(form,"assessment_id",100),message="Saved.",error="";const op=value(form,"operation",40),sid=value(form,"subject_id",100);
  try{
    if(op==="create")id=records.create(actor,{session:value(form,"session"),term:value(form,"term"),kind:value(form,"kind"),className:value(form,"class_name"),due:value(form,"due_date")});
    else if(op==="scores"){const entry=records.scoreRows(actor,sid);id=entry.assessment.id;records.saveScores(actor,sid,entry.rows.map(r=>({studentId:r.student_id,ca:value(form,`ca-${r.student_id}`),exam:entry.assessment.kind==="Midterm"?(value(form,`ca-${r.student_id}`)===""?"":"0"):value(form,`exam-${r.student_id}`)})));message="Draft marks saved.";}
    else if(op==="csv"){const file=form.get("file");if(!(file instanceof File)||file.size>1_000_000)throw new Error("Choose a CSV file smaller than 1 MB.");records.importCsv(actor,sid,await file.text());message="CSV marks validated and saved. No students outside this class were changed.";}
    else if(op==="submit"){records.submit(actor,sid);message="Subject marks submitted and locked for review.";}
    else if(op==="return"){records.returnSubject(actor,sid,value(form,"reason",500));message="Subject returned to the teacher for correction. Class review must be completed again.";}
    else if(op==="comment"){records.comment(actor,id,value(form,"student_id"),value(form,"comment",1000));message="Report comment saved.";}
    else if(op==="review"){records.review(actor,id,value(form,"decision"));message="Review step recorded.";}
    else if(op==="revise"){id=records.revise(actor,id);message="Correction revision opened. Published reports remain unchanged.";}
    else throw new Error("Unknown academic action.");
  }catch(e){error=e instanceof Error?e.message:"Unable to save.";if(/UNIQUE|constraint|SQLITE/i.test(error))error="This record already exists or conflicts with school records.";}
  revalidatePath("/portal","layout");const query=new URLSearchParams({...(id?{assessment:id}:{}),...(sid&&op!=="return"?{subject:sid}:{}),[error?"error":"success"]:error||message});redirect(`/portal/academics?${query}`);
}
export async function operationsAction(form:FormData){
  const actor=await requireAccount(),db=schoolDb(),records=new AcademicRecords(db),ops=new SchoolOperations(db),op=value(form,"operation",40);let error="",message="Saved.",passwordChanged=false;
  const tab=({promote:"records",session:"records",parent:"parents",support:"support",resolve:"support",slot:"timetable",cover:"timetable",meeting:"meetings",backup:"backups",password:"settings"} as Record<string,string>)[op]||"timetable";
  try{
    if(op==="promote"){records.promote(actor,value(form,"student_id"),value(form,"session"),value(form,"class_name"),value(form,"status"));message="New placement saved. Previous classes, results, attendance, and receipts are retained.";}
    else if(op==="session"){allowed(actor,["principal"]);const session=validSession(value(form,"session"));if(session<records.currentSession())throw new Error("The active session cannot move backwards. Use history to view past sessions.");const schoolTerm=value(form,"term");if(!["First term","Second term","Third term"].includes(schoolTerm))throw new Error("Choose the active school term.");db.transaction(()=>{db.sql.prepare("UPDATE school_settings SET value=? WHERE key='session'").run(session);db.sql.prepare("UPDATE school_settings SET value=? WHERE key='term'").run(schoolTerm);});db.log(actor,`Set active school session to ${session}`);message="Active session changed. Promote students separately to create their new placements.";}
    else if(op==="parent"){records.addParent(actor,value(form,"email"),value(form,"name"),String(form.get("password")||""),value(form,"student_id"));message="Parent linked to the selected child. Existing parent passwords are preserved.";}
    else if(op==="support"){records.support(actor,value(form,"student_id"),value(form,"note",2000),value(form,"follow_up"));message="Confidential support note and follow-up saved.";}
    else if(op==="resolve"){ops.resolveSupport(actor,value(form,"note_id"));message="Follow-up marked resolved.";}
    else if(op==="slot")ops.addSlot(actor,{session:value(form,"session"),className:value(form,"class_name"),subject:value(form,"subject"),teacherId:value(form,"teacher_id"),weekday:Number(value(form,"weekday")),starts:value(form,"starts"),ends:value(form,"ends"),room:value(form,"room",80)});
    else if(op==="cover")ops.substitute(actor,value(form,"slot_id"),value(form,"date"),value(form,"teacher_id"));
    else if(op==="meeting"){ops.meeting(actor,value(form,"title",150),value(form,"date"),value(form,"starts"),value(form,"link"),value(form,"minutes",10000),value(form,"meeting_id")||undefined);message="Meeting and shared minutes saved. No email invitations were sent.";}
    else if(op==="backup"){allowed(actor,["principal","ict"]);const filename=await manualBackup(db.sql,process.env.BABC_DB_DIRECTORY||join(process.cwd(),".data"));db.log(actor,`Created backup ${filename}`);message=`Backup created: ${filename}`;}
    else if(op==="password"){if(String(form.get("new_password"))!==String(form.get("confirm_password")))throw new Error("The new passwords do not match.");records.changePassword(actor,String(form.get("current_password")||""),String(form.get("new_password")||""));passwordChanged=true;}
    else throw new Error("Unknown school action.");
  }catch(e){error=e instanceof Error?e.message:"Unable to save.";if(/UNIQUE|constraint|SQLITE/i.test(error))error="This record already exists or conflicts with school records.";}
  revalidatePath("/portal","layout");if(passwordChanged)redirect("/portal/login?success=Password+changed.+Sign+in+again.");redirect(`/portal/operations?${new URLSearchParams({tab,[error?"error":"success"]:error||message})}`);
}
