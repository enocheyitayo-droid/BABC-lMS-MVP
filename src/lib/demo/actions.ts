"use server";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { classes, createDemo, db, demoRoles, findPupil, log, pupils, requireDemo, statement, subjects, transaction, type DemoRole } from "./store";
import { publishScores, resultPeriod, resultRows, storeScores } from "./results";

function value(form: FormData, key: string) { return String(form.get(key) ?? ""); }
function finish(path: string, status = "saved"): never { revalidatePath("/demo", "layout"); redirect(`${path}${path.includes("?") ? "&" : "?"}success=${status}`); }
function fail(path: string, error = "invalid"): never { redirect(`${path}${path.includes("?") ? "&" : "?"}error=${error}`); }

export async function startDemo(form: FormData) {
  const role = value(form,"role") as DemoRole;
  if (!demoRoles.includes(role)) fail("/demo/start");
  await createDemo(role); redirect("/demo");
}
export async function switchDemoRole(form: FormData) {
  const context = await requireDemo();
  const role = value(form,"role") as DemoRole;
  if (!demoRoles.includes(role)) fail("/demo");
  db().prepare("UPDATE workspaces SET role=? WHERE id=?").run(role,context.id);
  finish("/demo","role");
}
export async function endDemo() { (await cookies()).delete({name:"teamville_demo",path:"/demo"}); redirect("/demo/start"); }

const pupilSchema = z.object({ first_name:z.string().trim().min(2).max(60),last_name:z.string().trim().min(2).max(60),class_name:z.enum(classes as [string,...string[]]),guardian:z.string().trim().min(3).max(120) });
export async function admitPupil(form: FormData) {
  const context = await requireDemo(["school_admin"]);
  const parsed = pupilSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) fail("/demo/pupils?admit=1");
  const p = parsed.data;
  if (pupils(context).length >= 100) fail("/demo/pupils","limit");
  const existing = db().prepare("SELECT id FROM pupils WHERE workspace=? AND lower(first_name)=lower(?) AND lower(last_name)=lower(?) AND class_name=?").get(context.id,p.first_name,p.last_name,p.class_name);
  if (existing) fail("/demo/pupils?admit=1","duplicate");
  transaction(() => {
    const sequence = (db().prepare("SELECT count(*) AS n FROM pupils WHERE workspace=?").get(context.id) as {n:number}).n+1;
    db().prepare("INSERT INTO pupils(id,workspace,admission,first_name,last_name,class_name,guardian) VALUES(?,?,?,?,?,?,?)").run(randomUUID(),context.id,`TV/2026/${String(sequence).padStart(3,"0")}`,p.first_name,p.last_name,p.class_name,p.guardian);
    log(context,`Admitted ${p.first_name} ${p.last_name} to ${p.class_name}`);
  });
  finish("/demo/pupils","admitted");
}

