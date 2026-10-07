"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminProcessPayout } from "@/app/actions/admin";

export function PayoutButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button disabled={busy} onClick={async () => {
        setBusy(true); setError(null);
        const reference = prompt("Enter bank/UPI transaction reference:")?.trim();
        if (!reference) { setBusy(false); return; }
        const r = await adminProcessPayout(bookingId, reference);
        setError(r.ok ? null : r.error);
        router.refresh(); setBusy(false);
      }} className="btn-primary !px-3 !py-1.5 text-xs">
        {busy ? "Processing…" : "Mark paid"}
      </button>
    </div>
  );
}
