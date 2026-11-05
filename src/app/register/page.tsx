import { createClient } from "@/lib/supabase/server";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("membership_plans").select("id, name, model, default_fee").eq("is_active", true).eq("is_public", true).order("display_order");
  return <main className="container-x grid min-h-screen place-items-center py-12"><RegisterForm plans={data ?? []} /></main>;
}
