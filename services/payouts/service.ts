import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/rbac";

export class PayoutError extends Error {}

/** Admin processes a payout for one COMPLETED booking (manual bank/UPI transfer, then mark processed). */
export async function processPayout(adminId: string, bookingId: string, reference: string, ipAddress?: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { guide: true } });
  if (!booking) throw new PayoutError("Booking not found");
  if (booking.status !== "COMPLETED") throw new PayoutError("Only completed bookings can be paid out");

  const existing = await prisma.guidePayout.findFirst({ where: { bookingId } });
  if (existing) throw new PayoutError("Payout already processed for this booking");

  const payout = await prisma.$transaction(async (tx) => {
    const p = await tx.guidePayout.create({
      data: {
        guideId: booking.guideId, bookingId, amount: booking.guideEarnings,
        status: "PROCESSED", reference, processedById: adminId, processedAt: new Date(),
      },
    });
    await audit(adminId, "PROCESS_PAYOUT", "GuidePayout", p.id, { bookingId, amount: booking.guideEarnings }, ipAddress);
    return p;
  });

  // Notify the guide (fire-and-forget)
  const { notify } = await import("@/services/notifications/events");
  await notify(booking.guide.userId, "PAYOUT_PROCESSED", { bookingRef: booking.bookingRef, amount: `₹${booking.guideEarnings / 100}` });

  return payout;
}
