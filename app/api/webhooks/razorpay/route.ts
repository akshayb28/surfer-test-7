import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/services/payments";
import { notify } from "@/services/notifications/events";

/**
 * Razorpay webhook. SECURITY: verify HMAC signature against the RAW body
 * before parsing. Never trust payload contents without verification.
 *
 * Configure in Razorpay dashboard: https://<host>/api/webhooks/razorpay
 * Events: payment.captured, payment.failed, refund.processed
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  const provider = getPaymentProvider();
  if (!provider.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const entity = event.payload?.payment?.entity ?? event.payload?.refund?.entity;

  switch (event.event) {
    case "payment.captured": {
      const payment = await prisma.payment.findUnique({ where: { providerOrderId: entity.order_id } });
      if (!payment) return NextResponse.json({ ok: true }); // unknown order — ack to stop retries
      if (payment.status === "CAPTURED") return NextResponse.json({ ok: true }); // idempotent

      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "CAPTURED", providerPaymentId: entity.id, rawWebhook: event },
      });
      const booking = await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CONFIRMED" },
        include: { guide: true, tourist: true },
      });
      await notify(booking.tourist.userId, "BOOKING_CONFIRMED", { ref: booking.bookingRef });
      await notify(booking.guide.userId, "BOOKING_REQUEST", { ref: booking.bookingRef, paid: "true" });
      void updated;
      break;
    }
    case "payment.failed": {
      await prisma.payment.updateMany({
        where: { providerOrderId: entity.order_id },
        data: { status: "FAILED", rawWebhook: event },
      });
      break;
    }
    case "refund.processed": {
      const payment = await prisma.payment.findFirst({ where: { providerPaymentId: entity.payment_id } });
      if (payment) {
        await prisma.payment.update({ where: { id: payment.id }, data: { rawWebhook: event } });
        await prisma.refund.updateMany({
          where: { paymentId: payment.id, providerRefundId: null },
          data: { providerRefundId: entity.id },
        });
        await prisma.booking.update({ where: { id: payment.bookingId }, data: { status: "REFUNDED" } });
      }
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
