"use client";
import { useActionState } from "react";
import type { School } from "@/lib/auth";
import { updateSchool } from "@/app/actions";
export function SchoolForm({ school }: { school: School }) {
  const [state, action, pending] = useActionState(updateSchool, {});
  return <form action={action} className="stack settings-form">
    <div className="form-grid"><label>School name<input name="name" defaultValue={school.name} required minLength={3} maxLength={120} /></label><label>City<input name="city" defaultValue={school.city} required minLength={2} maxLength={80} /></label><label>Contact email<input name="contact_email" type="email" defaultValue={school.contact_email ?? ""} maxLength={254} /></label><label>Contact phone<input name="contact_phone" type="tel" defaultValue={school.contact_phone} maxLength={24} /></label></div>
    <label>School address<textarea name="address" defaultValue={school.address} rows={3} maxLength={250} /></label>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    {state.success && <p className="form-success" role="status">{state.success}</p>}
    <div><button className="button primary" disabled={pending}>{pending ? "Saving…" : "Save school profile"}</button></div>
  </form>;
}
