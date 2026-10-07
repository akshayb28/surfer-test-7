import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { GuideBookingActions } from "./guide-booking-actions";
import { formatDate, formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GuideBookingsPage() {
  const user = await requireRole("GUIDE", "ADMIN");
  const guide = await prisma.guideProfile.findUnique({ where: { userId: user.id } });
  if (!guide) return null;

  const bookings = await prisma.booking.findMany({
    where: { guideId: guide.id },
    orderBy: { date: "desc" },
    include: { tourist: { include: { user: { select: { name: true } } } }, destination: true, conversation: { select: { id: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Bookings</h1>
      <div className="space-y-4">
        {bookings.map((b) => (
          <div key={b.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{b.destination.name} · {b.tourist.user.name}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {formatDate(b.date)} · {b.startTime} · {b.durationHours}h · party of {b.partySize} · {formatINR(b.guideEarnings)} to you
                </p>
                <p className="text-sm text-zinc-500">Meet at: {b.meetingLocation}</p>
                {b.notes && <p className="mt-1 text-sm italic text-zinc-500">“{b.notes}”</p>}
              </div>
              <BookingStatusBadge status={b.status} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href={`/guide/messages/${b.conversation.id}`} className="text-sm text-brand-700 hover:underline">Message tourist</Link>
              <GuideBookingActions bookingId={b.id} status={b.status} />
            </div>
          </div>
        ))}
        {bookings.length === 0 && <div className="card p-10 text-center text-zinc-500">No bookings yet.</div>}
      </div>
    </div>
  );
}
