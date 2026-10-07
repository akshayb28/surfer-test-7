export interface OrderResult { providerOrderId: string; amount: number; currency: string; }
export interface RefundResult { providerRefundId: string; }

export interface PaymentProvider {
  readonly name: string;
  createOrder(args: { amountPaise: number; currency: "INR"; reference: string; notes?: Record<string, string> }): Promise<OrderResult>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  refund(providerPaymentId: string, amountPaise?: number): Promise<RefundResult>;
}
