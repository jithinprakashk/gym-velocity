"use client";

import { useActionState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { requestReset } from "./actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestReset, undefined);
  return (
    <>
      <SiteHeader />
      <main id="main" className="container-x grid min-h-[70vh] place-items-center py-16">
        <div className="w-full max-w-md rounded-xl border border-edge bg-panel p-6 sm:p-8">
          <h1 className="text-4xl">Reset password</h1>
          <p className="mt-2 text-mist">If your account has an email address, we will email you a link. If you signed in with just your mobile number, ask the gym staff to give you a new password.</p>
          <form action={action} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required className="field" />
            </div>
            {state?.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}
            {state?.message && <p role="status" className="text-sm text-lime">{state.message}</p>}
            <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-60">
              {pending ? "Sending…" : "Send reset link"}
            </button>
          </form>
          <Link href="/login" className="mt-6 block text-center text-sm text-lime underline underline-offset-4">
            Back to sign in
          </Link>
        </div>
      </main>
    </>
  );
}
