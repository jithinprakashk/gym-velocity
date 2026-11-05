import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SetPasswordForm } from "./set-password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Choose a password | VELOCITY" };

export default async function SetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=link");

  return (
    <>
      <SiteHeader />
      <main id="main" className="container-x grid min-h-[70vh] place-items-center py-16">
        <div className="w-full max-w-md rounded-xl border border-edge bg-panel p-6 sm:p-8">
          <h1 className="text-4xl">Choose a password</h1>
          <p className="mt-2 text-mist">Use at least 8 characters.</p>
          <SetPasswordForm />
        </div>
      </main>
    </>
  );
}
