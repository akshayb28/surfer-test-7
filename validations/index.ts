import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(72),
  accountType: z.enum(["TOURIST", "GUIDE"]).default("TOURIST"),
});

export const guideApplicationSchema = z.object({
  bio: z.string().min(40, "Tell tourists a bit more about yourself (min 40 chars)").max(1000),
  college: z.string().min(2).max(120).optional().or(z.literal("")),
  currentCityId: z.string().cuid(),
  languages: z.array(z.string()).min(1, "Add at least one language"),
  destinationIds: z.array(z.string().cuid()).min(1, "Select at least one area you cover"),
  tourTypeIds: z.array(z.string().cuid()).min(1, "Select at least one tour type"),
  basePrice: z.coerce.number().int().min(100).max(50000), // INR
  emergencyContactName: z.string().min(2).max(80),
  emergencyContactPhone: z.string().regex(/^[+0-9()\-\s]{8,16}$/, "Invalid phone number"),
  payoutUpiId: z.string().regex(/^[\w.\-]{2,}@[a-zA-Z]{2,}$/, "Invalid UPI ID").optional().or(z.literal("")),
  idType: z.enum(["AADHAAR", "PAN", "PASSPORT", "STUDENT_ID"]),
  idLastFour: z.string().regex(/^\d{4}$/, "Enter last 4 digits only"),
  agreeTerms: z.literal(true),
  agreeCodeOfConduct: z.literal(true),
});

export const guideProfileUpdateSchema = guideApplicationSchema.partial().omit({ idType: true, idLastFour: true, agreeTerms: true, agreeCodeOfConduct: true });

export const availabilitySchema = z.object({
  slots: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })).min(1),
  maxBookingsPerDay: z.number().int().min(1).max(10),
});

export const blockedDateSchema = z.object({
  date: z.coerce.date(),
  reason: z.string().max(200).optional(),
});

export const bookingRequestSchema = z.object({
  guideId: z.string().cuid(),
  destinationId: z.string().cuid(),
  tourTypeId: z.string().cuid().optional(),
  date: z.coerce.date().refine((d) => d >= new Date(new Date().setHours(0,0,0,0)), "Date must be today or later"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationHours: z.coerce.number().int().min(1).max(12),
  partySize: z.coerce.number().int().min(1).max(20),
  meetingLocation: z.string().min(3).max(200),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  bookingId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().or(z.literal("")),
});

export const reviewResponseSchema = z.object({
  reviewId: z.string().cuid(),
  response: z.string().min(2).max(1000),
});

export const messageSchema = z.object({
  conversationId: z.string().cuid(),
  body: z.string().min(1).max(2000),
});

export const reportSchema = z.object({
  targetUserId: z.string().cuid(),
  bookingId: z.string().cuid().optional(),
  reason: z.string().min(10).max(1000),
});

export const disputeSchema = z.object({
  bookingId: z.string().cuid(),
  reason: z.string().min(10).max(1000),
});

export const kycReviewSchema = z.object({
  kycId: z.string().cuid(),
  decision: z.enum(["APPROVE", "REJECT", "RE_VERIFICATION"]),
  notes: z.string().max(500).optional(),
});

export const locationSchemas = {
  state: z.object({ name: z.string().min(2).max(60) }),
  city: z.object({ name: z.string().min(2).max(60), stateId: z.string().cuid() }),
  destination: z.object({
    name: z.string().min(2).max(80), slug: z.string().regex(/^[a-z0-9-]+$/),
    cityId: z.string().cuid().optional(), stateId: z.string().cuid().optional(),
    description: z.string().max(500).optional(), isPopular: z.boolean().default(false),
  }),
  attraction: z.object({
    name: z.string().min(2).max(120), destinationId: z.string().cuid(), cityId: z.string().cuid().optional(),
  }),
};

export const settingsSchema = z.object({
  commissionPercent: z.coerce.number().min(0).max(50),
});
