import { resendProvider } from "./resend";
import type { NotificationProvider } from "./types";

export function getNotificationProvider(): NotificationProvider {
  return resendProvider; // swap for SMS/WhatsApp-capable provider later without touching call sites
}
export type { NotificationProvider } from "./types";
