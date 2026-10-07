import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { TouristBookingActions } from "@/components/booking-actions";
import { formatDate, formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TouristBookingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireRole("TOURIST", "ADMIN");
  const sp = await searchParams;
  const profile = await prisma.touristProfile.findUnique({ where: { userId: user.id } });
  const bookings = profile
    ? await prisma.booking.findMany({
        where: { touristId: profile.id },
        orderBy: { date: "desc" },
        include: {
          guide: { include: { user: { select: { name: true } } } },
          destination: true,
          conversation: { select: { id: true } },
        },
      })
    : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {sp.paid && <p className="mb-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">Payment received — your booking is confirmed once the guide accepts.</p>}
      <h1 className="mb-6 text-2xl font-bold">My bookings</h1>
      <div className="space-y-4">
        {bookings.map((b) => (
          <div key={b.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{b.destination.name} with {b.guide.user.name}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {formatDate(b.date)} · starts {b.startTime} · {b.durationHours}h · {b.partySize} traveller{b.partySize > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-zinc-500">Meet at: {b.meetingLocation} · {formatINR(b.totalAmount)}</p>
                <p className="mt-1 text-xs text-zinc-400">Ref {b.bookingRef}</p>
              </div>
              <BookingStatusBadge status={b.status} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href={`/tourist/messages/${b.conversation.id}`} className="text-sm text-brand-700 hover:underline">Message guide</Link>
              <TouristBookingActions bookingId={b.id} status={b.status} />
            </div>
          </div>
        ))}
        {bookings.length === 0 && (
          <div className="card p-10 text-center text-zinc-500">
            <p className="font-medium text-zinc-700">No bookings yet.</p>
            <Link href="/" className="mt-2 inline-block text-brand-700 hover:underline">Search a destination →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
