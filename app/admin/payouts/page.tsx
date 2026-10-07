import { prisma } from "@/lib/prisma";
import { PayoutButton } from "./payout-button";
import { formatDate, formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  // Bookings with no payout record yet. GuidePayout.bookingId is a plain string
  // (no FK relation in schema), so we diff in memory.
  const [completed, paidPayouts] = await Promise.all([
    prisma.booking.findMany({
      where: { status: "COMPLETED" }, orderBy: { date: "asc" }, take: 200,
      include: { guide: { include: { user: { select: { name: true } } } }, destination: true },
    }),
    prisma.guidePayout.findMany({ where: { bookingId: { not: null } }, select: { bookingId: true } }),
  ]);
  const paidSet = new Set(paidPayouts.map((p) => p.bookingId));
  const completedUnpaid = completed.filter((b) => !paidSet.has(b.id));

  const recent = await prisma.guidePayout.findMany({
    orderBy: { createdAt: "desc" }, take: 30,
    include: { guide: { include: { user: { select: { name: true } } } } },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Payouts</h1>
      <h2 className="mb-3 font-semibold">Awaiting payout ({completedUnpaid.length})</h2>
      <div className="card divide-y divide-zinc-100">
        {completedUnpaid.map((b) => (
          <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div>
              <p className="font-medium">{b.guide.user.name} · {formatINR(b.guideEarnings)}</p>
              <p className="text-zinc-500">{b.destination.name} · {formatDate(b.date)} · {b.guide.payoutUpiId ?? "no UPI on file"} · ref {b.bookingRef}</p>
            </div>
            <PayoutButton bookingId={b.id} />
          </div>
        ))}
        {completedUnpaid.length === 0 && <p className="p-6 text-center text-zinc-400">All completed bookings are paid out.</p>}
      </div>
      <h2 className="mb-3 mt-8 font-semibold">Recent payouts</h2>
      <div className="card divide-y divide-zinc-100 text-sm">
        {recent.map((p) => (
          <div key={p.id} className="flex items-center justify-between p-3">
            <span>{p.guide.user.name} · {formatDate(p.createdAt)} · {p.reference ?? "—"}</span>
            <span className="font-medium">{formatINR(p.amount)} <span className="ml-1 text-xs text-zinc-400">{p.status.toLowerCase()}</span></span>
          </div>
        ))}
        {recent.length === 0 && <p className="p-4 text-zinc-400">No payouts processed yet.</p>}
      </div>
    </div>
  );
}
