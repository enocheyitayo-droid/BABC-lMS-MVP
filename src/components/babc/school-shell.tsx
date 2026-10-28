import Image from "next/image";

import Link from "next/link";

import { Bell, Search, BookOpen, CircleHelp, ClipboardList, GraduationCap, Landmark, LayoutDashboard, LogOut, MonitorCog, ReceiptText, ShieldCheck, Users, Wallet, Video } from "lucide-react";

import { type Account, schoolRoleLabels } from "@/lib/babc/database";

import { demoBabc, logoutBabc } from "@/lib/babc/actions";

import { babcDemoEnabled,schoolDb } from "@/lib/babc/server";

import { navigationFor,type PortalLink } from "@/lib/babc/navigation";

const icons={home:LayoutDashboard,students:Users,fees:Landmark,purse:Wallet,results:GraduationCap,subjects:BookOpen,class:ClipboardList,access:MonitorCog,notices:BookOpen,activity:ShieldCheck,salary:Users,debtors:ReceiptText,collaboration:Video};

export function SchoolShell({account,view,children}:{account:Account;view:string;children:React.ReactNode}) {

  const student=account.role==="student";
  const session=(schoolDb().sql.prepare("SELECT value FROM school_settings WHERE key='session'").get() as {value:string}).value;

  const hasClass=account.role==="teacher"&&schoolDb().formClasses(account).length>0;

  const {primary,more}=navigationFor(account.role,hasClass);

  const activeView=view==="registers"?"subjects":view;

  const navLink=(link:PortalLink)=>{const Icon=icons[link.icon];return <Link key={link.key} className={`babc-nav-item ${activeView===link.key?"active":""}`} href={link.href} aria-current={activeView===link.key?"page":undefined}><Icon size={18}/>{link.name}</Link>;};

  return <div className="babc-app babc-office babc-modern"><aside className="babc-sidebar"><Link href={student?"/portal/student":account.role==="parent"?"/portal/parent":"/portal/office"} className="babc-brand"><Image src="/brand/babc-logo.png" alt="BABC crest" width={49} height={49}/><span><strong>Bodija-Ashi<br/>Baptist College</strong><small>{student?"Student portal":"School workspace"}</small></span></Link><div className="babc-workspace-switch"><span className="babc-school-mini"><GraduationCap size={19}/></span><span><strong>{account.role==="teacher"?"Teacher workspace":schoolRoleLabels[account.role]}</strong><small>{session} session</small></span><ShieldCheck size={16}/></div><nav aria-label="School portal navigation">{primary.map(navLink)}{more.length>0&&<details className="babc-more-tools" open={more.some(link=>link.key===activeView)}><summary>More tools</summary>{more.map(navLink)}</details>}</nav><div className="babc-sidebar-bottom"><p className="babc-role-help">{account.role==="teacher"?(hasClass?"Use My subjects for teaching. My class is for your class teacher duties.":"Choose one of your subjects to take attendance or enter scores."):"Your everyday tasks are above. Find occasional tasks in More tools."}</p><form action={logoutBabc}><button className="babc-nav-item"><LogOut size={18}/>Sign out</button></form><div className="babc-sidebar-footer">Faith, Excellence & Integrity</div></div></aside><div className="babc-workspace"><header className="babc-topbar"><div className="babc-breadcrumb"><span>School portal</span><strong>{view==="overview"?"Dashboard":account.role==="teacher"?"Teacher workspace":schoolRoleLabels[account.role]}</strong></div>{["principal","ict","academic_lead","bursar"].includes(account.role)&&<form action="/portal/office" className="babc-header-search"><input type="hidden" name="view" value={account.role==="bursar"?"finance":"students"}/><Search size={16}/><input name="q" aria-label="Search students" placeholder="Search students…"/><button aria-label="Find students"><Search size={16}/></button></form>}<Link href={student?"/portal/student?tab=notices":account.role==="parent"?"/portal/parent":"/portal/office?view=notices"} className="babc-header-bell" aria-label="School notices"><Bell size={19}/></Link><div className="babc-profile"><span className="babc-avatar">{account.name.split(/[ ,]+/).filter(Boolean).map(n=>n[0]).slice(0,2).join("")}</span><span><strong>{account.name}</strong><small>{student?schoolDb().student(account,account.student_id!).admission:account.email}</small></span><form className="babc-mobile-signout" action={logoutBabc}><button className="babc-icon" aria-label="Sign out"><LogOut size={18}/></button></form></div></header><div className="babc-demo-bar"><span><span className="babc-dot"/>{babcDemoEnabled()?"School demonstration · fictional records":"Private school workspace"}</span>{account.demo===1&&babcDemoEnabled()&&<details className="babc-demo-role-details"><summary>Try another role</summary><form action={demoBabc} className="babc-office-role"><label htmlFor="school-role">Demo role</label><select name="role" id="school-role" defaultValue={account.role}>{["principal","ict","bursar","academic_lead","teacher","student"].map(r=><option value={r} key={r}>{schoolRoleLabels[r as keyof typeof schoolRoleLabels]}</option>)}</select><button>Open workspace</button></form></details>}</div><div className="babc-mobile-navigation"><div className="babc-mobile-nav">{primary.map(link=><Link key={link.key} href={link.href} className={activeView===link.key?"selected":""}>{link.name}</Link>)}</div>{more.length>0&&<details className="babc-mobile-more"><summary>More</summary><nav aria-label="More school tools">{more.map(navLink)}</nav></details>}</div>{children}<footer className="babc-footer babc-office-footer"><span>© 2026 Bodija-Ashi Baptist College</span><span><CircleHelp size={12}/> Need help? Contact ICT.</span></footer></div></div>;

}
