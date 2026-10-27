import { Megaphone } from "lucide-react";
import { DemoPanel, Feedback, PageTitle } from "@/components/demo/ui";
import { publishNotice } from "@/lib/demo/actions";
import { db, requireDemo } from "@/lib/demo/store";
export default async function NoticesPage({searchParams}:{searchParams:Promise<{error?:string;success?:string}>}) {
  const context=await requireDemo(),search=await searchParams;
  const notices=db().prepare("SELECT id,title,message,created_at FROM notices WHERE workspace=? ORDER BY created_at DESC,rowid DESC").all(context.id) as {id:string;title:string;message:string;created_at:string}[];
  return <main id="main-content" className="main-content"><PageTitle title="School noticeboard" description="Keep every family and member of staff in the loop."/><Feedback {...search}/>{context.role==="school_admin"&&<DemoPanel title="Share a school announcement" description="Notices are visible to every role in this demonstration workspace."><form action={publishNotice} className="stack settings-form"><label>Title<input name="title" required minLength={3} maxLength={100} placeholder="What should the school community know?"/></label><label>Announcement<textarea name="message" rows={4} required minLength={10} maxLength={2000} placeholder="Add the details. Avoid sensitive pupil information."/></label><div><button className="button primary"><Megaphone size={16}/>Publish announcement</button></div></form></DemoPanel>}<div className="notices-feed">{notices.map(n=><article className="panel notice-card" key={n.id}><span className="metric-icon purple"><Megaphone size={18}/></span><div><small>School announcement · {n.created_at.slice(0,10)}</small><h2>{n.title}</h2><p>{n.message}</p></div></article>)}</div></main>;
}
