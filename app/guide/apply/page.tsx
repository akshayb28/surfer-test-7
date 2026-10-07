import { redirect } from "next/navigation";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { GuideApplicationForm } from "./guide-application-form";
import { LANGUAGES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function GuideApplyPage() {
  const user = await requireRole("GUIDE", "ADMIN");
  const existing = await prisma.guideProfile.findUnique({ where: { userId: user.id } });
  if (existing?.status === "APPROVED") redirect("/guide");

  const [cities, destinations, tourTypes] = await Promise.all([
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    prisma.destination.findMany({ orderBy: { name: "asc" } }),
    prisma.tourType.findMany(),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">Guide application</h1>
      <p className="mt-1 text-sm text-zinc-500">Your application goes through KYC review before you appear in search. We store only the last 4 digits of your ID.</p>
      <div className="card mt-6 p-6">
        <GuideApplicationForm
          cities={cities.map((c) => ({ id: c.id, name: c.name }))}
          destinations={destinations.map((d) => ({ id: d.id, name: d.name }))}
          tourTypes={tourTypes.map((t) => ({ id: t.id, name: t.name }))}
          languages={LANGUAGES}
        />
      </div>
    </div>
  );
}
