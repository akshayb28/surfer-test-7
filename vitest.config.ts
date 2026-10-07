import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: { RAZORPAY_WEBHOOK_SECRET: "test-webhook-secret", COMMISSION_PERCENT: "15" },
  },
});
