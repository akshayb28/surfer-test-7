import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { formatDate, formatINR } from "@/lib/utils";
import type { GuideStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_HINTS: Partial<Record<GuideStatus, string>> = {
  PENDING_VERIFICATION: "Your application is pending verification. We review KYC within 2 business days.",
  KYC_UNDER_REVIEW: "Your KYC is under review.",
  REJECTED: "Your application was rejected. You can re-apply with corrected information.",
  SUSPENDED: "Your account is suspended. Contact support.",
  DEACTIVATED: "Your account is deactivated. Contact support to reactivate.",
};

export default async function GuideDashboard() {
  const user = await requireRole("GUIDE", "ADMIN");
  const guide = await prisma.guideProfile.findUnique({ where: { userId: user.id } });

  if (!guide) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Become a local guide</h1>
        <p className="mt-2 text-zinc-600">Complete your application and KYC to start receiving bookings.</p>
        <Link href="/guide/apply" className="btn-primary mt-6">Start application</Link>
      </div>
    );
  }

  if (guide.status !== "APPROVED") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Application status: {guide.status.replaceAll("_", " ").toLowerCase()}</h1>
        <p className="mt-2 text-zinc-600">{STATUS_HINTS[guide.status]}</p>
        {guide.rejectionReason && <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">Reason: {guide.rejectionReason}</p>}
        <div className="mt-6 flex justify-center gap-3">
          {guide.status === "REJECTED" && <Link href="/guide/apply" className="btn-primary">Re-apply</Link>}
          <Link href="/guide/profile" className="btn-outline">Edit profile</Link>
        </div>
      </div>
    );
  }

  const [bookings, earnings] = await Promise.all([
    prisma.booking.findMany({
      where: { guideId: guide.id },
      orderBy: { date: "desc" },
      take: 6,
      include: { tourist: { include: { user: { select: { name: true } } } }, destination: true },
    }),
    prisma.booking.aggregate({ where: { guideId: guide.id, status: "COMPLETED" }, _sum: { guideEarnings: true }, _count: true }),
  ]);
  const pendingPayouts = await prisma.guidePayout.aggregate({ where: { guideId: guide.id, status: "PENDING" }, _sum: { amount: true } });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Guide dashboard</h1>
          <p className="text-sm text-zinc-500">⭐ {guide.averageRating.toFixed(1)} · {guide.reviewCount} reviews · {formatINR(guide.basePrice)}/slot</p>
        </div>
        <div className="flex gap-2">
          <Link href="/guide/availability" className="btn-outline">Availability</Link>
          <Link href="/guide/profile" className="btn-outline">Profile</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-zinc-500">Total earnings</p><p className="mt-1 text-2xl font-bold">{formatINR(earnings._sum.guideEarnings ?? 0)}</p></div>
        <div className="card p-5"><p className="text-sm text-zinc-500">Completed tours</p><p className="mt-1 text-2xl font-bold">{earnings._count}</p></div>
        <div className="card p-5"><p className="text-sm text-zinc-500">Pending payout</p><p className="mt-1 text-2xl font-bold">{formatINR(pendingPayouts._sum.amount ?? 0)}</p></div>
      </div>

      <h2 className="mb-3 mt-8 font-semibold">Recent bookings</h2>
      <div className="space-y-3">
        {bookings.map((b) => (
          <Link key={b.id} href="/guide/bookings" className="card flex items-center justify-between gap-4 p-4 hover:shadow-md">
            <div>
              <p className="font-medium">{b.destination.name} · {b.tourist.user.name}</p>
              <p className="text-sm text-zinc-500">{formatDate(b.date)} · {b.startTime} · {formatINR(b.guideEarnings)} to you</p>
            </div>
            <BookingStatusBadge status={b.status} />
          </Link>
        ))}
        {bookings.length === 0 && <div className="card p-8 text-center text-zinc-500">No bookings yet — tourists will see you in search results for your areas.</div>}
      </div>
    </div>
  );
}
