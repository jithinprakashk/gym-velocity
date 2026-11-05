import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "member";
export type SessionProfile = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
};

/** Reads the signed-in user and their role from the database (never from client input). */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;
  return { ...data, email: user.email ?? "" } as SessionProfile;
}

export function homeFor(role: Role) {
  return role === "admin" ? "/admin/dashboard" : "/member/dashboard";
}

/** Call at the top of every protected layout and page. */
export async function requireRole(role: Role): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (!profile.is_active) redirect("/auth/inactive");
  if (profile.role !== role) redirect(homeFor(profile.role));
  return profile;
}
