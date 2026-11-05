"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { endOfPeriod, todayIST } from "@/lib/format";
import { normalizePhone, toAuthPhone } from "@/lib/phone";

type State = { error?: string; message?: string; data?: Record<string, string> } | undefined;

// ---------- helpers ----------
const blank = (v: unknown) => (v === "" || v == null ? undefined : v);
const text = (max = 300) => z.preprocess((v) => (typeof v === "string" ? v.trim() || undefined : v), z.string().max(max).optional());
const reqText = (label: string, max = 120) => z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(max);
const money = z.preprocess(blank, z.coerce.number().min(0, "Amounts cannot be negative").max(10_000_000).optional());
const int = z.preprocess(blank, z.coerce.number().int().positive().optional());
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");
const optDate = z.preprocess(blank, date.optional());
const optId = z.preprocess(blank, z.string().uuid().optional());
const id = z.string().uuid("Invalid record");
const phone10 = z.preprocess(
  (v) => (typeof v === "string" ? (normalizePhone(v) ?? v) : v),
  z.string({ error: "Enter a 10-digit mobile number" }).regex(/^\d{10}$/, "Enter a 10-digit mobile number"),
);

function firstError(e: z.ZodError) {
  return e.issues[0]?.message ?? "Please check the form.";
}
function dbError(e: { code?: string; message: string }) {
  // Our own functions raise readable messages (P0001); anything else stays generic.
  return e.code === "P0001" || e.code === "42501" ? e.message : "Something went wrong. Please try again.";
}
function tempPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 16 }, () => chars[randomInt(chars.length)]).join("");
}

const termsShape = {
  plan_id: optId,
  model: z.preprocess(blank, z.enum(["calendar", "working_days"]).optional()),
  start_date: date,
  end_date: optDate,
  total_days: int,
  fee: money,
  discount: money,
  extra_charges: money,
  notes: text(500),
};

type Supa = Awaited<ReturnType<typeof createClient>>;

/** Fills blanks from the chosen plan and returns arguments for create_membership(). */
async function resolveTerms(supabase: Supa, t: z.infer<z.ZodObject<typeof termsShape>>) {
  let plan: { model: string; default_fee: number; duration_months: number | null; total_days: number | null } | null = null;
  if (t.plan_id) {
    const { data } = await supabase.from("membership_plans").select("model, default_fee, duration_months, total_days").eq("id", t.plan_id).maybeSingle();
    plan = data;
    if (!plan) return { error: "That plan was not found." };
  }
  const model = plan?.model ?? t.model;
  if (!model) return { error: "Choose a plan or a membership model." };
  const fee = t.fee ?? (plan ? Number(plan.default_fee) : undefined);
  if (fee === undefined) return { error: "Enter the membership fee." };
  const discount = t.discount ?? 0;
  const extra = t.extra_charges ?? 0;
  if (discount > fee + extra) return { error: "Discount cannot be more than the fee plus extra charges." };

  let end: string | null = null;
  let totalDays: number | null = null;
  if (model === "calendar") {
    end = t.end_date ?? (plan?.duration_months ? endOfPeriod(t.start_date, plan.duration_months) : null);
    if (!end) return { error: "Enter the end date for a calendar membership." };
    if (end < t.start_date) return { error: "The end date must be on or after the start date." };
  } else {
    totalDays = t.total_days ?? plan?.total_days ?? null;
    if (!totalDays) return { error: "Enter the number of gym days." };
  }
  return {
    args: {
      p_plan_id: t.plan_id ?? null, p_model: model, p_start: t.start_date, p_end: end, p_total_days: totalDays,
      p_fee: fee, p_discount: discount, p_extra: extra, p_notes: t.notes ?? null,
    },
  };
}

// ---------- members ----------
const createMemberSchema = z.object({
  full_name: reqText("Name"),
  phone: phone10,
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  address: text(300),
  joined_on: date,
  ...termsShape,
  pay_amount: money,
  pay_method: z.preprocess(blank, z.enum(["cash", "upi", "bank", "other"]).optional()),
  pay_reference: text(100),
});

