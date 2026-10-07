"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addBlockedDate, removeBlockedDate } from "@/app/actions/guide";

export function BlockedDates({ blockedDates }: { blockedDates: Array<{ id: string; date: string; reason: string | null }> }) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div>
      <div className="space-y-2 text-sm">
        {blockedDates.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
            <span>{b.date}{b.reason ? ` — ${b.reason}` : ""}</span>
            <button onClick={async () => { await removeBlockedDate(b.id); router.refresh(); }} className="text-xs text-red-600 hover:underline">Remove</button>
          </div>
        ))}
        {blockedDates.length === 0 && <p className="text-zinc-400">No blocked dates.</p>}
      </div>
      <form onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const r = await addBlockedDate({ date: new Date(String(fd.get("date"))), reason: String(fd.get("reason") ?? "") || undefined });
        setError(r.ok ? null : r.error);
        if (r.ok) { (e.target as HTMLFormElement).reset(); router.refresh(); }
      }} className="mt-3 flex flex-wrap items-center gap-2">
        <input name="date" type="date" required className="input !w-auto" min={new Date().toISOString().slice(0, 10)} />
        <input name="reason" placeholder="Reason (optional)" className="input !w-48" />
        <button className="btn-outline !py-2 text-xs">Block date</button>
        {error && <p className="w-full text-xs text-red-600">{error}</p>}
      </form>
    </div>
  );
}
