"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string; message?: string } | undefined;
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");
const id = z.string().uuid("Invalid member");

function dbError(error: { code?: string; message: string }) {
  return error.code === "P0001" || error.code === "42501" ? error.message : "Something went wrong. Please try again.";
}

export async function markAttendance(_prev: State, fd: FormData): Promise<State> {
  await requireRole("admin");
  const parsed = z.object({ member_id: id, attendance_date: date, status: z.enum(["present", "absent"]) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the attendance form." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_official_attendance", {
    p_member_id: parsed.data.member_id,
    p_date: parsed.data.attendance_date,
    p_status: parsed.data.status,
  });
  if (error) return { error: dbError(error) };
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/dashboard");
  return { message: "Attendance saved." };
}

export async function addHoliday(_prev: State, fd: FormData): Promise<State> {
  await requireRole("admin");
  const parsed = z.object({
    holiday_date: date,
    title: z.string().trim().min(1, "Holiday title is required").max(160),
    confirm_attendance: z.preprocess((v) => v === "on", z.boolean()),
  }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the holiday form." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_gym_holiday", {
    p_date: parsed.data.holiday_date,
    p_title: parsed.data.title,
    p_confirm_attendance: parsed.data.confirm_attendance,
  });
  if (error) return { error: dbError(error) };
  revalidatePath("/admin/attendance");
  revalidatePath("/");
  return { message: "Holiday saved." };
}

export async function removeHoliday(_prev: State, fd: FormData): Promise<State> {
  await requireRole("admin");
  const parsed = z.object({ id }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid holiday." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_gym_holiday", { p_id: parsed.data.id });
  if (error) return { error: dbError(error) };
  revalidatePath("/admin/attendance");
  revalidatePath("/");
  return { message: "Holiday removed." };
}
