"use client";

import { useState } from "react";
import {useFormStatus} from "react-dom";
import { ArrowRight } from "lucide-react";
import { loginBabc } from "@/lib/babc/actions";

const demoAccounts = [
  { role: "Principal", username: "principal@babc.school" },
  { role: "ICT administrator", username: "ict@babc.school" },
  { role: "Bursar", username: "bursar@babc.school" },
  { role: "Academic lead", username: "academic@babc.school" },
  { role: "Subject & class teacher", username: "teacher@babc.school" },
  { role: "Student", username: "BABC26003" },
];

function SignInButton(){const {pending}=useFormStatus();return <button className="babc-btn babc-primary" disabled={pending} aria-busy={pending}>{pending?"Signing in…":"Sign in to your portal"} <ArrowRight size={16}/></button>;}

export function PortalSignIn({ showDemo }: { showDemo: boolean }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  return <>
    <form action={loginBabc} className="babc-login-fields">
      <label>Staff email or student admission number<input name="identifier" autoComplete="username" placeholder="Staff email or BABC26003" required maxLength={254} value={identifier} onChange={e => {setIdentifier(e.target.value);setSelectedRole("");}} /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required maxLength={128} value={password} onChange={e => setPassword(e.target.value)} /></label>
      <SignInButton/>
    </form>
    {showDemo && <section className="babc-demo-credentials" aria-labelledby="demo-credentials-title">
      <h3 id="demo-credentials-title">Demo logins</h3>
      <p>Try any role with fictional school records. Password for every account: <strong>EYITAYO</strong></p>
      <div className="babc-demo-account-list">{demoAccounts.map(account => <button type="button" className="babc-demo-account" key={account.username} onClick={() => {setIdentifier(account.username);setPassword("EYITAYO");setSelectedRole(account.role);}} aria-label={`Fill ${account.role} demo login`}>
        <span><strong>{account.role}</strong><code>{account.username}</code></span><ArrowRight size={15}/>
      </button>)}</div>
      <span className="babc-demo-selected" role="status">{selectedRole ? `${selectedRole} details filled. Press Sign in above.` : "Choose a role to fill the sign-in form above."}</span>
    </section>}
  </>;
}