export async function createMember(_prev: State, fd: FormData): Promise<State> {
  await requireRole("admin");
  const parsed = createMemberSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const v = parsed.data;

  const supabase = await createClient();
  const terms = await resolveTerms(supabase, v);
  if (terms.error || !terms.args) return { error: terms.error };

  // 1. login account (server-only, secret key)
  const admin = createAdminClient();
  const password = tempPassword();
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    phone: toAuthPhone(v.phone), phone_confirm: true, password,
    ...(v.email ? { email: v.email, email_confirm: true } : {}),
    user_metadata: { full_name: v.full_name, phone: v.phone },
  });
  if (authErr || !created.user) {
    return { error: /already|registered|exists/i.test(authErr?.message ?? "") ? "That mobile number or email already has an account." : "Could not create the login. Check the phone sign-in setting in Supabase (see SETUP.md)." };
  }
  const userId = created.user.id;

  // 2. member record
  const { data: memberId, error: mErr } = await supabase.rpc("create_member_record", {
    p_user_id: userId, p_full_name: v.full_name, p_phone: v.phone, p_address: v.address ?? null, p_joined_on: v.joined_on ?? todayIST(),
  });
  if (mErr || !memberId) {
    await admin.auth.admin.deleteUser(userId); // nothing else was saved yet, so clean up
    return { error: mErr ? dbError(mErr) : "Could not create the member." };
  }
  revalidatePath("/admin/members");
  const data = { tempPassword: password, login: v.phone, memberId: String(memberId) };

  // 3. first membership
  const { data: membershipId, error: msErr } = await supabase.rpc("create_membership", { p_member_id: memberId, ...terms.args });
  if (msErr || !membershipId) {
    return { error: `Member created, but the membership failed: ${msErr ? dbError(msErr) : "unknown error"}. Add it from the member page.`, data };
  }

  // 4. optional first payment
  if (v.pay_amount && v.pay_amount > 0) {
    const { error: pErr } = await supabase.rpc("record_payment", {
      p_membership_id: membershipId, p_amount: v.pay_amount, p_method: v.pay_method ?? "cash",
      p_paid_on: todayIST(), p_reference: v.pay_reference ?? null, p_remarks: "Payment at joining",
    });
    if (pErr) return { error: `Member and membership created, but the payment failed: ${dbError(pErr)}. Record it from the member page.`, data };
  }
  return { message: "Member created.", data };
}

const updateMemberSchema = z.object({ member_id: id, full_name: reqText("Name"), phone: phone10, address: text(300) });
export async function updateMember(_prev: State, fd: FormData): Promise<State> {
  await requireRole("admin");
  const p = updateMemberSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error) };
  const supabase = await createClient();
  // The mobile number is also the member's login, so keep both in step.
  const { data: cur } = await supabase.from("members").select("profile_id, profiles(phone)").eq("id", p.data.member_id).maybeSingle();
  if (!cur) return { error: "Member not found." };
  const oldPhone = (cur as unknown as { profiles: { phone: string | null } | null }).profiles?.phone;
  if (oldPhone !== p.data.phone) {
    const { error: authErr } = await createAdminClient().auth.admin.updateUserById(cur.profile_id, { phone: toAuthPhone(p.data.phone), phone_confirm: true });
    if (authErr) return { error: "Could not change the mobile number. Another account may already use it." };
  }
  const { error } = await supabase.rpc("update_member_details", {
    p_member_id: p.data.member_id, p_full_name: p.data.full_name, p_phone: p.data.phone, p_address: p.data.address ?? null,
  });
  if (error) return { error: dbError(error) };
  revalidatePath(`/admin/members/${p.data.member_id}`);
  revalidatePath("/admin/members");
  return { message: "Details saved." };
}

const statusSchema = z.object({ member_id: id, status: z.enum(["active", "inactive", "suspended", "expired"]) });
export async function setMemberStatus(_prev: State, fd: FormData): Promise<State> {
  await requireRole("admin");
  const p = statusSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_status", { p_member_id: p.data.member_id, p_status: p.data.status });
  if (error) return { error: dbError(error) };
  revalidatePath(`/admin/members/${p.data.member_id}`);
  revalidatePath("/admin/members");
  return { message: `Status changed to ${p.data.status}.` };
}

// ---------- memberships ----------
const newMembershipSchema = z.object({ member_id: id, ...termsShape });
export async function newMembership(_prev: State, fd: FormData): Promise<State> {
  await requireRole("admin");
  const p = newMembershipSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error) };
  const supabase = await createClient();
  const terms = await resolveTerms(supabase, p.data);
  if (terms.error || !terms.args) return { error: terms.error };
  const { error } = await supabase.rpc("create_membership", { p_member_id: p.data.member_id, ...terms.args });
  if (error) return { error: dbError(error) };
  revalidatePath(`/admin/members/${p.data.member_id}`);
  revalidatePath("/admin/members");
  return { message: "New membership added. The previous one is kept in history." };
}