export async function saveAttendance(form: FormData) {
  const context = await requireDemo(["school_admin","teacher"]);
  const date = value(form,"date"), className = value(form,"class");
  const path = `/demo/attendance?class=${encodeURIComponent(className)}&date=${date}`;
  const parsedDate = new Date(`${date}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0,10) !== date || !classes.includes(className)) fail("/demo/attendance");
  const register = pupils(context,"",className);
  if (!register.length) fail(path);
  const marks = register.map(p=>({id:p.id,status:value(form,`status_${p.id}`)}));
  if (marks.some(p=>!["Present","Absent","Late","Excused"].includes(p.status))) fail(path);
  transaction(()=>{
    for (const mark of marks) db().prepare("INSERT INTO attendance(workspace,student_id,school_date,status,recorded_by) VALUES(?,?,?,?,?) ON CONFLICT(workspace,student_id,school_date) DO UPDATE SET status=excluded.status,recorded_by=excluded.recorded_by,updated_at=CURRENT_TIMESTAMP").run(context.id,mark.id,date,mark.status,context.role);
    log(context,`Saved / corrected attendance for ${className} on ${date} (${marks.length} pupils)`);
  });
  finish(path,"attendance");
}

export async function saveScores(form: FormData) {
  const context = await requireDemo(["school_admin","teacher"]);
  const studentId = value(form,"student_id"), pupil = findPupil(context,studentId);
  const period=resultPeriod(form.get("period"));
  const path = `/demo/results?student=${encodeURIComponent(studentId)}&period=${period}`;
  if (!pupil) fail("/demo/results","permission");
  const existing = resultRows(context,studentId,period).some(row=>row.state==="Published");
  if (existing) fail(path,"published");
  const scores = subjects.map((subject,i)=>({subject,ca:period==="midterm"?0:Number(form.get(`ca_${i}`)),exam:Number(form.get(`exam_${i}`)),missing:period==="exam"&&(form.get(`ca_${i}`)===""||!form.has(`ca_${i}`))||form.get(`exam_${i}`)===""||!form.has(`exam_${i}`)}));
  if (scores.some(s=>s.missing||!Number.isInteger(s.ca)||!Number.isInteger(s.exam)||s.ca<0||s.ca>40||s.exam<0||s.exam>(period==="midterm"?100:60))) fail(path);
  transaction(()=>{
    storeScores(context,studentId,period,scores);
    if(form.get("intent")==="publish")publishScores(context,studentId,period);
  });
  finish(path,form.get("intent")==="publish"?"published":"scores");
}
export async function changeResultState(form: FormData) {
  const context = await requireDemo(["school_admin","teacher"]);
  const studentId = value(form,"student_id"), next = value(form,"state");
  const period=resultPeriod(form.get("period"));
  const path = `/demo/results?student=${encodeURIComponent(studentId)}&period=${period}`;
  if (!findPupil(context,studentId)) fail("/demo/results","permission");
  if (!["Submitted","Published"].includes(next)) fail(path,"permission");
  transaction(()=>{
    if(next==="Published"){try{publishScores(context,studentId,period);}catch{fail(path,"workflow");}return;}
    const rows = resultRows(context,studentId,period);
    const valid = rows.length===subjects.length && subjects.every(s=>rows.some(r=>r.subject===s));
    if (!valid || rows.some(s=>s.state==="Published")) fail(path,"workflow");
    db().prepare(`UPDATE ${period==="midterm"?"midterm_scores":"scores"} SET state=? WHERE workspace=? AND student_id=?`).run(next,context.id,studentId);
    log(context,`${next} ${period} results for ${studentId}`);
  });
  finish(path,next==="Published" ? "published" : "submitted");
}

export async function recordPayment(form: FormData) {
  const context = await requireDemo(["school_admin","bursar"]);
  const studentId = value(form,"student_id"), amountText = value(form,"amount");
  const path = `/demo/finance?student=${encodeURIComponent(studentId)}`;
  const method = value(form,"method"), reference = value(form,"reference").trim();
  if (!findPupil(context,studentId)||!/^\d{1,7}(\.\d{1,2})?$/.test(amountText)||!["Cash","Bank transfer"].includes(method)||reference.length<3||reference.length>80) fail(path);
  const amount = Math.round(Number(amountText)*100), account = statement(context,studentId)!;
  if (!Number.isSafeInteger(amount)||amount<=0||amount>account.balance) fail(path,"amount");
  if (db().prepare("SELECT id FROM payments WHERE workspace=? AND reference=?").get(context.id,reference)) fail(path,"duplicate");
  transaction(()=>{
    db().prepare("INSERT INTO payments(id,workspace,student_id,amount,method,reference,status) VALUES(?,?,?,?,?,?,'Pending')").run(randomUUID(),context.id,studentId,amount,method,reference);
    log(context,`Recorded a pending offline payment of ${amount} kobo for ${studentId}`);
  });
  finish(path,"payment");
}
export async function verifyPayment(form: FormData) {
  const context = await requireDemo(["school_admin","bursar"]);
  const paymentId = value(form,"payment_id");
  const payment = db().prepare("SELECT * FROM payments WHERE workspace=? AND id=?").get(context.id,paymentId) as {id:string;student_id:string;amount:number;status:string}|undefined;
  if (!payment) fail("/demo/finance","permission");
  const path = `/demo/finance?student=${encodeURIComponent(payment.student_id)}`;
  if (payment.status!=="Pending") finish(path,"verified");
  transaction(()=>{
    const current=db().prepare("SELECT status FROM payments WHERE workspace=? AND id=?").get(context.id,paymentId) as {status:string};
    if(current.status!=="Pending")return;
    const account = statement(context,payment.student_id)!;
    if (payment.amount>account.balance) fail(path,"amount");
    db().prepare("UPDATE payments SET status='Verified',receipt=? WHERE workspace=? AND id=? AND status='Pending'").run(`TV-DEMO-${randomUUID().slice(0,8).toUpperCase()}`,context.id,paymentId);
    log(context,`Verified payment ${paymentId}; receipt issued`);
  });
  finish(path,"verified");
}
export async function publishNotice(form: FormData) {
  const context = await requireDemo(["school_admin"]);
  const title = value(form,"title").trim(),message = value(form,"message").trim();
  if (title.length<3||title.length>100||message.length<10||message.length>2000) fail("/demo/notices");
  transaction(()=>{
    db().prepare("INSERT INTO notices(id,workspace,title,message) VALUES(?,?,?,?)").run(randomUUID(),context.id,title,message);
    log(context,`Published notice: ${title}`);
  });
  finish("/demo/notices","notice");
}
