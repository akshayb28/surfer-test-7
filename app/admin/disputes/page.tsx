import { prisma } from "@/lib/prisma";
import { DisputeResolveForm } from "./dispute-resolve-form";
import { formatDate, formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDisputesPage() {
  const disputes = await prisma.dispute.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      booking: {
        include: {
          tourist: { include: { user: { select: { name: true } } } },
          guide: { include: { user: { select: { name: true } } } },
          destination: true,
          payments: true,
        },
      },
    },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Disputes</h1>
      <div className="space-y-4">
        {disputes.map((d) => (
          <div key={d.id} className="card p-5 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {d.booking.destination.name} · {d.booking.tourist.user.name} ↔ {d.booking.guide.user.name}
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${d.status === "OPEN" ? "bg-red-50 text-red-700" : "bg-zinc-100 text-zinc-600"}`}>{d.status.toLowerCase()}</span>
                </p>
                <p className="text-zinc-500">{formatDate(d.booking.date)} · {formatINR(d.booking.totalAmount)} · ref {d.booking.bookingRef}</p>
                <p className="mt-2 rounded-lg bg-zinc-50 p-3">“{d.reason}”</p>
                {d.resolution && <p className="mt-1 text-xs text-zinc-500">Resolution: {d.resolution}</p>}
              </div>
              {d.status === "OPEN" && <DisputeResolveForm bookingId={d.bookingId} capturedAmount={d.booking.payments[0]?.amount ?? 0} />}
            </div>
          </div>
        ))}
        {disputes.length === 0 && <div className="card p-10 text-center text-zinc-500">No disputes. 🎉</div>}
      </div>
    </div>
  );
}
