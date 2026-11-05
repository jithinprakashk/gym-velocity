"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string; message?: string } | undefined;
export async function submitPaymentClaim(_prev: State, fd: FormData): Promise<State> {
  await requireRole("member");
  const p = z.object({
    membership_id: z.string().uuid(), method: z.enum(["cash", "upi", "bank", "other"]),
    reference: z.string().trim().max(100), notes: z.string().trim().max(300),
  }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Check the payment details." };
  const supabase = await createClient();
  const { data: memberId } = await supabase.rpc("my_member_id");
  if (!memberId) return { error: "Your membership is not approved yet." };
  const { error } = await supabase.rpc("submit_payment_claim", {
    p_membership_id: p.data.membership_id, p_method: p.data.method,
    p_reference: p.data.reference, p_notes: p.data.notes,
  });
  if (error) return { error: "Could not submit the payment claim." };
  revalidatePath("/member/dashboard");
  return { message: "Payment submitted for admin approval." };
}
