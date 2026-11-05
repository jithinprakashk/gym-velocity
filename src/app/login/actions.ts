"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile, homeFor } from "@/lib/auth";
import { safeNext } from "@/lib/utils";

export type FormState = { error?: string; message?: string } | undefined;

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!identifier || !password) return { error: "Enter your email address and password." };
  if (!identifier.includes("@")) return { error: "Enter a valid email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: identifier.toLowerCase(), password });
  if (error) return { error: "Email address or password is incorrect." };

  const profile = await getSessionProfile();
  if (!profile) {
    await supabase.auth.signOut();
    return { error: "This account is not set up yet. Please contact the gym." };
  }
  if (!profile.is_active) redirect("/auth/inactive");

  // Only follow ?next= if it stays inside the person's own area.
  const area = profile.role === "admin" ? "/admin" : "/member";
  const target = safeNext(next, homeFor(profile.role));
  redirect(target.startsWith(area) ? target : homeFor(profile.role));
}
