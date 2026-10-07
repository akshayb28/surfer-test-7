import { prisma } from "@/lib/prisma";

export class ReviewError extends Error {}

/**
 * Create a review for a COMPLETED booking. The Review.bookingId unique
 * constraint guarantees one review per booking, so tourists can never
 * review a booking they didn't complete — or review twice.
 * Updates the guide's denormalized averageRating / reviewCount in the same tx.
 */
export async function createReview(input: { bookingId: string; touristUserId: string; rating: number; comment?: string }) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: input.bookingId },
      include: { tourist: true, review: true },
    });
    if (!booking) throw new ReviewError("Booking not found");
    if (booking.tourist.userId !== input.touristUserId) throw new ReviewError("Forbidden");
    if (booking.status !== "COMPLETED") throw new ReviewError("You can only review completed tours");
    if (booking.review) throw new ReviewError("You already reviewed this booking");

    const review = await tx.review.create({
      data: {
        bookingId: booking.id, guideId: booking.guideId, touristId: booking.touristId,
        rating: input.rating, comment: input.comment,
      },
    });

    const agg = await tx.review.aggregate({
      where: { guideId: booking.guideId, isRemoved: false },
      _avg: { rating: true }, _count: true,
    });
    await tx.guideProfile.update({
      where: { id: booking.guideId },
      data: { averageRating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count },
    });
    return review;
  });
}

export async function respondToReview(reviewId: string, guideUserId: string, response: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId }, include: { guide: true } });
  if (!review) throw new ReviewError("Review not found");
  if (review.guide.userId !== guideUserId) throw new ReviewError("Forbidden");
  return prisma.review.update({ where: { id: reviewId }, data: { response } });
}
