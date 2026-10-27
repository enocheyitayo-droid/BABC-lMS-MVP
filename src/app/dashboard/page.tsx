import { Overview } from "@/components/overview";
import { getContext } from "@/lib/auth";
import { can, roleLabels, type Role } from "@/lib/permissions";
export default async function Dashboard({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { client, school, membership } = await getContext();
  const { section } = await searchParams;
  const admin = can(membership.role, "staff:read");
  let teamCount: number | undefined;
  if (admin) {
    const { count, error } = await client.from("school_memberships").select("id", { count: "exact", head: true }).eq("school_id", school.id).eq("active", true);
    if (error) throw new Error("School team count could not be loaded.");
    teamCount = count ?? 0;
  }
  if (section === "team" && admin) {
    const { data, error } = await client.from("school_memberships").select("id, role, active, profiles(display_name)").eq("school_id", school.id).order("created_at");
    if (error) throw new Error("School team could not be loaded.");
    const members = data as unknown as { id: string; role: Role; active: boolean; profiles: { display_name: string } | null }[];
    return <main id="main-content" className="main-content"><div className="page-heading"><div><div className="breadcrumb">Workspace / School team</div><h1>Your school team</h1><p>Memberships for {school.name}. Account invitations are managed by the platform operator in this phase.</p></div></div><section className="panel table-wrapper"><table><thead><tr><th>Name</th><th>Role</th><th>Status</th></tr></thead><tbody>{members.map(m => <tr key={m.id}><td>{m.profiles?.display_name || "Invited member"}</td><td>{roleLabels[m.role]}</td><td><span className="soft-badge">{m.active ? "Active" : "Inactive"}</span></td></tr>)}</tbody></table></section></main>;
  }
  return <Overview schoolName={school.name} role={membership.role} teamCount={teamCount} profileComplete={Boolean(school.address && school.contact_email && school.contact_phone)}/>;
}
