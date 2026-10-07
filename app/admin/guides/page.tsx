import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/utils";
import { GuideStatusActions } from "./guide-status-actions";

export const dynamic = "force-dynamic";

export default async function AdminGuidesPage() {
  const guides = await prisma.guideProfile.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      kyc: { orderBy: { submittedAt: "desc" }, take: 1 },
      _count: { select: { bookings: true } },
    },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Guides</h1>
      <div className="card divide-y divide-zinc-100">
        {guides.map((g) => (
          <div key={g.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div>
              <p className="font-medium">
                {g.user.name}
                <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs">{g.status.replaceAll("_", " ").toLowerCase()}</span>
                {g.isStudentVerified && <span className="ml-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">student ✓</span>}
              </p>
              <p className="text-zinc-500">{g.user.email} · {g._count.bookings} bookings · ⭐ {g.averageRating.toFixed(1)} · {formatINR(g.basePrice)}/slot</p>
              {g.rejectionReason && <p className="text-xs text-red-600">Reason: {g.rejectionReason}</p>}
            </div>
            <div className="flex items-center gap-2">
              {g.kyc[0] && <Link href={`/admin/kyc?focus=${g.kyc[0].id}`} className="text-xs text-brand-700 hover:underline">View KYC</Link>}
              <GuideStatusActions guideId={g.id} status={g.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
