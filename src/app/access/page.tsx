import { getIdentity } from "@/lib/auth";
import { signOut } from "@/app/actions";
import { Brand } from "@/components/brand";
export default async function Access() {
  await getIdentity();
  return <main id="main-content" className="standalone"><Brand/><h1>Your account is ready.<br/>Your school access is pending.</h1><p>Ask your school administrator to confirm your active school membership. A signed-in account alone does not grant access to pupil or financial records.</p><form action={signOut}><button className="button primary">Sign out</button></form></main>;
}
