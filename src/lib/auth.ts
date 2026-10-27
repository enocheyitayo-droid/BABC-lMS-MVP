import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { supabaseConfig } from "./supabase/config";
import { can, type Permission, type Role } from "./permissions";

export type School = { id: string; name: string; city: string; address: string; contact_email: string | null; contact_phone: string; active: boolean; logo_path: string | null };
export type Membership = { id: string; school_id: string; user_id: string; role: Role; active: boolean; schools: School };

export const getIdentity = cache(async () => {
  if (!supabaseConfig()) redirect("/login?status=setup");
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  const { data, error: membershipError } = await client.from("school_memberships")
    .select("id, school_id, user_id, role, active, schools(id, name, city, address, contact_email, contact_phone, active, logo_path)")
    .eq("user_id", user.id).eq("active", true).order("created_at");
  if (membershipError) throw new Error("School access could not be loaded. Check the database migration and connection.");
  const memberships = (data as unknown as Membership[]).filter(m => m.schools?.active);
  return { client, user, memberships };
});

export const getContext = cache(async () => {
  const identity = await getIdentity();
  const selected = (await cookies()).get("school_id")?.value;
  const membership = identity.memberships.find(m => m.school_id === selected) ?? identity.memberships[0];
  if (!membership) redirect("/access");
  return { ...identity, membership, school: membership.schools };
});

export async function requirePermission(permission: Permission) {
  const context = await getContext();
  if (!can(context.membership.role, permission)) throw new Error("You do not have permission to perform this action.");
  return context;
}
