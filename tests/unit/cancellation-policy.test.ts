import { describe, it, expect } from "vitest";
import { refundPercentFor } from "@/lib/constants";

describe("cancellation refund policy", () => {
  it("full refund >= 48h before start", () => {
    expect(refundPercentFor(72)).toBe(100);
    expect(refundPercentFor(48)).toBe(100);
  });
  it("50% refund between 24h and 48h", () => {
    expect(refundPercentFor(36)).toBe(50);
    expect(refundPercentFor(24)).toBe(50);
  });
  it("no refund under 24h", () => {
    expect(refundPercentFor(12)).toBe(0);
    expect(refundPercentFor(0)).toBe(0);
    expect(refundPercentFor(-2)).toBe(0);
  });
});
