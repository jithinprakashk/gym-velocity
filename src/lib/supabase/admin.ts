import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

/** Service-level client. Server only. Used ONLY to create/remove login accounts. Bypasses security rules. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  const url = supabaseUrl();
  if (!key || !url) throw new Error("SUPABASE_SECRET_KEY / NEXT_PUBLIC_SUPABASE_URL is not set");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
