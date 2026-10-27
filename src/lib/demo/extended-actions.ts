"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db,findPupil,log,pupils,requireDemo,subjects,transaction } from "./store";
import { parseCsv } from "./csv";
import { publishScores,resultPeriod,storeScores } from "./results";
import { ensureStaff,purse,type Obligation } from "./finance";
const value=(form:FormData,key:string)=>String(form.get(key)??"").trim();
function done(path:string,status="saved"):never{revalidatePath("/demo","layout");redirect(`${path}${path.includes("?")?"&":"?"}success=${status}`);}
function fail(path:string,error="invalid"):never{redirect(`${path}${path.includes("?")?"&":"?"}error=${error}`);}
function kobo(raw:string){if(!/^\d{1,8}(\.\d{1,2})?$/.test(raw))return 0;const n=Math.round(Number(raw)*100);return Number.isSafeInteger(n)&&n>0?n:0;}

export async function uploadResults(form:FormData){
  const context=await requireDemo(["school_admin","teacher"]),period=resultPeriod(form.get("period")),path=`/demo/results?period=${period}`;
  const file=form.get("file");if(!(file instanceof File)||!file.name.toLowerCase().endsWith(".csv")||file.size>100000||file.size===0)fail(path,"csv");
  let failure="";
  try{
    const rows=parseCsv(await file.text()),headers=rows.shift();
    const expected=period==="midterm"?["admission","subject","score"]:["admission","subject","ca","exam"];
    if(!headers||headers.join(",").toLowerCase()!==expected.join(",")||rows.length===0||rows.length>400)throw new Error("csv");
    const available=pupils(context),groups=new Map<string,{subject:string;ca:number;exam:number}[]>();
    for(const row of rows){
      if(row.length!==expected.length||row.some(cell=>cell===""))throw new Error("csv");
      const pupil=available.find(p=>p.admission===row[0]);if(!pupil)throw new Error("permission");
      if(!subjects.includes(row[1])||row.slice(2).some(n=>!/^\d+$/.test(n)))throw new Error("csv");
      const group=groups.get(pupil.id)??[];group.push({subject:row[1],ca:period==="midterm"?0:Number(row[2]),exam:Number(row[period==="midterm"?2:3])});groups.set(pupil.id,group);
    }
    transaction(()=>{for(const [studentId,marks] of groups){storeScores(context,studentId,period,marks);publishScores(context,studentId,period);}log(context,`Imported and published ${period} CSV: ${rows.length} scores for ${groups.size} pupils`);});
  }catch(error){failure=error instanceof Error&&["permission","published"].includes(error.message)?error.message:"csv";}
  if(failure)fail(path,failure);done(path,"imported");
}

export async function addCharge(form:FormData){
  const context=await requireDemo(["school_admin","bursar"]),student=value(form,"student_id"),amount=kobo(value(form,"amount")),category=value(form,"category"),reference=value(form,"reference");
  const path=`/demo/finance?student=${encodeURIComponent(student)}`;
  if(!findPupil(context,student)||!amount||category.length<3||category.length>100||reference.length<3||reference.length>80)fail(path);
  const id=`charge-${reference}`;if(db().prepare("SELECT id FROM charges WHERE workspace=? AND id=?").get(context.id,id))fail(path,"duplicate");
  transaction(()=>{db().prepare("INSERT INTO charges VALUES(?,?,?,?,?)").run(id,context.id,student,category,amount);log(context,`Added charge / opening debt ${reference}: ${amount} kobo for ${student}; ${category}`);});done(path,"charge");
}

