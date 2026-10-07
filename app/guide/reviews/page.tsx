"use client";

import { useEffect, useState } from "react";
import { submitReviewResponse } from "@/app/actions/bookings";
import { StarRating } from "@/components/star-rating";

type Review = {
  id: string; rating: number; comment: string | null; response: string | null;
  createdAt: string; tourist: { user: { name: string } };
};

export default function GuideReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/guide/reviews").then((r) => r.json()).then((d) => { setReviews(d.reviews); setLoading(false); });
  }, []);

  async function respond(reviewId: string, response: string) {
    const r = await submitReviewResponse({ reviewId, response });
    if (r.ok) setReviews((rs) => rs.map((x) => x.id === reviewId ? { ...x, response } : x));
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-8 text-zinc-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Your reviews</h1>
      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex items-center justify-between">
              <p className="font-medium">{r.tourist.user.name}</p>
              <StarRating value={r.rating} />
            </div>
            {r.comment && <p className="mt-2 text-sm text-zinc-600">{r.comment}</p>}
            {r.response ? (
              <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm"><span className="font-medium">Your response:</span> {r.response}</p>
            ) : (
              <ResponseForm onSubmit={(text) => respond(r.id, text)} />
            )}
          </div>
        ))}
        {reviews.length === 0 && <div className="card p-10 text-center text-zinc-500">No reviews yet — they will appear here after completed tours.</div>}
      </div>
    </div>
  );
}

function ResponseForm({ onSubmit }: { onSubmit: (text: string) => Promise<void> }) {
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);
  if (!show) return <button onClick={() => setShow(true)} className="mt-2 text-xs text-brand-700 hover:underline">Respond publicly</button>;
  return (
    <form onSubmit={async (e) => { e.preventDefault(); await onSubmit(text); setShow(false); }} className="mt-3 flex gap-2">
      <input value={text} onChange={(e) => setText(e.target.value)} required placeholder="Thank them or clarify…" className="input flex-1 text-sm" />
      <button className="btn-primary !px-3 !py-1.5 text-xs">Post</button>
    </form>
  );
}
