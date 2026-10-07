"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireBookingAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { bookingRequestSchema, reviewSchema, reviewResponseSchema, messageSchema, reportSchema, disputeSchema } from "@/validations";
import { createBookingRequest, cancelBooking, BookingError } from "@/services/bookings/service";
import { createReview, respondToReview, ReviewError } from "@/services/reviews/service";
import { notify } from "@/services/notifications/events";
import type { ActionResult } from "./auth";

// ---------- TOURIST ----------

export async function requestBooking(input: unknown): Promise<ActionResult & { bookingId?: string }> {
  const user = await requireUser();
  const parsed = bookingRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    const booking = await createBookingRequest({ ...parsed.data, touristUserId: user.id });
    await notify(booking.guideId && (await prisma.guideProfile.findUnique({ where: { id: booking.guideId } }))!.userId, "BOOKING_REQUEST", { ref: booking.bookingRef, date: String(booking.date) });
    revalidatePath("/tourist/bookings");
    return { ok: true, bookingId: booking.id };
  } catch (err) {
    if (err instanceof BookingError) return { ok: false, error: err.message };
    throw err;
  }
}

export async function cancelBookingAction(bookingId: string, reason?: string): Promise<ActionResult & { refundPercent?: number }> {
  const { userId } = await requireBookingAccess(bookingId);
  try {
    const { refundPercent } = await cancelBooking(bookingId, "TOURIST", reason);
    const other = await prisma.booking.findUnique({ where: { id: bookingId }, include: { guide: true, tourist: true } });
    if (other) {
      await notify(other.guide.userId, "BOOKING_CANCELLED", { ref: other.bookingRef, by: "tourist" });
      if (other.tourist.userId !== userId) await notify(other.tourist.userId, "BOOKING_CANCELLED", { ref: other.bookingRef });
    }
    revalidatePath("/tourist/bookings");
    return { ok: true, refundPercent };
  } catch (err) {
    if (err instanceof BookingError) return { ok: false, error: err.message };
    throw err;
  }
}

// ---------- GUIDE ----------

export async function acceptBookingAction(bookingId: string): Promise<ActionResult> {
  const { booking } = await requireBookingAccess(bookingId);
  if (booking.status !== "CONFIRMED" && booking.status !== "REQUESTED") {
    return { ok: false, error: "Booking is not in a confirmable state" };
  }
  await prisma.booking.update({ where: { id: bookingId }, data: { status: "GUIDE_ACCEPTED" } });
  await notify(booking.touristId && (await prisma.touristProfile.findUnique({ where: { id: booking.touristId } }))!.userId, "BOOKING_ACCEPTED", { ref: booking.bookingRef });
  revalidatePath("/guide/bookings");
  return { ok: true };
}

export async function rejectBookingAction(bookingId: string, reason?: string): Promise<ActionResult> {
  await requireBookingAccess(bookingId);
  await prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED", cancelledBy: "GUIDE", cancelReason: reason ?? "Guide declined" } });
  revalidatePath("/guide/bookings");
  return { ok: true };
}

export async function startTourAction(bookingId: string): Promise<ActionResult> {
  await requireBookingAccess(bookingId);
  await prisma.booking.update({ where: { id: bookingId }, data: { status: "IN_PROGRESS" } });
  revalidatePath("/guide/bookings");
  return { ok: true };
}

export async function completeTourAction(bookingId: string): Promise<ActionResult> {
  const { booking } = await requireBookingAccess(bookingId);
  await prisma.booking.update({ where: { id: bookingId }, data: { status: "COMPLETED" } });
  await notify((await prisma.touristProfile.findUnique({ where: { id: booking.touristId } }))!.userId, "BOOKING_COMPLETED", { ref: booking.bookingRef });
  revalidatePath("/guide/bookings");
  return { ok: true };
}

// ---------- REVIEWS ----------

export async function submitReview(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    await createReview({ ...parsed.data, touristUserId: user.id });
    revalidatePath("/tourist/bookings");
    return { ok: true };
  } catch (err) {
    if (err instanceof ReviewError) return { ok: false, error: err.message };
    throw err;
  }
}

export async function submitReviewResponse(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = reviewResponseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    await respondToReview(parsed.data.reviewId, user.id, parsed.data.response);
    revalidatePath("/guide/reviews");
    return { ok: true };
  } catch (err) {
    if (err instanceof ReviewError) return { ok: false, error: err.message };
    throw err;
  }
}

// ---------- MESSAGING ----------

export async function sendMessage(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const convo = await prisma.conversation.findUnique({
    where: { id: parsed.data.conversationId }, include: { booking: { include: { tourist: true, guide: true } } },
  });
  if (!convo) return { ok: false, error: "Conversation not found" };
  const allowed = [convo.booking.tourist.userId, convo.booking.guide.userId];
  if (user.role !== "ADMIN" && !allowed.includes(user.id)) return { ok: false, error: "Forbidden" };
  await prisma.message.create({ data: { conversationId: convo.id, senderId: user.id, body: parsed.data.body } });
  revalidatePath(`/tourist/messages/${convo.id}`);
  revalidatePath(`/guide/messages/${convo.id}`);
  return { ok: true };
}

// ---------- SAFETY ----------

export async function reportUser(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await prisma.report.create({ data: { reporterId: user.id, ...parsed.data } });
  return { ok: true };
}

export async function openDispute(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = disputeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await requireBookingAccess(parsed.data.bookingId);
  await prisma.dispute.upsert({
    where: { bookingId: parsed.data.bookingId },
    update: { status: "OPEN" },
    create: { bookingId: parsed.data.bookingId, openedById: user.id, reason: parsed.data.reason },
  });
  await prisma.booking.update({ where: { id: parsed.data.bookingId }, data: { status: "DISPUTED" } });
  revalidatePath("/tourist/bookings");
  return { ok: true };
}
