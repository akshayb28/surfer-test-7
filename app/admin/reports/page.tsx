import { prisma } from "@/lib/prisma";
import { ResolveReportButton } from "./resolve-report-button";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" }, take: 100,
    include: {
      reporter: { select: { name: true, email: true } },
      targetUser: { select: { name: true, email: true, id: true } },
    },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">User reports</h1>
      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.id} className="card p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{r.reporter.name} reported {r.targetUser.name}</p>
                <p className="text-zinc-500">{r.reporter.email} → {r.targetUser.email} · {r.createdAt.toLocaleString("en-IN")}</p>
                <p className="mt-1 rounded-lg bg-zinc-50 p-3">“{r.reason}”</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${r.status === "OPEN" ? "bg-red-50 text-red-700" : "bg-zinc-100 text-zinc-600"}`}>{r.status.toLowerCase()}</span>
                {r.status === "OPEN" && <ResolveReportButton reportId={r.id} />}
              </div>
            </div>
          </div>
        ))}
        {reports.length === 0 && <div className="card p-10 text-center text-zinc-500">No reports.</div>}
      </div>
    </div>
  );
}
