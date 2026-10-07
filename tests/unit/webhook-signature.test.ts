import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";

// Import after env is set by vitest config
const { razorpayProvider } = await import("@/services/payments/razorpay");

function sign(body: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("Razorpay webhook signature verification", () => {
  const body = JSON.stringify({ event: "payment.captured", payload: {} });

  it("accepts a valid signature on the raw body", () => {
    const sig = sign(body, "test-webhook-secret");
    expect(razorpayProvider.verifyWebhookSignature(body, sig)).toBe(true);
  });

  it("rejects a tampered body (same signature)", () => {
    const sig = sign(body, "test-webhook-secret");
    const tampered = body.replace("payment.captured", "payment.failed");
    expect(razorpayProvider.verifyWebhookSignature(tampered, sig)).toBe(false);
  });

  it("rejects a signature made with the wrong secret", () => {
    const sig = sign(body, "attacker-secret");
    expect(razorpayProvider.verifyWebhookSignature(body, sig)).toBe(false);
  });

  it("rejects garbage input", () => {
    expect(razorpayProvider.verifyWebhookSignature(body, "not-hex")).toBe(false);
  });
});
