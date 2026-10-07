"use client";

import { useState } from "react";
import { submitReview } from "@/app/actions/bookings";

export function ReviewForm({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [error, setError] = useState<string | null>(null);

  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      const comment = String(new FormData(e.currentTarget).get("comment"));
      const r = await submitReview({ bookingId, rating, comment });
      if (!r.ok) setError(r.error); else onDone();
    }} className="mt-2 space-y-2 rounded-lg border border-zinc-200 p-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)} className={`text-2xl ${n <= rating ? "text-amber-500" : "text-zinc-300"}`}>★</button>
        ))}
      </div>
      <textarea name="comment" rows={2} placeholder="How was your tour? (optional)" className="input" />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-primary !px-3 !py-1.5 text-xs">Submit review</button>
        <button type="button" onClick={onDone} className="text-xs text-zinc-500">Cancel</button>
      </div>
    </form>
  );
}
