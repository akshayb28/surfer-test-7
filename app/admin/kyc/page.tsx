import { prisma } from "@/lib/prisma";
import { KycReviewButtons } from "./kyc-review-buttons";
import { SignedDocLink } from "./signed-doc-link";

export const dynamic = "force-dynamic";

export default async function AdminKycPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const kycList = await prisma.kycVerification.findMany({
    where: sp.focus ? { id: sp.focus } : { status: { in: ["PENDING", "UNDER_REVIEW", "RE_VERIFICATION_REQUIRED"] } },
    orderBy: { submittedAt: "asc" },
    include: { guide: { include: { user: { select: { name: true, email: true } } } } },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">KYC review queue</h1>
      <div className="space-y-4">
        {kycList.map((k) => (
          <div key={k.id} className="card p-5 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{k.guide.user.name} <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">{k.status.replaceAll("_", " ").toLowerCase()}</span></p>
                <p className="text-zinc-500">{k.guide.user.email} · {k.guide.college ?? "no college listed"}</p>
                <p className="mt-1">ID: {k.idType} ···{k.idLastFour}</p>
                {k.reviewNotes && <p className="mt-1 text-xs text-zinc-500">Notes: {k.reviewNotes}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  {Array.isArray(k.documentUrls) && (k.documentUrls as string[]).map((_, i) => (
                    <SignedDocLink key={i} kycId={k.id} doc={i} />
                  ))}
                </div>
                <KycReviewButtons kycId={k.id} />
              </div>
            </div>
          </div>
        ))}
        {kycList.length === 0 && <div className="card p-10 text-center text-zinc-500">Queue is clear. 🎉</div>}
      </div>
    </div>
  );
}
