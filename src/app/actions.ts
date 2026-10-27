"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { getIdentity, requirePermission } from "@/lib/auth";
import { schoolSchema, signInSchema } from "@/lib/validation";

export type FormState = { error?: string; success?: string };

export async function signIn(_state: FormState, form: FormData): Promise<FormState> {
  if (!supabaseConfig()) return { error: "School access is being set up. Contact your administrator." };
  const parsed = signInSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter a valid email and a password of at least 8 characters." };
  const client = await createClient();
  const { error } = await client.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Sign-in failed. Check your details or contact your administrator. Please wait before retrying repeatedly." };
  redirect("/dashboard");
}

export async function signOut() {
  if (supabaseConfig()) {
    const client = await createClient();
    const { error } = await client.auth.signOut();
    if (error) throw new Error("Sign-out failed. Please try again.");
  }
  (await cookies()).delete("school_id");
  redirect("/login");
}

export async function selectSchool(form: FormData) {
  const { memberships } = await getIdentity();
  const schoolId = String(form.get("school_id") ?? "");
  if (!memberships.some(m => m.school_id === schoolId)) throw new Error("School access denied.");
  (await cookies()).set("school_id", schoolId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function updateSchool(_state: FormState, form: FormData): Promise<FormState> {
  const { client, school } = await requirePermission("school:configure");
  const parsed = schoolSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error, data } = await client.from("schools").update({ ...parsed.data, contact_email: parsed.data.contact_email || null })
    .eq("id", school.id).select("id").single();
  if (error || !data) return { error: "Changes could not be saved. Check your access and try again." };
  revalidatePath("/dashboard", "layout");
  return { success: "School profile saved." };
}
