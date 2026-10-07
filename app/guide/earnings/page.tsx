import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatDate, formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GuideEarningsPage() {
  const user = await requireRole("GUIDE", "ADMIN");
  const guide = await prisma.guideProfile.findUnique({ where: { userId: user.id } });
  if (!guide) return null;

  const [bookings, payouts] = await Promise.all([
    prisma.booking.findMany({
      where: { guideId: guide.id, status: { in: ["COMPLETED", "REFUNDED"] } },
      orderBy: { date: "desc" },
      include: { destination: true },
    }),
    prisma.guidePayout.findMany({ where: { guideId: guide.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const totalEarned = bookings.filter((b) => b.status === "COMPLETED").reduce((s, b) => s + b.guideEarnings, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Earnings & payouts</h1>
      <p className="mb-6 text-sm text-zinc-500">
        You keep 85% of every booking (15% platform commission is deducted before payout), transferred to your UPI:{" "}
        <span className="font-medium text-zinc-700">{guide.payoutUpiId ?? "not set"}</span>
      </p>

      <div className="card mb-6 p-5">
        <p className="text-sm text-zinc-500">Total earned from completed tours</p>
        <p className="mt-1 text-2xl font-bold">{formatINR(totalEarned)}</p>
      </div>

      <h2 className="mb-3 font-semibold">Completed tours</h2>
      <div className="card divide-y divide-zinc-100 text-sm">
        {bookings.map((b) => (
          <div key={b.id} className="flex items-center justify-between p-3">
            <span>{b.destination.name} · {formatDate(b.date)}</span>
            <span className="font-medium">{formatINR(b.guideEarnings)}</span>
          </div>
        ))}
        {bookings.length === 0 && <p className="p-4 text-zinc-400">No completed tours yet.</p>}
      </div>

      <h2 className="mb-3 mt-8 font-semibold">Payout history</h2>
      <div className="card divide-y divide-zinc-100 text-sm">
        {payouts.map((p) => (
          <div key={p.id} className="flex items-center justify-between p-3">
            <span>{formatDate(p.createdAt)} · {p.reference ?? "—"}</span>
            <span>
              <span className="font-medium">{formatINR(p.amount)}</span>
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${p.status === "PROCESSED" ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"}`}>{p.status.toLowerCase()}</span>
            </span>
          </div>
        ))}
        {payouts.length === 0 && <p className="p-4 text-zinc-400">No payouts yet — they appear here once processed.</p>}
      </div>
    </div>
  );
}
