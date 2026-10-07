import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Mock Prisma ----
const tx = vi.hoisted(() => ({
  booking: { count: vi.fn(), create: vi.fn() },
  touristProfile: { findUnique: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    guideProfile: { findUnique: vi.fn() },
    $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
  },
}));

const { createBookingRequest, BookingError } = await import("@/services/bookings/service");
const { prisma } = await import("@/lib/prisma");

const guide = {
  id: "g1", status: "APPROVED", maxBookingsPerDay: 2, basePrice: 80000,
  locations: [{ destinationId: "d1" }],
  blockedDates: [],
  availability: [{ dayOfWeek: new Date("2030-06-03").getDay(), startTime: "09:00", endTime: "18:00" }],
};

const baseInput = {
  touristUserId: "u1", guideId: "g1", destinationId: "d1",
  date: new Date("2030-06-03"), startTime: "10:00", durationHours: 2,
  partySize: 2, meetingLocation: "Hawa Mahal gate",
};

beforeEach(() => vi.clearAllMocks());

describe("createBookingRequest guards", () => {
  it("rejects a non-approved guide", async () => {
    vi.mocked(prisma.guideProfile.findUnique).mockResolvedValue({ ...guide, status: "SUSPENDED" } as never);
    await expect(createBookingRequest(baseInput)).rejects.toThrow(BookingError);
  });

  it("rejects destinations the guide does not cover", async () => {
    vi.mocked(prisma.guideProfile.findUnique).mockResolvedValue(guide as never);
    await expect(createBookingRequest({ ...baseInput, destinationId: "OTHER" })).rejects.toThrow(/does not cover/);
  });

  it("rejects dates in the past", async () => {
    vi.mocked(prisma.guideProfile.findUnique).mockResolvedValue(guide as never);
    await expect(createBookingRequest({ ...baseInput, date: new Date("2020-01-01") })).rejects.toThrow(/future/);
  });

  it("rejects start times outside the guide's availability window", async () => {
    vi.mocked(prisma.guideProfile.findUnique).mockResolvedValue(guide as never);
    await expect(createBookingRequest({ ...baseInput, startTime: "07:00" })).rejects.toThrow(/available from/);
    await expect(createBookingRequest({ ...baseInput, startTime: "17:00", durationHours: 4 })).rejects.toThrow(/end by/);
  });

  it("rejects when the guide is fully booked that day (double-booking guard)", async () => {
    vi.mocked(prisma.guideProfile.findUnique).mockResolvedValue(guide as never);
    tx.booking.count.mockResolvedValue(2); // == maxBookingsPerDay
    tx.touristProfile.findUnique.mockResolvedValue({ id: "tp1" } as never);
    await expect(createBookingRequest(baseInput)).rejects.toThrow(/fully booked/);
  });

  it("creates the booking with a 15% commission split when valid", async () => {
    vi.mocked(prisma.guideProfile.findUnique).mockResolvedValue(guide as never);
    tx.booking.count.mockResolvedValue(0);
    tx.touristProfile.findUnique.mockResolvedValue({ id: "tp1" } as never);
    tx.booking.create.mockResolvedValue({ id: "b1" } as never);
    const booking = await createBookingRequest(baseInput);
    expect(booking.id).toBe("b1");
    const createCall = tx.booking.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(createCall.data.totalAmount).toBe(80000);
    expect(createCall.data.commissionAmount).toBe(12000); // 15%
    expect(createCall.data.guideEarnings).toBe(68000);
  });
});
