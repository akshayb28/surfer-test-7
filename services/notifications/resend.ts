import { Resend } from "resend";
import type { NotificationProvider } from "./types";

let resend: Resend | null = null;
function getResend() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export const resendProvider: NotificationProvider = {
  async sendEmail(to, subject, html) {
    if (!process.env.RESEND_API_KEY) { console.log(`[email skipped - no API key] To: ${to} | ${subject}`); return; }
    await getResend().emails.send({ from: process.env.EMAIL_FROM ?? "noreply@surfer.test", to, subject, html });
  },
};
