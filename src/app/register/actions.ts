"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";

export type RegisterState = { error?: string } | undefined;

export async function registerMember(_prev: RegisterState, fd: FormData): Promise<RegisterState> {
  const parsed = z.object({
    full_name: z.string().trim().min(1, "Enter your name.").max(120),
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    phone: z.string().trim().transform((v) => normalizePhone(v) ?? "").refine(Boolean, "Enter a 10-digit mobile number."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirm: z.string(),
    address: z.string().trim().max(300),
    plan_id: z.string().uuid("Choose a membership plan."),
  }).superRefine((v, ctx) => {
    if (v.password !== v.confirm) ctx.addIssue({ code: "custom", path: ["confirm"], message: "Passwords do not match." });
  }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const v = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: v.email,
    password: v.password,
    options: { data: { full_name: v.full_name, phone: v.phone, address: v.address, plan_id: v.plan_id } },
  });
  if (error || !data.user) {
    const reason = error?.message?.trim();
    if (reason && /profiles_phone_key|phone.*duplicate|duplicate.*phone/i.test(reason)) {
      return { error: "That mobile number is already registered." };
    }
    if (reason && /email signups are disabled|email signup is disabled/i.test(reason)) {
      return { error: "Email signups are disabled. An administrator must enable email sign-ups in Supabase Authentication settings." };
    }
    if (reason && /already|registered|exists|duplicate/i.test(reason)) {
      return { error: "That email address is already registered." };
    }
    return {
      error: reason
        ? `Could not create your account: ${reason}`
        : "Could not create your account because Supabase did not return a user. Check Email authentication and the Supabase URL/key.",
    };
  }
  if (!data.session) redirect("/login?notice=verify");
  redirect("/member/dashboard");
}
