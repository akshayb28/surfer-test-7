import { razorpayProvider } from "./razorpay";
import type { PaymentProvider } from "./types";

/**
 * Single call-site for payments. Swap providers by changing this factory.
 * e.g. add services/payments/cashfree.ts implementing PaymentProvider.
 */
export function getPaymentProvider(): PaymentProvider {
  return razorpayProvider;
}

export type { PaymentProvider, OrderResult, RefundResult } from "./types";
