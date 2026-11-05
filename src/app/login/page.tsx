import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { LoginForm } from "./login-form";
import { getSessionProfile, homeFor } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata = { title: "Member login | VELOCITY" };

const notices: Record<string, string> = {
  inactive: "This account is not active. Please speak to the gym staff.",
  link: "That link has expired or was already used. Request a new one below.",
  reset: "Password updated. You can sign in now.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; next?: string }>;
}) {
  const sp = await searchParams;
  if (hasSupabaseEnv() && !sp.error) {
    const profile = await getSessionProfile();
    if (profile?.is_active) redirect(homeFor(profile.role));
  }
  const notice = notices[sp.error ?? sp.notice ?? ""];

  return (
    <>
      <SiteHeader />
      <main id="main" className="container-x grid min-h-[70vh] place-items-center py-16">
        <div className="w-full max-w-md rounded-xl border border-edge bg-panel p-6 sm:p-8">
          <h1 className="text-4xl">Sign in</h1>
          <p className="mt-2 text-mist">Members and staff sign in here.</p>
          {notice && (
            <p role="status" className="mt-5 rounded-md border border-edge bg-raised p-3 text-sm">
              {notice}
            </p>
          )}
          {!hasSupabaseEnv() && (
            <p role="alert" className="mt-5 rounded-md border border-red-400/60 p-3 text-sm text-red-200">
              Setup needed: add your Supabase keys to .env.local (see SETUP.md).
            </p>
          )}
          <LoginForm next={sp.next ?? ""} />
          <p className="mt-6 text-sm text-mist">
            Accounts are created by the gym. To get one, ask at the front desk.{" "}
            <Link href="/" className="text-lime underline underline-offset-4">
              Back to the website
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
