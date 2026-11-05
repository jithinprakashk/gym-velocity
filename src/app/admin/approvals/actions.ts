"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string; message?: string } | undefined;
export async function approveRegistration(_prev: State, fd: FormData): Promise<State> {
  await requireRole("admin");
  const p = z.object({ request_id: z.string().uuid(), plan_id: z.string().uuid(), fee: z.coerce.number().nonnegative() }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Choose a valid plan and fee." };
  const { error } = await (await createClient()).rpc("approve_registration", { p_request_id: p.data.request_id, p_plan_id: p.data.plan_id, p_fee: p.data.fee });
  if (error) return { error: error.message };
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/members");
  return { message: "Registration approved and membership created." };
}
export async function reviewClaim(_prev: State, fd: FormData): Promise<State> {
  await requireRole("admin");
  const p = z.object({ claim_id: z.string().uuid(), status: z.enum(["approved", "rejected"]) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Invalid payment claim." };
  const { error } = await (await createClient()).rpc("review_payment_claim", { p_claim_id: p.data.claim_id, p_status: p.data.status });
  if (error) return { error: error.message };
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/payments");
  return { message: `Payment claim ${p.data.status}.` };
}