export async function requestDisbursement(form:FormData){
  const context=await requireDemo(["bursar"]);ensureStaff(context);
  const kind=value(form,"kind"),staffId=value(form,"staff_id"),period=value(form,"period");
  let description=value(form,"description"),amount=kobo(value(form,"amount")),reference=value(form,"reference");
  let payee=value(form,"payee");
  if(kind==="Salary"){
    const staff=db().prepare("SELECT s.name,p.monthly_amount FROM staff s JOIN staff_payroll p ON p.workspace=s.workspace AND p.staff_id=s.id WHERE s.workspace=? AND s.id=?").get(context.id,staffId) as {name:string;monthly_amount:number}|undefined;
    if(!staff||!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))fail("/demo/purse");payee=staff.name;
    amount=staff.monthly_amount;
    const month=new Intl.DateTimeFormat("en-NG",{month:"long",year:"numeric",timeZone:"Africa/Lagos"}).format(new Date(`${period}-01T12:00:00Z`));
    description=`${month} salary for ${staff.name}`;
    reference=`SAL-${staffId}-${period.replace("-","")}-${randomUUID().slice(0,8).toUpperCase()}`;
    if(db().prepare("SELECT id FROM obligations WHERE workspace=? AND staff_id=? AND period=? AND kind='Salary' AND status!='Rejected'").get(context.id,staffId,period))fail("/demo/purse","duplicate");
  }
  if(!["Salary","Expense"].includes(kind)||!amount||description.length<5||description.length>300||reference.length<3||reference.length>80)fail("/demo/purse");
  if(payee.length<3||payee.length>100)fail("/demo/purse");
  if(db().prepare("SELECT id FROM obligations WHERE workspace=? AND reference=?").get(context.id,reference))fail("/demo/purse","duplicate");
  transaction(()=>{db().prepare("INSERT INTO obligations(workspace,id,kind,payee,staff_id,period,description,amount,reference,requested_role) VALUES(?,?,?,?,?,?,?,?,?,?)").run(context.id,randomUUID(),kind,payee,kind==="Salary"?staffId:null,kind==="Salary"?period:null,description,amount,reference,context.role);log(context,`Requested ${kind.toLowerCase()} / recorded payable ${reference} for ${payee}: ${amount} kobo`);});done("/demo/purse","requested");
}
export async function approveDisbursement(form:FormData){
  const context=await requireDemo(["school_admin"]),id=value(form,"id"),decision=value(form,"decision");
  const item=db().prepare("SELECT * FROM obligations WHERE workspace=? AND id=?").get(context.id,id) as Obligation|undefined;
  if(!item||item.status!=="Requested"||item.requested_role===context.role||!["Approved","Rejected"].includes(decision))fail("/demo/purse","workflow");
  transaction(()=>{db().prepare("UPDATE obligations SET status=?,approved_role=? WHERE workspace=? AND id=? AND status='Requested'").run(decision,context.role,context.id,id);log(context,`${decision} payable ${item.reference}: ${item.amount} kobo`);});done("/demo/purse","reviewed");
}
export async function payDisbursement(form:FormData){
  const context=await requireDemo(["bursar"]),id=value(form,"id"),reference=value(form,"payment_reference"),method=value(form,"method"),date=value(form,"paid_date");
  const item=db().prepare("SELECT * FROM obligations WHERE workspace=? AND id=?").get(context.id,id) as Obligation|undefined;
  if(!item)fail("/demo/purse","permission");if(item.status==="Paid")done("/demo/purse","disbursed");
  const parsed=new Date(`${date}T12:00:00Z`);
  if(item.status!=="Approved"||reference.length<3||reference.length>80||!["Bank transfer","Cash"].includes(method)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)fail("/demo/purse","workflow");
  if(db().prepare("SELECT obligation_id FROM disbursement_details WHERE workspace=? AND reference=?").get(context.id,reference))fail("/demo/purse","duplicate");
  if(purse(context).balance<item.amount)fail("/demo/purse","funds");
  transaction(()=>{
    const current=db().prepare("SELECT status FROM obligations WHERE workspace=? AND id=?").get(context.id,id) as {status:string};
    if(current.status==="Paid")return;
    if(current.status!=="Approved")fail("/demo/purse","workflow");
    if(purse(context).balance<item.amount)fail("/demo/purse","funds");
    db().prepare("INSERT INTO disbursement_details VALUES(?,?,?,?,?)").run(context.id,id,method,reference,date);
    db().prepare("UPDATE obligations SET status='Paid',paid_at=CURRENT_TIMESTAMP,voucher=? WHERE workspace=? AND id=?").run(`TV-PV-${randomUUID().slice(0,8).toUpperCase()}`,context.id,id);
    if(item.staff_id)db().prepare("INSERT INTO staff_messages(workspace,id,staff_id,obligation_id,message) VALUES(?,?,?,?,?)").run(context.id,randomUUID(),item.staff_id,id,`Your ${item.period} salary payment has been recorded. Your payslip is available below. Demo notification; no bank transfer or email was sent.`);
    log(context,`Disbursed ${item.amount} kobo from school purse for ${item.reference}; payment reference ${reference}`);
  });done("/demo/purse","disbursed");
}
export async function addFunding(form:FormData){
  const context=await requireDemo(["bursar"]),amount=kobo(value(form,"amount")),reference=value(form,"reference"),description=value(form,"description"),category=value(form,"category");
  if(!amount||reference.length<3||reference.length>80||description.length<5||description.length>300||!["Opening balance","Other income"].includes(category))fail("/demo/purse");
  if(db().prepare("SELECT id FROM purse_funding WHERE workspace=? AND reference=?").get(context.id,reference))fail("/demo/purse","duplicate");
  transaction(()=>{db().prepare("INSERT INTO purse_funding(workspace,id,amount,category,reference,description) VALUES(?,?,?,?,?,?)").run(context.id,randomUUID(),amount,category,reference,description);log(context,`Recorded purse funding ${reference}: ${amount} kobo (${category})`);});done("/demo/purse","funding");
}