const planSchema = z.object({
  id: optId,
  name: reqText("Plan name", 80),
  model: z.enum(["calendar", "working_days"], { error: "Choose a model" }),
  default_fee: z.coerce.number({ error: "Enter the fee" }).min(0).max(10_000_000),
  duration_months: int,
  total_days: int,
  description: text(300),
  display_order: z.preprocess(blank, z.coerce.number().int().min(0).max(999).default(0)),
});
export async function savePlan(_prev: State, fd: FormData): Promise<State> {
  await requireRole("admin");
  const p = planSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error) };
  const v = p.data;
  if (v.model === "calendar" && !v.duration_months) return { error: "Enter the duration in months." };
  if (v.model === "working_days" && !v.total_days) return { error: "Enter the number of gym days." };
  const row = {
    name: v.name, model: v.model, default_fee: v.default_fee,
    duration_months: v.model === "calendar" ? v.duration_months : null,
    total_days: v.model === "working_days" ? v.total_days : null,
    description: v.description ?? null, display_order: v.display_order,
    is_public: fd.get("is_public") === "on", is_active: fd.has("id") ? fd.get("is_active") === "on" : true,
  };
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_membership_plan", {
    p_id: v.id ?? null,
    p_name: row.name,
    p_model: row.model,
    p_default_fee: row.default_fee,
    p_duration_months: row.duration_months,
    p_total_days: row.total_days,
    p_description: row.description,
    p_display_order: row.display_order,
    p_is_public: row.is_public,
    p_is_active: row.is_active,
  });
  if (error) return { error: dbError(error) };
  revalidatePath("/admin/memberships");
  revalidatePath("/");
  return { message: v.id ? "Plan updated." : "Plan created." };
}

export async function deletePlan(_prev: State, fd: FormData): Promise<State> {
  await requireRole("admin");
  const parsed = z.object({ id }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid plan." };
  const { error } = await (await createClient()).rpc("delete_membership_plan", { p_id: parsed.data.id });
  if (error) return { error: dbError(error) };
  revalidatePath("/admin/memberships");
  revalidatePath("/");
  return { message: "Plan deleted." };
}

// ---------- payments ----------
const paymentSchema = z.object({
  membership_id: id,
  member_id: id,
  amount: z.coerce.number({ error: "Enter the amount" }).positive("Enter an amount above zero").max(10_000_000),
  method: z.enum(["cash", "upi", "bank", "other"], { error: "Choose a payment method" }),
  paid_on: date,
  reference: text(100),
  remarks: text(300),
});
export async function recordPayment(_prev: State, fd: FormData): Promise<State> {
  await requireRole("admin");
  const p = paymentSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_payment", {
    p_membership_id: p.data.membership_id, p_amount: p.data.amount, p_method: p.data.method,
    p_paid_on: p.data.paid_on, p_reference: p.data.reference ?? null, p_remarks: p.data.remarks ?? null,
  });
  if (error) return { error: dbError(error) };
  revalidatePath(`/admin/members/${p.data.member_id}`);
  revalidatePath("/admin/payments");
  revalidatePath("/admin/dashboard");
  return { message: "Payment recorded." };
}

const reverseSchema = z.object({ payment_id: id, member_id: id, reason: reqText("A reason", 200) });
export async function reversePayment(_prev: State, fd: FormData): Promise<State> {
  await requireRole("admin");
  const p = reverseSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("reverse_payment", { p_payment_id: p.data.payment_id, p_reason: p.data.reason });
  if (error) return { error: dbError(error) };
  revalidatePath(`/admin/members/${p.data.member_id}`);
  revalidatePath("/admin/payments");
  revalidatePath("/admin/dashboard");
  return { message: "Payment reversed. It stays in the history." };
}

// ---------- password reset by the gym (for members without email) ----------
export async function resetMemberPassword(_prev: State, fd: FormData): Promise<State> {
  const admin = await requireRole("admin");
  const p = z.object({ member_id: id }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error) };
  const supabase = await createClient();
  const { data: m } = await supabase.from("members").select("profile_id, profiles(phone)").eq("id", p.data.member_id).maybeSingle();
  if (!m) return { error: "Member not found." };
  const password = tempPassword();
  const service = createAdminClient();
  const { error } = await service.auth.admin.updateUserById(m.profile_id, { password });
  if (error) return { error: "Could not reset the password. Please try again." };
  await service.from("audit_logs").insert({ actor_id: admin.id, action: "member.password_reset", table_name: "members", record_id: p.data.member_id });
  const phone = (m as unknown as { profiles: { phone: string | null } | null }).profiles?.phone ?? "";
  return { message: "New password created.", data: { tempPassword: password, login: phone } };
}
