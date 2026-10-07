"use client";

import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") ?? "/";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true); setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      redirect: false,
    });
    setPending(false);
    if (res?.error) { setError("Invalid email or password."); return; }
    router.push(callbackUrl); router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <form onSubmit={submit} className="card mt-6 space-y-3 p-6">
        <div><label className="label">Email</label>
          <input name="email" type="email" required className="input" /></div>
        <div><label className="label">Password</label>
          <input name="password" type="password" required className="input" /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={pending} className="btn-primary w-full">{pending ? "Signing in…" : "Sign in"}</button>
        <button type="button" onClick={() => signIn("google", { callbackUrl })}
          className="btn-outline w-full">Continue with Google</button>
        <p className="text-center text-xs text-zinc-500">
          No account? <Link href="/auth/signup" className="text-brand-700 hover:underline">Sign up</Link>
        </p>
      </form>
    </div>
  );
}

export default function SignInPage() {
  return <Suspense><SignInForm /></Suspense>;
}
