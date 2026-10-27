import Link from "next/link";
import { ArrowRight, UsersRound, GraduationCap, CalendarCheck, Wallet, Check, ArrowUpRight, Settings2, ShieldCheck, LockKeyhole, Sprout, BookOpen, Circle, CheckCircle2, Database, BadgeCheck } from "lucide-react";
import { branding } from "@/lib/branding";
import type { Role } from "@/lib/permissions";

const phases = [
  { name: "School foundation", detail: "Identity, access & school setup", phase: 1 },
  { name: "People & admissions", detail: "Pupils, guardians & classes", phase: 2 },
  { name: "Learning & attendance", detail: "Registers, results & report cards", phase: 3 },
  { name: "Finance & accountability", detail: "Fees, payments & receipts", phase: 4 },
  { name: "Communication & expenses", detail: "Notices, support & approvals", phase: 5 },
  { name: "Records & pilot launch", detail: "History, hardening & onboarding", phase: 6 },
];
export function Overview({ preview = false, schoolName = branding.name, role, teamCount, profileComplete = false, section }: { preview?: boolean; schoolName?: string; role?: Role; teamCount?: number; profileComplete?: boolean; section?: string }) {
  const admin = preview || role === "school_admin";
  const settingsHref = preview ? "/preview?section=settings" : "/dashboard/settings";
  const today = new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" }).format(new Date());
  return <main className="main-content" id="main-content">
    {preview && <div className="preview-banner"><span><Database size={16} /><strong>Setup preview</strong> No database connected. No school records are shown.</span><Link href="/guide">Connect your school <ArrowRight size={14} /></Link></div>}
    <div className="page-heading"><div><div className="breadcrumb">Workspace <span>/</span> Overview</div><h1>{preview ? "A good beginning starts here." : "Welcome to your school workspace."}</h1><p>One place to care for every part of school life.</p></div><div className="date-label">{today}</div></div>
    <section className="welcome-panel" aria-label="Welcome"><div className="welcome-copy"><span className="term-pill"><Sprout size={14} /> Built around your school</span><h2>Small beginnings.<br />Brighter futures.</h2><p>{schoolName}’s home for people, learning, and everyday school life.</p><Link className="button white" href={admin ? settingsHref : "/guide"}>{admin ? "Set up your school" : "Explore the setup guide"}<ArrowRight size={16} /></Link></div><div className="school-art" role="img" aria-label="Illustration of a school with colourful Montessori learning blocks"><div className="art-sun"/><div className="art-spark one">✦</div><div className="art-spark two">✦</div><div className="art-cloud"/><div className="school-building"><div className="school-roof"/><div className="school-name">TEAMVILLE</div><div className="school-windows"><i/><i/><i/></div><div className="school-door"/></div><div className="block block-a">a</div><div className="block block-b">b</div><div className="block block-c">c</div><div className="art-ground"/><div className="art-plant"><span/><span/><span/></div></div></section>
    <section className="metrics" aria-label="School metrics">{[
      { label: "Pupils enrolled", icon: GraduationCap, color: "purple", value: "—", note: "Admissions opens in phase 2" },
      { label: "School accounts", icon: UsersRound, color: "blue", value: preview || !admin ? "—" : String(teamCount ?? 0), note: preview ? "Connect to view your team" : admin ? "Active school memberships" : "Visible to administrators" },
      { label: "Attendance today", icon: CalendarCheck, color: "green", value: "—", note: "Attendance opens in phase 3" },
      { label: "Verified fees collected", icon: Wallet, color: "gold", value: "—", note: "Finance opens in phase 4" },
    ].map(item => <div className="metric" key={item.label}><div className="metric-label">{item.label}<span className={`metric-icon ${item.color}`}><item.icon size={18}/></span></div><strong>{item.value}</strong><small>{item.note}</small></div>)}</section>
    {(section === "settings" || section === "team") && preview && <section className="panel connection-note"><LockKeyhole size={22}/><div><h3>{section === "settings" ? "Your school, your identity" : "Bring your school team together"}</h3><p>{section === "settings" ? "School profile editing becomes available after a database and an administrator account are connected. The supplied school logo is included in the workspace." : "Real staff accounts appear here after an administrator connects the school. No sample staff have been created."}</p><Link href="/guide" className="text-link">Read the connection guide <ArrowRight size={15}/></Link></div></section>}
    <div className="overview-grid"><section className="panel getting-started"><div className="panel-heading"><div><h3>Let’s get your school ready</h3><p>A few essentials before the first school day.</p></div><span className="soft-badge">Phase 1</span></div>
      <div className="setup-progress"><span>{preview ? "0 of 3" : profileComplete ? "3 of 3" : "2 of 3"} essentials ready</span><div className="progress-track"><span style={{ width: preview ? "0%" : profileComplete ? "100%" : "66.66%" }}/></div></div>
      {[
        { title: "Connect your school workspace", detail: "A private database for your school’s records.", ready: !preview, href: "/guide", icon: Database },
        { title: "Confirm administrator access", detail: "Keep school management in authorised hands.", ready: !preview, href: preview ? "/login" : "/dashboard?section=team", icon: BadgeCheck },
        { title: "Complete your school profile", detail: "School name, address, and approved contacts.", ready: !preview && profileComplete, href: admin ? settingsHref : "/guide", icon: Settings2 },
      ].map(item => <Link key={item.title} href={item.href} className="setup-row"><span className={`setup-icon ${item.ready ? "ready" : ""}`}>{item.ready ? <Check size={18}/> : <item.icon size={18}/>}</span><span className="setup-text"><strong>{item.title}</strong><small>{item.detail}</small></span>{item.ready ? <span className="ready-label">Ready</span> : <ArrowUpRight size={18}/>}</Link>)}
    </section>
    <section className="panel access-panel"><div className="panel-heading"><div><h3>A place for everyone</h3><p>The right access for each person.</p></div><ShieldCheck size={20} className="muted"/></div><div className="access-row"><span className="access-initial purple">A</span><div><strong>School administration</strong><small>School setup, admissions & oversight</small></div></div><div className="access-row"><span className="access-initial green">T</span><div><strong>Teachers</strong><small>Assigned classes, attendance & results</small></div></div><div className="access-row"><span className="access-initial gold">F</span><div><strong>Finance team</strong><small>Fees, receipts & accountable approvals</small></div></div><div className="access-row"><span className="access-initial blue">P</span><div><strong>Parents & guardians</strong><small>Only their verified, linked children</small></div></div><div className="access-footnote"><LockKeyhole size={15}/>Separate access. Shared commitment.</div></section></div>
    <section className="panel roadmap"><div className="panel-heading"><div><h3>Growing with your school</h3><p>The implementation roadmap. Later modules are not enabled yet.</p></div><Link href="/guide" className="text-link">View guide <ArrowRight size={15}/></Link></div><div className="phase-list">{phases.map(item => <div className={`phase-item ${item.phase === 1 ? "current" : ""}`} key={item.phase}><div className="phase-line">{item.phase === 1 ? <CheckCircle2 size={19}/> : <Circle size={19}/>}<small>Phase {item.phase}</small></div><strong>{item.name}</strong><p>{item.detail}</p><span>{item.phase === 1 ? preview ? "Ready to connect" : "Foundation connected" : "Planned"}</span></div>)}</div></section>
    <div className="bottom-note"><BookOpen size={17}/><span>Built for the everyday work that helps children thrive.</span><span className="brand-colors"><i/><i/><i/></span></div>
  </main>;
}
