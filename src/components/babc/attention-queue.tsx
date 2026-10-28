import Link from "next/link";
import { AcademicRecords } from "@/lib/babc/academics";
import { schoolDb } from "@/lib/babc/server";
import { today,type Account } from "@/lib/babc/database";
export function AttentionQueue({actor}:{actor:Account}){
  const db=schoolDb(),records=new AcademicRecords(db),items:{title:string;detail:string;href:string}[]=[];
  if(["principal","academic_lead","teacher","ict"].includes(actor.role))for(const a of records.list(actor)){
    if(actor.role==="teacher"){const pending=records.subjects(actor,a.id).filter(s=>s.teacher_id===actor.id&&s.status==="Draft");for(const s of pending)items.push({title:`${s.subject} · ${a.class_name}`,detail:`${a.kind} marks ${a.due_date<today()?"overdue":"due"} ${a.due_date}`,href:`/portal/academics?assessment=${a.id}&subject=${s.id}`});if(a.status==="Draft"&&db.formClasses(actor).includes(a.class_name)&&records.subjects(actor,a.id).every(s=>s.status==="Submitted"))items.push({title:`Check ${a.class_name} results`,detail:`${a.kind} subject submissions are ready`,href:`/portal/academics?assessment=${a.id}`});}
    if(["principal","academic_lead"].includes(actor.role)&&["Checked","Approved"].includes(a.status))items.push({title:`${a.class_name} · ${a.kind}`,detail:a.status==="Checked"?"Awaiting academic approval":"Approved and ready to publish",href:`/portal/academics?assessment=${a.id}`});
  }
  if(actor.role==="ict"){const pending=(db.sql.prepare("SELECT count(*) n FROM accounts WHERE status='Pending'").get() as {n:number}).n;if(pending)items.push({title:`${pending} account(s) awaiting access`,detail:"Verify admission records before approving",href:"/portal/office?view=ict"});}
  if(actor.role==="principal"){const n=(db.sql.prepare("SELECT count(*) n FROM payables WHERE status='Requested'").get() as {n:number}).n;if(n)items.push({title:`${n} payment request(s)`,detail:"Awaiting your approval",href:"/portal/office?view=purse"});}
  if(actor.role==="bursar"){const n=(db.sql.prepare("SELECT count(*) n FROM payments WHERE status='Pending'").get() as {n:number}).n;if(n)items.push({title:`${n} student payment(s)`,detail:"Check evidence before issuing receipts",href:"/portal/office?view=finance#pending-payments"});}
  if(["principal","academic_lead","teacher"].includes(actor.role)){const notes=db.sql.prepare("SELECT id,student_id,follow_up FROM support_notes WHERE status='Open' AND follow_up<=? ORDER BY follow_up").all(today()) as {id:string;student_id:string;follow_up:string}[];for(const n of notes){try{records.canReadStudent(actor,n.student_id);items.push({title:"Student support follow-up",detail:`Due ${n.follow_up} · confidential staff record`,href:"/portal/operations?tab=support"});}catch{}}}
  const meetings=db.sql.prepare("SELECT title,school_date,starts FROM staff_meetings WHERE school_date>=? ORDER BY school_date,starts LIMIT 1").all(today()) as {title:string;school_date:string;starts:string}[];for(const m of meetings)items.push({title:m.title,detail:`Staff meeting ${m.school_date}, ${m.starts} WAT`,href:"/portal/operations?tab=meetings"});
  return <section className="babc-attention"><h2>What needs my attention?</h2>{items.length?<div>{items.slice(0,6).map((i,index)=><Link key={index} href={i.href}><strong>{i.title}</strong><span>{i.detail}</span></Link>)}</div>:<p>No pending reviews, deadlines, or follow-ups for your account.</p>}</section>;
}
