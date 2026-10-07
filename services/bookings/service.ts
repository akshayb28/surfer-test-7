import { prisma } from "@/lib/prisma";
import { COMMISSION_PERCENT, refundPercentFor } from "@/lib/constants";
import { bookingRef } from "@/lib/utils";
import type { BookingStatus } from "@prisma/client";

export class BookingError extends Error {}

/**
 * Create a booking request.
 * - Rejects if guide not APPROVED, date blocked, outside availability window,
 *   or the guide already has maxBookingsPerDay bookings that day.
 * - Uses a transaction so concurrent requests can't slip past the count check.
 */
export async function createBookingRequest(input: {
  touristUserId: string; guideId: string; destinationId: string; tourTypeId?: string;
  date: Date; startTime: string; durationHours: number; partySize: number;
  meetingLocation: string; notes?: string;
}) {
  const { guideId, date, startTime } = input;

  const guide = await prisma.guideProfile.findUnique({
    where: { id: guideId },
    include: { locations: true, blockedDates: true, availability: true },
  });
  if (!guide || guide.status !== "APPROVED") throw new BookingError("Guide is not available");
  if (!guide.locations.some((l) => l.destinationId === input.destinationId)) {
    throw new BookingError("This guide does not cover that destination");
  }

  const day = new Date(date);
  if (day < new Date(new Date().setHours(0, 0, 0, 0))) throw new BookingError("Date must be in the future");
  if (guide.blockedDates.some((b) => sameDay(b.date, day))) throw new BookingError("Guide is unavailable on this date");

  const dayOfWeek = day.getDay();
  const slot = guide.availability.find((a) => a.dayOfWeek === dayOfWeek);
  if (!slot) throw new BookingError("Guide has no availability on this day");
  if (startTime < slot.startTime) throw new BookingError(`Guide is available from ${slot.startTime}`);
  const endHour = parseInt(startTime) + input.durationHours;
  const slotEndHour = parseInt(slot.endTime);
  if (endHour > slotEndHour) throw new BookingError(`Tour must end by ${slot.endTime}`);

  const totalAmount = guide.basePrice; // pricing v2: per-person multipliers etc.

  return prisma.$transaction(async (tx) => {
    const dayStart = new Date(day.setHours(0, 0, 0, 0));
    const dayEnd = new Date(day.setHours(23, 59, 59, 999));
    const sameDayBookings = await tx.booking.count({
      where: {
        guideId, date: { gte: dayStart, lte: dayEnd },
        status: { in: ["PENDING_PAYMENT", "CONFIRMED", "GUIDE_ACCEPTED", "IN_PROGRESS"] },
      },
    });
    if (sameDayBookings >= guide.maxBookingsPerDay) throw new BookingError("Guide is fully booked for this date");

    const tourist = await tx.touristProfile.findUnique({ where: { userId: input.touristUserId } });
    if (!tourist) throw new BookingError("Tourist profile not found");

    const commissionAmount = Math.round((totalAmount * COMMISSION_PERCENT) / 100);
    const booking = await tx.booking.create({
      data: {
        bookingRef: bookingRef(),
        touristId: tourist.id,
        guideId,
        destinationId: input.destinationId,
        tourTypeId: input.tourTypeId,
        status: "REQUESTED",
        date: day,
        startTime,
        durationHours: input.durationHours,
        partySize: input.partySize,
        meetingLocation: input.meetingLocation,
        notes: input.notes,
        totalAmount,
        commissionAmount,
        guideEarnings: totalAmount - commissionAmount,
      },
    });
    await tx.conversation.create({ data: { bookingId: booking.id } });
    return booking;
  });
}

export async function setBookingStatus(bookingId: string, status: BookingStatus, extra: Record<string, unknown> = {}) {
  return prisma.booking.update({ where: { id: bookingId }, data: { status, ...extra } });
}

/** Cancel with policy-based refund percent; returns refund percent (0 = no refund due). */
export async function cancelBooking(bookingId: string, cancelledBy: "TOURIST" | "GUIDE" | "ADMIN", reason?: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new BookingError("Booking not found");
  if (["CANCELLED", "COMPLETED", "REFUNDED"].includes(booking.status)) throw new BookingError("Booking can no longer be cancelled");

  const startAt = new Date(booking.date);
  startAt.setHours(parseInt(booking.startTime), 0, 0, 0);
  const hoursUntilStart = (startAt.getTime() - Date.now()) / 3_600_000;
  const pct = refundPercentFor(hoursUntilStart);

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED", cancelledBy, cancelReason: reason },
  });

  const payment = await prisma.payment.findFirst({
    where: { bookingId, status: { in: ["CAPTURED", "AUTHORIZED"] } },
  });
  return { booking: updated, refundPercent: payment ? pct : 0, payment };
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
