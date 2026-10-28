import Link from "next/link";
import { ArrowRight,BookOpen,ClipboardCheck,GraduationCap,Users,Wallet,ShieldCheck,MonitorCog } from "lucide-react";
import { schoolDb } from "@/lib/babc/server";
import { type Account,today } from "@/lib/babc/database";
import { Heading,Note,Panel,Status } from "./ui";
import { AcademicRecords } from "@/lib/babc/academics";
import { AttentionQueue } from "./attention-queue";
import { DashboardOverview } from "./dashboard-overview";
import { FormClassRegister } from "./form-class-register";

type Assignment={id:string;subject:string;class_name:string;teacher_name:string;students:number};
export function SubjectChoices({actor}:{actor:Account}) {
  const db=schoolDb();
  const rows=db.sql.prepare(`SELECT a.id,a.subject,a.class_name,u.name teacher_name,(SELECT count(*) FROM students s WHERE s.class_name=a.class_name AND s.status='Active') students FROM assignments a JOIN accounts u ON u.id=a.teacher_id ${actor.role==="teacher"?"WHERE a.teacher_id=?":""} ORDER BY a.class_name,a.subject`).all(...(actor.role==="teacher"?[actor.id]:[])) as Assignment[];
  return <section className="babc-simple-subjects" aria-label="Your subject classes">{rows.map(a=><article className="babc-subject-choice" key={a.id}><span className="babc-choice-icon"><BookOpen size={22}/></span><div><h2>{a.subject} <span>{a.class_name}</span></h2><p>{a.students} students{actor.role==="academic_lead"?` · ${a.teacher_name}`:""}</p></div><div className="babc-subject-actions"><Link className="babc-btn babc-secondary" href={`/portal/office?view=registers&assignment=${a.id}&mode=attendance`}>Take attendance</Link><Link className="babc-btn babc-primary" href={`/portal/academics?class=${encodeURIComponent(a.class_name)}`}>Enter scores</Link></div></article>)}{!rows.length&&<Note>ICT will add your subjects and classes here. You do not need to set them up yourself.</Note>}</section>;
}

export function SimpleHome({actor}:{actor:Account}){
  const db=schoolDb(),teacher=actor.role==="teacher";
  const heading=teacher?"Your teaching day":actor.role==="principal"?"School administration":actor.role==="ict"?"School setup & access":actor.role==="bursar"?"Fees & school payments":"Academic review";
  if(teacher){const formClasses=db.formClasses(actor);return <><AttentionQueue actor={actor}/><Heading title={heading} description="Choose a subject, then take attendance or enter scores."/><div className="babc-simple-intro"><span className="babc-mini-avatar">{actor.name.split(" ").at(-1)?.slice(0,2).toUpperCase()}</span><p>Welcome, <strong>{actor.name}</strong>. Your assigned classes are ready below.</p></div>{formClasses.length>0&&<section className="babc-form-teacher-card"><span className="babc-choice-icon"><Users size={23}/></span><div><span>Class teacher duties</span><h2>{formClasses.join(", ")}</h2><p>Daily class attendance and progress across subjects.</p></div><Link href="/portal/office?view=myclass" className="babc-btn babc-dark">Open my class <ArrowRight size={15}/></Link></section>}<h2 className="babc-simple-section-title">My subjects</h2><SubjectChoices actor={actor}/><p className="babc-simple-help">You only enter scores for the subjects assigned to you. ICT handles changes to your class or subject assignments.</p></>;}
  const pending=(db.sql.prepare("SELECT count(*) n FROM accounts WHERE status='Pending'").get() as {n:number}).n;
  const approvals=(db.sql.prepare("SELECT count(*) n FROM payables WHERE status='Requested'").get() as {n:number}).n;
  const payments=(db.sql.prepare("SELECT count(*) n FROM payments WHERE status='Pending'").get() as {n:number}).n;
  const cards=actor.role==="principal"?[
    {title:"Students",text:"Find a student or check enrollment.",href:"/portal/office?view=students",label:"View students",icon:Users},
    {title:"Fees & receipts",text:"Check fees, balances, and payment receipts.",href:"/portal/office?view=finance",label:"Open fees",icon:Wallet},
    {title:"Payment approvals",text:approvals?`${approvals} request${approvals===1?"":"s"} need your decision.`:"No requests are waiting for your decision.",href:"/portal/office?view=purse",label:"Review requests",icon:ShieldCheck},
  ]:actor.role==="ict"?[
    {title:"Students",text:"Add students and give them an activation code.",href:"/portal/office?view=students",label:"Manage students",icon:Users},
    {title:"Staff & student access",text:pending?`${pending} student account${pending===1?"":"s"} waiting for approval.`:"Create staff accounts and manage portal access.",href:"/portal/office?view=ict",label:"Manage accounts",icon:MonitorCog},
    {title:"Teachers & classes",text:"Assign subjects and choose each class teacher.",href:"/portal/office?view=ict&task=teaching",label:"Assign teachers",icon:BookOpen},
  ]:actor.role==="bursar"?[
    {title:"Student fees",text:"Find a student, add a fee, or open a receipt.",href:"/portal/office?view=finance",label:"Open fee accounts",icon:Wallet},
    {title:"Payments to check",text:payments?`${payments} payment${payments===1?"":"s"} waiting for verification.`:"No payments are waiting for verification.",href:"/portal/office?view=finance#pending-payments",label:"Check payments",icon:ClipboardCheck},
    {title:"School payments",text:"Request expenses and record approved payouts.",href:"/portal/office?view=purse",label:"Open school purse",icon:ShieldCheck},
  ]:[
    {title:"Student results",text:"Review entered marks and publish student reports.",href:"/portal/office?view=results",label:"Review results",icon:GraduationCap},
    {title:"Subject classes",text:"Check the assigned classes and subject registers.",href:"/portal/office?view=subjects",label:"View subject classes",icon:BookOpen},
    {title:"School notices",text:"Share updates with teachers and students.",href:"/portal/office?view=notices",label:"Open noticeboard",icon:Users},
  ];
  return <DashboardOverview actor={actor}>{cards.map(c=><article className="babc-home-task" key={c.title}><span className="babc-choice-icon"><c.icon size={21}/></span><h2>{c.title}</h2><p>{c.text}</p><Link className="babc-btn babc-primary" href={c.href}>{c.label}<ArrowRight size={14}/></Link></article>)}</DashboardOverview>;
}

