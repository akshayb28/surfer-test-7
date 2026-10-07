import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role, Booking, GuideProfile } from "@prisma/client";
import { redirect } from "next/navigation";

/** Returns the current session or throws. Use in Server Components / Server Actions. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  return session.user;
}

/** Require one of the given roles; redirects if unauthorized. */
export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(user.role === "ADMIN" ? "/admin" : user.role === "GUIDE" ? "/guide" : "/tourist");
  return user;
}

/** Load a booking and verify the current user is a participant (tourist or guide) or admin. */
export async function requireBookingAccess(bookingId: string): Promise<{ booking: Booking; userId: string; isAdmin: boolean; guideUserId?: string; touristUserId?: string }> {
  const user = await requireUser();
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      tourist: { select: { userId: true } },
      guide: { select: { userId: true } },
    },
  });
  if (!booking) throw new Error("Booking not found");
  const isAdmin = user.role === "ADMIN";
  const isTourist = booking.tourist.userId === user.id;
  const isGuide = booking.guide.userId === user.id;
  if (!isAdmin && !isTourist && !isGuide) throw new Error("Forbidden");
  return { booking, userId: user.id, isAdmin, guideUserId: booking.guide.userId, touristUserId: booking.tourist.userId };
}

/** Load a guide profile owned by the current user (or admin). */
export async function requireOwnGuide(guideId?: string): Promise<GuideProfile> {
  const user = await requireUser();
  const guide = guideId
    ? await prisma.guideProfile.findUnique({ where: { id: guideId } })
    : await prisma.guideProfile.findUnique({ where: { userId: user.id } });
  if (!guide) redirect("/guide/apply");
  if (guide.userId !== user.id && user.role !== "ADMIN") throw new Error("Forbidden");
  return guide;
}

/** Write an audit log entry for sensitive admin actions. */
export async function audit(adminId: string, action: string, entityType: string, entityId: string, metadata?: object, ipAddress?: string) {
  await prisma.adminAction.create({ data: { adminId, action, entityType, entityId, metadata: metadata as object | undefined, ipAddress } });
}
