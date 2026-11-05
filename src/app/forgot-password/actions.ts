"use server";

import { createClient } from "@/lib/supabase/server";
import type { FormState } from "../login/actions";

export async function requestReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return { error: "Enter the email address on your account." };

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site}/auth/callback?next=/set-password`,
  });
  // Same answer whether or not the email exists, so accounts can't be probed.
  return { message: "If that email has an account, a reset link is on its way. Check your inbox and spam folder." };
}
