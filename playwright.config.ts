import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: { baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", screenshot: "only-on-failure" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { ...process.env } as Record<string, string>,
  },
});
