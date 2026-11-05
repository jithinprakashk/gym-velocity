"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="identifier" className="mb-1.5 block text-sm font-medium">Email address</label>
        <input id="identifier" name="identifier" type="email" autoComplete="username" required placeholder="you@example.com" className="field" />
        <p className="mt-1 text-xs text-mist">Your mobile number is kept as your member contact number.</p>
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-red-300">{state.error}</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <Link href="/forgot-password" className="block text-center text-sm text-lime underline underline-offset-4">
        Forgot your password?
      </Link>
      <Link href="/register" className="block text-center text-sm text-lime underline underline-offset-4">
        New member? Create an account
      </Link>
    </form>
  );
}
