export interface NotificationProvider {
  sendEmail(to: string, subject: string, html: string): Promise<void>;
}
