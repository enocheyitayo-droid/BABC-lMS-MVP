import Link from "next/link";
import { Brand } from "@/components/brand";
import { SignInForm } from "@/components/sign-in-form";
import { supabaseConfig } from "@/lib/supabase/config";
import { ShieldCheck, ArrowLeft, Sprout } from "lucide-react";
export const metadata = { title: "Staff & parent sign in" };
export default function Login() {
  const configured = Boolean(supabaseConfig());
  return <main id="main-content" className="login-page"><section className="login-story"><Brand/><div><Sprout size={40}/><h1>Every child.<br/>Every school day.<br/>Every possibility.</h1><p>A shared home for the people who make school life happen.</p></div><span>Teamville Montessori School · Ibadan</span></section><section className="login-side"><Link href="/preview" className="text-link"><ArrowLeft size={16}/>View the workspace preview</Link><div className="login-card"><span className="login-lock"><ShieldCheck size={26}/></span><h2>Welcome to Teamville</h2><p className="muted">Sign in with your school account.</p>{!configured && <div className="setup-message">School access is being prepared. Sign-in becomes available once your administrator connects the database. <Link href="/guide">View setup guide</Link>.</div>}<SignInForm configured={configured}/></div><small className="muted">Your account only opens the schools and records you’re authorised to access.</small></section></main>;
}
