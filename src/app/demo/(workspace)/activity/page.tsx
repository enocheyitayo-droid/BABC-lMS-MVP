import { DemoPanel, Empty, PageTitle } from "@/components/demo/ui";
import { db, requireDemo } from "@/lib/demo/store";
import { roleLabels, type Role } from "@/lib/permissions";
export default async function ActivityPage() {
  const context=await requireDemo(["school_admin"]);
  const activity=db().prepare("SELECT id,role,action,created_at FROM activity WHERE workspace=? ORDER BY created_at DESC,rowid DESC LIMIT 100").all(context.id) as {id:string;role:Role;action:string;created_at:string}[];
  return <main id="main-content" className="main-content"><PageTitle title="Activity & audit trail" description="A traceable record of the actions that shape your school’s records."/><DemoPanel title="Recent activity" description="Latest 100 saved actions in this demonstration."><div className="table-wrapper"><table><thead><tr><th>Time (UTC)</th><th>Role</th><th>Action</th></tr></thead><tbody>{activity.map(a=><tr key={a.id}><td>{a.created_at}</td><td>{roleLabels[a.role]}</td><td className="activity-action">{a.action}</td></tr>)}</tbody></table></div>{!activity.length&&<Empty text="Saved actions will appear here."/>}</DemoPanel><p className="page-footnote">Demo audit entries are local records. Production audit storage must prevent alteration by ordinary application users.</p></main>;
}
