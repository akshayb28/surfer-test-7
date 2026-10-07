"use server";

import { requireUser, requireBookingAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/services/payments";
import { notify } from "@/services/notifications/events";
import { COMMISSION_PERCENT } from "@/lib/constants";
import type { ActionResult } from "./auth";

/**
 * Create a Razorpay order for a booking the tourist owns.
 * Returns order id + key so the client can open Razorpay Checkout.
 */
export async function createPaymentOrder(bookingId: string): Promise<ActionResult & { orderId?: string; keyId?: string; amount?: number }> {
  const { booking, userId } = await requireBookingAccess(bookingId);
  const tourist = await prisma.touristProfile.findUnique({ where: { id: booking.touristId } });
  if (tourist?.userId !== userId) return { ok: false, error: "Forbidden" };
  if (!["REQUESTED", "PENDING_PAYMENT"].includes(booking.status)) {
    return { ok: false, error: "Booking is not awaiting payment" };
  }

  await prisma.booking.update({ where: { id: bookingId }, data: { status: "PENDING_PAYMENT" } });

  const provider = getPaymentProvider();

  const order = await provider.createOrder({
    amountPaise: booking.totalAmount, currency: "INR", reference: booking.bookingRef,
    notes: { bookingId: booking.id },
  });

  await prisma.payment.create({
    data: {
      bookingId, providerOrderId: order.providerOrderId, amount: booking.totalAmount,
      commissionAmount: Math.round((booking.totalAmount * COMMISSION_PERCENT) / 100),
      guideEarnings: booking.totalAmount - Math.round((booking.totalAmount * COMMISSION_PERCENT) / 100),
      status: "CREATED",
    },
  });

  return { ok: true, orderId: order.providerOrderId, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount: booking.totalAmount };
}
