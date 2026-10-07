export const COMMISSION_PERCENT = Number(process.env.COMMISSION_PERCENT ?? 15);

export const CANCELLATION_TIERS: Array<{ hoursBefore: number; refundPercent: number }> = [
  { hoursBefore: 48, refundPercent: 100 },
  { hoursBefore: 24, refundPercent: 50 },
  { hoursBefore: 0, refundPercent: 0 },
];

export function refundPercentFor(hoursUntilStart: number): number {
  for (const tier of CANCELLATION_TIERS) {
    if (hoursUntilStart >= tier.hoursBefore) return tier.refundPercent;
  }
  return 0;
}

export const LANGUAGES = ["Hindi", "English", "Marathi", "Tamil", "Telugu", "Kannada", "Bengali", "Gujarati", "Punjabi", "Malayalam", "French", "German", "Spanish", "Japanese", "Mandarin", "Russian", "Arabic"];
