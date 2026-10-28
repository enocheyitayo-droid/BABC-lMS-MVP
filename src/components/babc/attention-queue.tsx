import {academicAttention} from "@/lib/babc/academic-attention";
import Link from "next/link";
import { AcademicRecords } from "@/lib/babc/academics";
import { schoolDb,dashboardCounts } from "@/lib/babc/server";
import { today,type Account } from "@/lib/babc/database";
export function AttentionQueue({actor}:{actor:Account}){
  const db=schoolDb(),records=new AcademicRecords(db),items:{title:string;detail:string;href:string}[]=[];
  if(["principal","academic_lead","teacher"].includes(actor.role))items.push(...academicAttention(db,actor,today()));
  if(actor.role==="ict"){const pending=dashboardCounts().pendingAccounts;if(pending)items.push({title:`${pending} account(s) awaiting access`,detail:"Verify admission records before approving",href:"/portal/office?view=ict"});}
  if(actor.role==="principal"){const n=dashboardCounts().approvals;if(n)items.push({title:`${n} payment request(s)`,detail:"Awaiting your approval",href:"/portal/office?view=purse"});}
  if(actor.role==="bursar"){const n=dashboardCounts().pendingPayments;if(n)items.push({title:`${n} student payment(s)`,detail:"Check evidence before issuing receipts",href:"/portal/office?view=finance#pending-payments"});}
  if(["principal","academic_lead","teacher"].includes(actor.role)){const notes=db.sql.prepare("SELECT id,student_id,follow_up FROM support_notes WHERE status='Open' AND follow_up<=? ORDER BY follow_up").all(today()) as {id:string;student_id:string;follow_up:string}[];for(const n of notes){try{records.canReadStudent(actor,n.student_id);items.push({title:"Student support follow-up",detail:`Due ${n.follow_up} · confidential staff record`,href:"/portal/operations?tab=support"});}catch{}}}
  const meetings=db.sql.prepare("SELECT title,school_date,starts FROM staff_meetings WHERE school_date>=? ORDER BY school_date,starts LIMIT 1").all(today()) as {title:string;school_date:string;starts:string}[];for(const m of meetings)items.push({title:m.title,detail:`Staff meeting ${m.school_date}, ${m.starts} WAT`,href:"/portal/operations?tab=meetings"});
  return <section className="babc-attention"><h2>What needs my attention?</h2>{items.length?<div>{items.slice(0,6).map((i,index)=><Link key={index} href={i.href}><strong>{i.title}</strong><span>{i.detail}</span></Link>)}</div>:<p>No pending reviews, deadlines, or follow-ups for your account.</p>}</section>;
}
