import Link from "next/link";
import { ChevronDown, CircleHelp, ShieldCheck } from "lucide-react";
import { Sidebar } from "./sidebar";
import { branding } from "@/lib/branding";
import type { Membership } from "@/lib/auth";
import { roleLabels } from "@/lib/permissions";
import { selectSchool } from "@/app/actions";

export function Shell({ children, preview = false, membership, memberships = [] }: { children: React.ReactNode; preview?: boolean; membership?: Membership; memberships?: Membership[] }) {
  const school = membership?.schools;
  return <div className="app-shell"><Sidebar preview={preview} admin={membership?.role === "school_admin"} schoolName={school?.name} />
    <div className="workspace"><header className="topbar"><div className="school-location"><span className="location-dot" />{school?.name ?? branding.name}<span className="location-city">{school?.city ?? branding.city}</span></div>
      <div className="topbar-tools"><Link className="icon-button" aria-label="Help and setup" href="/guide"><CircleHelp size={20} /></Link><span className="topbar-rule" /><span className="user-avatar">{preview ? "TV" : membership?.role === "guardian" ? "PG" : "ST"}</span><div className="user-info"><strong>{preview ? "School preview" : roleLabels[membership!.role]}</strong><small>{preview ? "Not connected" : "Verified school access"}</small></div><ChevronDown size={14} /></div>
    </header>
    {memberships.length > 1 && <form action={selectSchool} className="school-switch"><label>Active school <select name="school_id" defaultValue={membership?.school_id}>{memberships.map(m => <option key={m.id} value={m.school_id}>{m.schools.name}</option>)}</select></label><button className="button secondary" type="submit">Switch school</button></form>}
    {children}
    <footer className="workspace-footer"><span>{school?.name ?? branding.name} · {school?.city ?? branding.city}</span><span><ShieldCheck size={14} />{preview ? "Preview workspace · No pupil data" : "Private school workspace"}</span></footer>
    </div></div>;
}
