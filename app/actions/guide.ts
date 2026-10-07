"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { guideApplicationSchema, guideProfileUpdateSchema, availabilitySchema, blockedDateSchema } from "@/validations";
import { notify } from "@/services/notifications/events";
import type { ActionResult } from "./auth";

/** Submit (or resubmit) the guide application with KYC info. */
export async function submitGuideApplication(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = guideApplicationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  const existing = await prisma.guideProfile.findUnique({ where: { userId: user.id } });
  const guide = existing
    ? await prisma.guideProfile.update({
        where: { id: existing.id },
        data: { status: "PENDING_VERIFICATION", bio: d.bio, college: d.college || null, currentCityId: d.currentCityId,
          basePrice: d.basePrice, emergencyContactName: d.emergencyContactName, emergencyContactPhone: d.emergencyContactPhone,
          payoutUpiId: d.payoutUpiId || null },
      })
    : await prisma.guideProfile.create({
        data: { userId: user.id, status: "PENDING_VERIFICATION", bio: d.bio, college: d.college || null,
          currentCityId: d.currentCityId, basePrice: d.basePrice, emergencyContactName: d.emergencyContactName,
          emergencyContactPhone: d.emergencyContactPhone, payoutUpiId: d.payoutUpiId || null },
      });

  await prisma.$transaction([
    prisma.guideLanguage.deleteMany({ where: { guideId: guide.id } }),
    prisma.guideLocation.deleteMany({ where: { guideId: guide.id } }),
    prisma.guideTourType.deleteMany({ where: { guideId: guide.id } }),
    ...d.languages.map((language) => prisma.guideLanguage.create({ data: { guideId: guide.id, language } })),
    ...d.destinationIds.map((destinationId) => prisma.guideLocation.create({ data: { guideId: guide.id, destinationId, attractionId: "" } })),
    ...d.tourTypeIds.map((tourTypeId) => prisma.guideTourType.create({ data: { guideId: guide.id, tourTypeId } })),
    prisma.kycVerification.create({ data: { guideId: guide.id, status: "PENDING", idType: d.idType, idLastFour: d.idLastFour } }),
    ...(["TERMS", "GUIDE_CODE_OF_CONDUCT"] as const).map((type) =>
      prisma.agreement.create({ data: { guideId: guide.id, type, version: "1.0" } })),
  ]);

  revalidatePath("/guide");
  return { ok: true };
}

/** Upload KYC document (server receives base64 from client; stored in PRIVATE bucket). */
export async function uploadKycDocument(kycId: string, filename: string, dataBase64: string, contentType: string): Promise<ActionResult> {
  const user = await requireUser();
  const kyc = await prisma.kycVerification.findUnique({ where: { id: kycId }, include: { guide: true } });
  if (!kyc || kyc.guide.userId !== user.id) return { ok: false, error: "Forbidden" };
  const { uploadPrivate, validateUpload, newObjectKey } = await import("@/services/storage/r2");
  const buffer = Buffer.from(dataBase64, "base64");
  const ext = validateUpload(buffer, contentType);
  const key = newObjectKey(`kyc/${kyc.guideId}`, ext);
  await uploadPrivate(key, buffer, contentType);
  const docs = Array.isArray(kyc.documentUrls) ? [...(kyc.documentUrls as string[]), key] : [key];
  await prisma.kycVerification.update({ where: { id: kycId }, data: { documentUrls: docs } });
  return { ok: true };
}

export async function updateGuideProfile(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = guideProfileUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const guide = await prisma.guideProfile.findUnique({ where: { userId: user.id } });
  if (!guide) return { ok: false, error: "Guide profile not found" };
  await prisma.guideProfile.update({ where: { id: guide.id }, data: parsed.data as Record<string, unknown> });
  revalidatePath("/guide/profile");
  return { ok: true };
}

export async function setAvailability(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = availabilitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const guide = await prisma.guideProfile.findUnique({ where: { userId: user.id } });
  if (!guide) return { ok: false, error: "Guide profile not found" };
  await prisma.$transaction([
    prisma.guideAvailability.deleteMany({ where: { guideId: guide.id } }),
    ...parsed.data.slots.map((s) => prisma.guideAvailability.create({ data: { guideId: guide.id, ...s } })),
    prisma.guideProfile.update({ where: { id: guide.id }, data: { maxBookingsPerDay: parsed.data.maxBookingsPerDay } }),
  ]);
  revalidatePath("/guide/availability");
  return { ok: true };
}

export async function addBlockedDate(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = blockedDateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const guide = await prisma.guideProfile.findUnique({ where: { userId: user.id } });
  if (!guide) return { ok: false, error: "Guide profile not found" };
  await prisma.guideBlockedDate.create({ data: { guideId: guide.id, ...parsed.data } }).catch(() => {});
  revalidatePath("/guide/availability");
  return { ok: true };
}

export async function removeBlockedDate(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const row = await prisma.guideBlockedDate.findUnique({ where: { id }, include: { guide: true } });
  if (!row || row.guide.userId !== user.id) return { ok: false, error: "Forbidden" };
  await prisma.guideBlockedDate.delete({ where: { id } });
  revalidatePath("/guide/availability");
  return { ok: true };
}

export async function requestPayoutNote(): Promise<ActionResult> {
  // Payouts are admin-initiated; guides can only see status. Kept as a no-op
  // action so the UI doesn't promise an unimplemented flow.
  return { ok: true };
}

// Re-export for admin notifications used in tests
export { notify };
