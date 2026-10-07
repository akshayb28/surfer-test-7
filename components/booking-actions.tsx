"use client";

import { useState } from "react";
import { cancelBookingAction, openDispute } from "@/app/actions/bookings";
import { ReviewForm } from "@/components/review-form";

export function TouristBookingActions({ bookingId, status }: { bookingId: string; status: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [showDispute, setShowDispute] = useState(false);
  const [showReview, setShowReview] = useState(false);

  if (status === "COMPLETED" && !showReview) {
    return (
      <div>
        <button onClick={() => setShowReview(true)} className="btn-primary !px-3 !py-1.5 text-xs">Leave a review</button>
        {showReview && <ReviewForm bookingId={bookingId} onDone={() => setShowReview(false)} />}
      </div>
    );
  }
  if (showReview) return <ReviewForm bookingId={bookingId} onDone={() => setShowReview(false)} />;

  const cancellable = ["REQUESTED", "PENDING_PAYMENT", "CONFIRMED", "GUIDE_ACCEPTED"].includes(status);
  if (!cancellable && !showDispute) return null;

  return (
    <div className="space-y-2 text-xs">
      {msg && <p className="rounded bg-brand-50 p-2 text-brand-800">{msg}</p>}
      {cancellable && (
        <button onClick={async () => {
          const r = await cancelBookingAction(bookingId);
          setMsg(r.ok ? `Cancelled${r.refundPercent ? ` — ${r.refundPercent}% refund due` : ""}` : r.error);
        }} className="btn-outline !px-3 !py-1.5">
          Cancel booking
        </button>
      )}
      {["CONFIRMED", "GUIDE_ACCEPTED", "IN_PROGRESS"].includes(status) && (
        <button onClick={() => setShowDispute((v) => !v)} className="block text-zinc-500 hover:underline">Report a problem</button>
      )}
      {showDispute && (
        <form onSubmit={async (e) => {
          e.preventDefault();
          const reason = String(new FormData(e.currentTarget).get("reason"));
          const r = await openDispute({ bookingId, reason });
          setMsg(r.ok ? "Dispute opened — our team will review it." : r.error);
          if (r.ok) setShowDispute(false);
        }} className="space-y-1">
          <textarea name="reason" required rows={2} placeholder="Describe the issue…" className="input" />
          <button className="btn-primary !px-3 !py-1">Submit dispute</button>
        </form>
      )}
    </div>
  );
}
