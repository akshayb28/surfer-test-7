"use server";

import { revalidatePath } from "next/cache";
import { requireRole, audit } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { kycReviewSchema, locationSchemas, settingsSchema } from "@/validations";
import { cancelBooking } from "@/services/bookings/service";
import { processPayout } from "@/services/payouts/service";
import { getPaymentProvider } from "@/services/payments";
import { notify } from "@/services/notifications/events";
import type { ActionResult } from "./auth";

async function admin() {
  return requireRole("ADMIN");
}

// ---------- USERS ----------

export async function setUserStatus(userId: string, suspend: boolean, reason?: string): Promise<ActionResult> {
  const adminUser = await admin();
  await prisma.user.update({ where: { id: userId }, data: { isSuspended: suspend } });
  await audit(adminUser.id, suspend ? "SUSPEND_USER" : "ACTIVATE_USER", "User", userId, { reason });
  revalidatePath("/admin/users");
  return { ok: true };
}

// ---------- GUIDES & KYC ----------

export async function reviewKyc(input: unknown): Promise<ActionResult> {
  const adminUser = await admin();
  const parsed = kycReviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { kycId, decision, notes } = parsed.data;

  const kyc = await prisma.kycVerification.update({
    where: { id: kycId },
    data: {
      status: decision === "APPROVE" ? "APPROVED" : decision === "REJECT" ? "REJECTED" : "RE_VERIFICATION_REQUIRED",
      reviewedAt: new Date(), reviewerId: adminUser.id, reviewNotes: notes,
    },
    include: { guide: true },
    });
  const guideStatus = decision === "APPROVE" ? "APPROVED" : decision === "REJECT" ? "REJECTED" : "PENDING_VERIFICATION";
  await prisma.guideProfile.update({
    where: { id: kyc.guideId },
    data: { status: guideStatus, rejectionReason: decision === "APPROVE" ? null : notes ?? null },
  });
  await audit(adminUser.id, "REVIEW_KYC", "KycVerification", kycId, { decision, notes });
  await notify(kyc.guide.userId, decision === "APPROVE" ? "KYC_APPROVED" : "KYC_REJECTED", { notes: notes ?? "" });
  revalidatePath("/admin/kyc");
  revalidatePath("/admin/guides");
  return { ok: true };
}

export async function setGuideStatus(guideId: string, status: "APPROVED" | "SUSPENDED" | "DEACTIVATED", reason?: string): Promise<ActionResult> {
  const adminUser = await admin();
  await prisma.guideProfile.update({ where: { id: guideId }, data: { status, rejectionReason: reason ?? null } });
  await audit(adminUser.id, "SET_GUIDE_STATUS", "GuideProfile", guideId, { status, reason });
  revalidatePath("/admin/guides");
  return { ok: true };
}

// ---------- LOCATIONS ----------

export async function createState(input: unknown): Promise<ActionResult> {
  await admin();
  const parsed = locationSchemas.state.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await prisma.state.create({ data: parsed.data }).catch(() => {});
  revalidatePath("/admin/locations");
  return { ok: true };
}

export async function createCity(input: unknown): Promise<ActionResult> {
  await admin();
  const parsed = locationSchemas.city.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await prisma.city.create({ data: parsed.data }).catch(() => {});
  revalidatePath("/admin/locations");
  return { ok: true };
}

export async function createDestination(input: unknown): Promise<ActionResult> {
  await admin();
  const parsed = locationSchemas.destination.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { cityId, stateId, ...rest } = parsed.data;
  await prisma.destination.create({ data: { ...rest, cityId: cityId ?? null, stateId: stateId ?? null } });
  revalidatePath("/admin/locations");
  return { ok: true };
}

export async function createAttraction(input: unknown): Promise<ActionResult> {
  await admin();
  const parsed = locationSchemas.attraction.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await prisma.attraction.create({ data: parsed.data });
  revalidatePath("/admin/locations");
  return { ok: true };
}

export async function toggleDestinationPopular(id: string, isPopular: boolean): Promise<ActionResult> {
  await admin();
  await prisma.destination.update({ where: { id }, data: { isPopular } });
  revalidatePath("/admin/locations");
  return { ok: true };
}

// ---------- BOOKINGS / DISPUTES / REFUNDS ----------

