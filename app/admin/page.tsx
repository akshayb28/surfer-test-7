import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [users, guides, verifiedGuides, activeGuides, bookings, completed, cancelled, payments] = await Promise.all([
    prisma.user.count({ where: { role: "TOURIST", deletedAt: null } }),
    prisma.guideProfile.count({ where: { deletedAt: null } }),
    prisma.guideProfile.count({ where: { status: "APPROVED" } }),
    prisma.guideProfile.count({ where: { status: "APPROVED", deletedAt: null } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
    prisma.payment.aggregate({ where: { status: "CAPTURED" }, _sum: { amount: true, commissionAmount: true, guideEarnings: true } }),
  ]);

  const gmv = payments._sum.amount ?? 0;
  const revenue = payments._sum.commissionAmount ?? 0;
  const guidePayouts = payments._sum.guideEarnings ?? 0;

  const [topGuides, topDestinations, pendingKyc, openDisputes, openReports] = await Promise.all([
    prisma.guideProfile.findMany({ where: { status: "APPROVED" }, orderBy: { averageRating: "desc" }, take: 5, include: { user: { select: { name: true } } } }),
    prisma.destination.findMany({ take: 5, include: { _count: { select: { guideLocations: true } } }, orderBy: { guideLocations: { _count: "desc" } } }),
    prisma.kycVerification.count({ where: { status: { in: ["PENDING", "UNDER_REVIEW"] } } }),
    prisma.dispute.count({ where: { status: "OPEN" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
  ]);

  const stat = (label: string, value: string | number, href?: string) => (
    <a href={href ?? "#"} className="card block p-4 hover:shadow-md">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </a>
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Admin dashboard</h1>

      {(pendingKyc > 0 || openDisputes > 0 || openReports > 0) && (
        <div className="mb-6 flex flex-wrap gap-3 text-sm">
          {pendingKyc > 0 && <a href="/admin/kyc" className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">⏳ {pendingKyc} KYC applications waiting</a>}
          {openDisputes > 0 && <a href="/admin/disputes" className="rounded-lg bg-red-50 px-3 py-2 text-red-800">⚠️ {openDisputes} open disputes</a>}
          {openReports > 0 && <a href="/admin/reports" className="rounded-lg bg-red-50 px-3 py-2 text-red-800">🚩 {openReports} open reports</a>}
        </div>
      )}

      <h2 className="mb-3 font-semibold">Marketplace</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stat("Tourists", users, "/admin/users")}
        {stat("Guides (verified)", `${verifiedGuides}/${guides}`, "/admin/guides")}
        {stat("Bookings", bookings, "/admin/bookings")}
        {stat("Completion rate", bookings ? `${Math.round((completed / bookings) * 100)}%` : "—")}
      </div>

      <h2 className="mb-3 mt-8 font-semibold">Money</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stat("Gross booking value", formatINR(gmv))}
        {stat("Platform revenue", formatINR(revenue))}
        {stat("Guide earnings owed", formatINR(guidePayouts))}
        {stat("Cancelled bookings", cancelled)}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 font-semibold">Top guides</h3>
          <div className="space-y-2 text-sm">
            {topGuides.map((g) => (
              <div key={g.id} className="flex justify-between"><span>{g.user.name}</span><span>⭐ {g.averageRating.toFixed(1)} · {g.reviewCount} reviews</span></div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="mb-3 font-semibold">Top destinations (by guide coverage)</h3>
          <div className="space-y-2 text-sm">
            {topDestinations.map((d) => (
              <div key={d.id} className="flex justify-between"><span>{d.name}</span><span>{d._count.guideLocations} guides</span></div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-zinc-400">Monthly revenue grouping is available in the database via Payment.createdAt; wire a chart component here when needed.</p>
    </div>
  );
}
