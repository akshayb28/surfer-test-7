import { prisma } from "@/lib/prisma";
import { getNotificationProvider } from "./index";

/**
 * Central event dispatcher: persists an in-app Notification row AND sends email.
 * Fire-and-forget from server actions — failures are logged, never thrown.
 */
export async function notify(userId: string, type: string, payload: Record<string, unknown> = {}) {
  try {
    await prisma.notification.create({ data: { userId, type, payload } });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      const subject = EMAIL_SUBJECTS[type] ?? `Surfer Test: ${type}`;
      await getNotificationProvider().sendEmail(user.email, subject, renderEmail(type, payload));
    }
  } catch (err) {
    console.error("notify failed", type, err);
  }
}

const EMAIL_SUBJECTS: Record<string, string> = {
  BOOKING_REQUEST: "New booking request",
  BOOKING_ACCEPTED: "Your booking was accepted",
  BOOKING_CONFIRMED: "Payment confirmed — your tour is booked",
  BOOKING_CANCELLED: "Booking cancelled",
  BOOKING_REMINDER: "Your tour is tomorrow",
  BOOKING_COMPLETED: "How was your tour? Leave a review",
  KYC_APPROVED: "You're approved as a guide!",
  KYC_REJECTED: "Your guide application needs attention",
  PAYOUT_PROCESSED: "Your payout has been processed",
  DISPUTE_UPDATE: "Update on your dispute",
};

function renderEmail(type: string, p: Record<string, unknown>) {
  const rows = Object.entries(p).map(([k, v]) => `<tr><td style="padding:4px 12px;color:#666">${k}</td><td style="padding:4px 12px">${String(v)}</td></tr>`).join("");
  return `<div style="font-family:system-ui;max-width:480px;margin:0 auto"><h2 style="color:#046c40">${EMAIL_SUBJECTS[type] ?? type}</h2><table style="border-collapse:collapse">${rows}</table><p style="color:#999;font-size:12px;margin-top:24px">Surfer Test — Explore India with a Local</p></div>`;
}