export async function adminCancelBooking(bookingId: string, reason: string): Promise<ActionResult> {
  const adminUser = await admin();
  await cancelBooking(bookingId, "ADMIN", reason);
  await audit(adminUser.id, "ADMIN_CANCEL_BOOKING", "Booking", bookingId, { reason });
  revalidatePath("/admin/bookings");
  return { ok: true };
}

export async function resolveDispute(bookingId: string, resolution: "COMPLETE" | "FULL_REFUND" | "PARTIAL_REFUND" | "CANCEL", adminNote: string, partialAmountPaise?: number): Promise<ActionResult> {
  const adminUser = await admin();
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { guide: true, tourist: true, payments: true } });
  if (!booking) return { ok: false, error: "Booking not found" };
  const payment = booking.payments.find((p) => p.status === "CAPTURED");
  if (!payment) return { ok: false, error: "No captured payment to resolve against" };

  if (resolution === "COMPLETE") {
    await prisma.booking.update({ where: { id: bookingId }, data: { status: "COMPLETED" } });
  } else if (resolution === "CANCEL") {
    await prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED", cancelledBy: "ADMIN", cancelReason: adminNote } });
  } else {
    const amount = resolution === "FULL_REFUND" ? payment.amount : (partialAmountPaise ?? 0);
    if (amount <= 0 || amount > payment.amount) return { ok: false, error: "Invalid refund amount" };
    const provider = getPaymentProvider();
    const result = await provider.refund(payment.providerPaymentId!, amount);
    await prisma.refund.create({
      data: { paymentId: payment.id, amount, reason: adminNote, providerRefundId: result.providerRefundId, processedById: adminUser.id },
    });
    await prisma.booking.update({ where: { id: bookingId }, data: { status: "REFUNDED" } });
  }

  await prisma.dispute.updateMany({ where: { bookingId }, data: { status: "RESOLVED", resolution: adminNote, resolvedById: adminUser.id, resolvedAt: new Date() } });
  await audit(adminUser.id, "RESOLVE_DISPUTE", "Booking", bookingId, { resolution, adminNote });
  await notify(booking.tourist.userId, "DISPUTE_UPDATE", { ref: booking.bookingRef, resolution });
  await notify(booking.guide.userId, "DISPUTE_UPDATE", { ref: booking.bookingRef, resolution });
  revalidatePath("/admin/disputes");
  revalidatePath("/admin/bookings");
  return { ok: true };
}

// ---------- PAYOUTS ----------

export async function adminProcessPayout(bookingId: string, reference: string): Promise<ActionResult> {
  await admin();
  try {
    const adminUser = await admin();
    await processPayout(adminUser.id, bookingId, reference);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Payout failed" };
  }
  revalidatePath("/admin/payouts");
  return { ok: true };
}

// ---------- REVIEWS ----------

export async function moderateReview(reviewId: string, action: "REMOVE" | "RESTORE" | "FLAG"): Promise<ActionResult> {
  const adminUser = await admin();
  if (action === "FLAG") {
    await prisma.review.update({ where: { id: reviewId }, data: { isFlagged: true } });
  } else {
    const removed = action === "REMOVE";
    await prisma.review.update({ where: { id: reviewId }, data: { isRemoved: removed, isFlagged: false } });
    // Recalculate guide aggregates after removal
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (review) {
      const agg = await prisma.review.aggregate({
        where: { guideId: review.guideId, isRemoved: false },
        _avg: { rating: true }, _count: true,
      });
      await prisma.guideProfile.update({
        where: { id: review.guideId },
        data: { averageRating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count },
      });
    }
  }
  await audit(adminUser.id, `MODERATE_REVIEW_${action}`, "Review", reviewId);
  revalidatePath("/admin/reviews");
  return { ok: true };
}

// ---------- SETTINGS ----------

export async function updatePlatformSettings(input: unknown): Promise<ActionResult> {
  const adminUser = await admin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await prisma.platformSettings.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  });
  await audit(adminUser.id, "UPDATE_SETTINGS", "PlatformSettings", "singleton", parsed.data);
  revalidatePath("/admin/settings");
  return { ok: true };
}

// ---------- RESOLVE REPORT ----------

export async function resolveReport(reportId: string, resolution: string): Promise<ActionResult> {
  const adminUser = await admin();
  await prisma.report.update({ where: { id: reportId }, data: { status: "RESOLVED", resolution, resolvedAt: new Date() } });
  await audit(adminUser.id, "RESOLVE_REPORT", "Report", reportId, { resolution });
  revalidatePath("/admin/reports");
  return { ok: true };
}
