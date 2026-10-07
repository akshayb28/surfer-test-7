import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { formatDate, formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TouristDashboard() {
  const user = await requireRole("TOURIST", "ADMIN");
  const profile = await prisma.touristProfile.findUnique({ where: { userId: user.id } });
  const bookings = profile
    ? await prisma.booking.findMany({
        where: { touristId: profile.id },
        orderBy: { date: "desc" },
        take: 5,
        include: { guide: { include: { user: { select: { name: true } } } }, destination: true },
      })
    : [];
  const notifications = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">Hello, {user.name}</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Your bookings</h2>
            <Link href="/tourist/bookings" className="text-sm text-brand-700 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {bookings.map((b) => (
              <Link key={b.id} href="/tourist/bookings" className="card flex items-center justify-between gap-4 p-4 hover:shadow-md">
                <div>
                  <p className="font-medium">{b.destination.name} with {b.guide.user.name}</p>
                  <p className="text-sm text-zinc-500">{formatDate(b.date)} · {b.startTime} · {formatINR(b.totalAmount)}</p>
                </div>
                <BookingStatusBadge status={b.status} />
              </Link>
            ))}
            {bookings.length === 0 && (
              <div className="card p-8 text-center text-zinc-500">
                <p>No bookings yet.</p>
                <Link href="/" className="mt-2 inline-block text-brand-700 hover:underline">Find a guide →</Link>
              </div>
            )}
          </div>
        </div>
        <div>
          <h2 className="mb-3 font-semibold">Notifications</h2>
          <div className="card divide-y divide-zinc-100">
            {notifications.map((n) => (
              <div key={n.id} className="p-3 text-sm">
                <p className="font-medium">{n.type.replaceAll("_", " ").toLowerCase()}</p>
                <p className="text-xs text-zinc-500">{new Date(n.createdAt).toLocaleString("en-IN")}</p>
              </div>
            ))}
            {notifications.length === 0 && <p className="p-4 text-sm text-zinc-400">Nothing yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
