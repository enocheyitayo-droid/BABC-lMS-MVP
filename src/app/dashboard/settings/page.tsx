import { redirect } from "next/navigation";
import { getContext } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { SchoolForm } from "@/components/school-form";
import { ShieldCheck, ImageIcon } from "lucide-react";
export default async function Settings() {
  const { school, membership } = await getContext();
  if (!can(membership.role, "school:configure")) redirect("/dashboard");
  return <main id="main-content" className="main-content"><div className="page-heading"><div><div className="breadcrumb">Workspace / School settings</div><h1>Your school, your identity.</h1><p>Approved details used throughout your school workspace.</p></div></div><section className="panel"><div className="panel-heading"><div><h3>School profile</h3><p>Changes are recorded in your school’s audit history.</p></div><ShieldCheck size={22}/></div><SchoolForm school={school}/></section><section className="panel connection-note"><ImageIcon size={24}/><div><h3>Official school crest</h3><p>The supplied Teamville Montessori School logo is used throughout the workspace and printed school documents.</p></div></section></main>;
}
