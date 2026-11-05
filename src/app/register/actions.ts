"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone, toAuthPhone } from "@/lib/phone";

export type RegisterState = { error?: string } | undefined;

export async function registerMember(_prev: RegisterState, fd: FormData): Promise<RegisterState> {
  const parsed = z.object({
    full_name: z.string().trim().min(1, "Enter your name.").max(120),
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
    phone: toAuthPhone(v.phone),
    password: v.password,
    options: { data: { full_name: v.full_name, phone: v.phone, address: v.address, plan_id: v.plan_id } },
  });
  if (error || !data.user) return { error: /already|registered|exists/i.test(error?.message ?? "") ? "That phone number is already registered." : "Could not create your account." };
  if (!data.session) redirect("/login?notice=registered");
  redirect("/member/dashboard");
}
