import { prisma } from "@/lib/prisma";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { AdminBookingActions } from "./admin-booking-actions";
import { formatDate, formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const status = sp.status;
  const bookings = await prisma.booking.findMany({
    where: status ? { status: status as never } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { tourist: { include: { user: { select: { name: true } } } }, guide: { include: { user: { select: { name: true } } } }, destination: true, payments: true },
  });
  const statuses = ["REQUESTED", "PENDING_PAYMENT", "CONFIRMED", "GUIDE_ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "DISPUTED", "REFUNDED"];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Bookings</h1>
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <a href="/admin/bookings" className={`rounded-full px-3 py-1.5 ${!status ? "bg-zinc-900 text-white" : "bg-zinc-100"}`}>All</a>
        {statuses.map((s) => (
          <a key={s} href={`/admin/bookings?status=${s}`} className={`rounded-full px-3 py-1.5 ${status === s ? "bg-zinc-900 text-white" : "bg-zinc-100"}`}>{s.replaceAll("_", " ").toLowerCase()}</a>
        ))}
      </div>
      <div className="card divide-y divide-zinc-100">
        {bookings.map((b) => {
          const payment = b.payments[0];
          return (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div>
                <p className="font-medium">{b.destination.name} · {b.tourist.user.name} ↔ {b.guide.user.name}</p>
                <p className="text-zinc-500">{formatDate(b.date)} · {b.startTime} · {formatINR(b.totalAmount)} · ref {b.bookingRef}</p>
                {payment && <p className="text-xs text-zinc-400">commission {formatINR(payment.commissionAmount)} · guide {formatINR(payment.guideEarnings)} · payment {payment.status.toLowerCase()}</p>}
              </div>
              <div className="flex items-center gap-3">
                <BookingStatusBadge status={b.status} />
                <AdminBookingActions bookingId={b.id} status={b.status} />
              </div>
            </div>
          );
        })}
        {bookings.length === 0 && <p className="p-6 text-center text-zinc-400">No bookings found.</p>}
      </div>
    </div>
  );
}
