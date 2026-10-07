"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerAccount } from "@/app/actions/auth";

function SignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();
  const defaultType = sp.get("type") === "GUIDE" ? "GUIDE" : "TOURIST";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true); setError(null);
    const fd = new FormData(e.currentTarget);
    const accountType = String(fd.get("accountType"));
    const r = await registerAccount({
      name: String(fd.get("name")),
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      accountType,
    });
    setPending(false);
    if (!r.ok) { setError(r.error); return; }
    router.push(accountType === "GUIDE" ? "/guide/apply" : "/tourist");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <form onSubmit={submit} className="card mt-6 space-y-3 p-6">
        <div><label className="label">Full name</label>
          <input name="name" required className="input" /></div>
        <div><label className="label">Email</label>
          <input name="email" type="email" required className="input" /></div>
        <div><label className="label">Password (min 8 characters)</label>
          <input name="password" type="password" required minLength={8} className="input" /></div>
        <div><label className="label">I am a…</label>
          <select name="accountType" defaultValue={defaultType} className="input">
            <option value="TOURIST">Tourist looking for a guide</option>
            <option value="GUIDE">Local guide (student/young local)</option>
          </select></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={pending} className="btn-primary w-full">{pending ? "Creating…" : "Sign up"}</button>
        <p className="text-center text-xs text-zinc-500">
          Already registered? <Link href="/auth/signin" className="text-brand-700 hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}

export default function SignUpPage() {
  return <Suspense><SignUpForm /></Suspense>;
}
