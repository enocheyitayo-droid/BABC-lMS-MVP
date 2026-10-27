"use client";
import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { signIn } from "@/app/actions";
export function SignInForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(signIn, {});
  return <form action={action} className="stack">
    <label>Email address<input name="email" type="email" autoComplete="username" placeholder="you@example.com" required maxLength={254} disabled={!configured} /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} maxLength={128} required placeholder="Enter your password" disabled={!configured} /></label>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    <button className="button primary full" disabled={pending || !configured}>{pending ? <LoaderCircle className="spin" size={18} /> : <>Sign in to your school <ArrowRight size={18} /></>}</button>
    <p className="muted small">Access is by invitation. For an account or password reset, contact your school administrator.</p>
  </form>;
}
