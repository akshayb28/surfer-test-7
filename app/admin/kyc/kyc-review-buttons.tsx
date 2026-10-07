"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewKyc } from "@/app/actions/admin";

export function KycReviewButtons({ kycId }: { kycId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const act = async (decision: "APPROVE" | "REJECT" | "RE_VERIFICATION") => {
    if (decision === "REJECT" && !notes.trim()) { setError("Add a reason before rejecting."); return; }
    const r = await reviewKyc({ kycId, decision, notes: notes || undefined });
    setError(r.ok ? null : r.error);
    if (r.ok) router.refresh();
  };

  return (
    <div className="flex w-64 flex-col items-end gap-2">
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Review notes / rejection reason" className="input text-xs" />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button onClick={() => act("APPROVE")} className="btn-primary !px-3 !py-1.5 text-xs">Approve</button>
        <button onClick={() => act("RE_VERIFICATION")} className="btn-outline !px-3 !py-1.5 text-xs">Re-verify</button>
        <button onClick={() => act("REJECT")} className="btn-outline !px-3 !py-1.5 text-xs !border-red-300 !text-red-700">Reject</button>
      </div>
    </div>
  );
}
