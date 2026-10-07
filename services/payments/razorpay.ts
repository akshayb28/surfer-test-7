import Razorpay from "razorpay";
import crypto from "crypto";
import type { PaymentProvider, OrderResult, RefundResult } from "./types";

function client() {
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
}

export const razorpayProvider: PaymentProvider = {
  name: "razorpay",

  async createOrder({ amountPaise, currency, reference, notes }): Promise<OrderResult> {
    const order = await client().orders.create({
      amount: amountPaise, currency, receipt: reference, notes: notes as Record<string, string> | undefined,
    });
    return { providerOrderId: order.id, amount: order.amount as number, currency: order.currency as string };
  },

  // Must receive the RAW request body (string) — verify before JSON.parse.
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return false;
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  },

  async refund(providerPaymentId, amountPaise): Promise<RefundResult> {
    const params: Record<string, unknown> = {};
    if (amountPaise) params.amount = amountPaise;
    const refund = await client().payments.refund(providerPaymentId, params);
    return { providerRefundId: refund.id };
  },
};
