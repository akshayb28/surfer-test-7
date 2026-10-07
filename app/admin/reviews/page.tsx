import { prisma } from "@/lib/prisma";
import { StarRating } from "@/components/star-rating";
import { ModerateReviewButton } from "./moderate-review-button";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      guide: { include: { user: { select: { name: true } } } },
      tourist: { include: { user: { select: { name: true } } } },
    },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Reviews moderation</h1>
      <div className="card divide-y divide-zinc-100">
        {reviews.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div>
              <p className="font-medium">{r.tourist.user.name} → {r.guide.user.name} <StarRating value={r.rating} className="ml-2" /></p>
              {r.comment && <p className="mt-1 max-w-xl text-zinc-600">{r.comment}</p>}
              <p className="mt-1 flex gap-2 text-xs">
                {r.isFlagged && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">flagged</span>}
                {r.isRemoved && <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-700">removed</span>}
              </p>
            </div>
            <div className="flex gap-2">
              {!r.isFlagged && !r.isRemoved && <ModerateReviewButton reviewId={r.id} action="FLAG" label="Flag" />}
              {!r.isRemoved ? (
                <ModerateReviewButton reviewId={r.id} action="REMOVE" label="Remove" danger />
              ) : (
                <ModerateReviewButton reviewId={r.id} action="RESTORE" label="Restore" />
              )}
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="p-6 text-center text-zinc-400">No reviews yet.</p>}
      </div>
    </div>
  );
}
