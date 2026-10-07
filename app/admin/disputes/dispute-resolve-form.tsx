"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveDispute } from "@/app/actions/admin";

export function DisputeResolveForm({ bookingId, capturedAmount }: { bookingId: string; capturedAmount: number }) {
  const router = useRouter();
  const [resolution, setResolution] = useState<"COMPLETE" | "FULL_REFUND" | "PARTIAL_REFUND" | "CANCEL">("FULL_REFUND");
  const [amount, setAmount] = useState(Math.floor(capturedAmount / 2));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!note.trim()) { setError("Resolution note is required."); return; }
    const r = await resolveDispute(bookingId, resolution, note, resolution === "PARTIAL_REFUND" ? amount : undefined);
    setError(r.ok ? null : r.error);
    if (r.ok) router.refresh();
  }

  return (
    <div className="w-72 space-y-2">
      <select value={resolution} onChange={(e) => setResolution(e.target.value as typeof resolution)} className="input text-xs">
        <option value="FULL_REFUND">Full refund to tourist</option>
        <option value="PARTIAL_REFUND">Partial refund</option>
        <option value="COMPLETE">Mark completed (pay guide)</option>
        <option value="CANCEL">Cancel without refund</option>
      </select>
      {resolution === "PARTIAL_REFUND" && (
        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min={1} max={capturedAmount} className="input text-xs" placeholder={`Refund amount (paise, max ${capturedAmount})`} />
      )}
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Resolution note (audit-logged)" className="input text-xs" />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button onClick={submit} className="btn-primary w-full !py-2 text-xs">Resolve & process</button>
    </div>
  );
}