export function MyClass({actor,search}:{actor:Account;search:{class?:string;date?:string;tab?:string}}){
  const db=schoolDb(),available=db.formClasses(actor),className=available.includes(search.class||"")?search.class!:available[0];
  if(!className)return <Note>ICT has not assigned you class teacher duties. You can still use My subjects for your teaching work.</Note>;
  const date=/^\d{4}-\d{2}-\d{2}$/.test(search.date||"")&&!Number.isNaN(Date.parse(search.date!))?search.date!:today();
  const rows=db.formClassStudents(actor,className,date),tab=search.tab==="progress"?"progress":"attendance";
  const assessmentRecords=new AcademicRecords(db);
  const progress=tab==="progress"?assessmentRecords.list(actor).filter(a=>a.class_name===className):[];
  return <><div className="babc-class-context"><Users size={22}/><div><strong>{className}</strong><span>{rows.length} students · You are the class teacher</span></div></div><div className="babc-tabs"><Link className={tab==="attendance"?"selected":""} href={`/portal/office?view=myclass&class=${encodeURIComponent(className)}&date=${date}`}>Class attendance</Link><Link className={tab==="progress"?"selected":""} href={`/portal/office?view=myclass&class=${encodeURIComponent(className)}&tab=progress`}>Subject progress</Link></div>{tab==="attendance"?<Panel title="Daily class attendance" description="Mark your class once for the school day."><form className="babc-toolbar"><input type="hidden" name="view" value="myclass"/>{available.length>1?<label>My class<select name="class" defaultValue={className}>{available.map(c=><option key={c}>{c}</option>)}</select></label>:<input type="hidden" name="class" value={className}/>}<label>School date<input type="date" name="date" defaultValue={date} required/></label><button className="babc-btn babc-secondary">View this date</button></form><FormClassRegister key={`${className}-${date}`} className={className} date={date} rows={rows}/></Panel>:<><p className="babc-simple-help">Each subject teacher enters their own marks. Use this view to see what is ready and who to follow up with.</p><Panel title="Assessment progress"><div className="babc-table-wrap"><table className="babc-table"><thead><tr><th>Session / term</th><th>Assessment</th><th>Subject submissions</th><th>Class status</th><th/></tr></thead><tbody>{progress.map(p=>{const subjects=assessmentRecords.subjects(actor,p.id);return <tr key={p.id}><td>{p.session}<small>{p.term}</small></td><td>{p.kind}<small>Revision {p.revision}</small></td><td>{subjects.filter(s=>s.status==="Submitted").length} of {subjects.length} subjects submitted</td><td><Status>{p.status}</Status></td><td><Link className="babc-link" href={`/portal/academics?assessment=${p.id}`}>Review class results</Link></td></tr>;})}</tbody></table>{!progress.length&&<p className="babc-empty">The academic lead has not created an assessment for this class yet.</p>}</div></Panel></>}</>;
}
