import { describe, it, expect, vi, beforeEach } from "vitest";

const tx = vi.hoisted(() => ({
  booking: { findUnique: vi.fn() },
  review: { create: vi.fn(), aggregate: vi.fn() },
  guideProfile: { update: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: (fn: (t: typeof tx) => unknown) => fn(tx) },
}));

const { createReview, ReviewError } = await import("@/services/reviews/service");

const completedBooking = {
  id: "b1", status: "COMPLETED", guideId: "g1", touristId: "t1", tourist: { userId: "u1" }, review: null,
};

beforeEach(() => vi.clearAllMocks());

describe("review rules", () => {
  it("allows a tourist to review their completed booking", async () => {
    tx.booking.findUnique.mockResolvedValue(completedBooking as never);
    tx.review.create.mockResolvedValue({ id: "r1" } as never);
    tx.review.aggregate.mockResolvedValue({ _avg: { rating: 5 }, _count: 1 } as never);
    const r = await createReview({ bookingId: "b1", touristUserId: "u1", rating: 5, comment: "Great!" });
    expect(r.id).toBe("r1");
  });

  it("forbids reviewing someone else's booking (IDOR)", async () => {
    tx.booking.findUnique.mockResolvedValue(completedBooking as never);
    await expect(createReview({ bookingId: "b1", touristUserId: "attacker", rating: 5 })).rejects.toThrow(ReviewError);
  });

  it("forbids reviewing a booking that is not COMPLETED", async () => {
    tx.booking.findUnique.mockResolvedValue({ ...completedBooking, status: "CONFIRMED" } as never);
    await expect(createReview({ bookingId: "b1", touristUserId: "u1", rating: 4 })).rejects.toThrow(/completed/);
  });

  it("forbids a second review on the same booking", async () => {
    tx.booking.findUnique.mockResolvedValue({ ...completedBooking, review: { id: "r0" } } as never);
    await expect(createReview({ bookingId: "b1", touristUserId: "u1", rating: 5 })).rejects.toThrow(/already reviewed/);
  });
});
