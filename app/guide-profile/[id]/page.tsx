import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StarRating } from "@/components/star-rating";
import { formatINR } from "@/lib/utils";
import { BookingForm } from "./booking-form";

export const dynamic = "force-dynamic";

export default async function GuideProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guide = await prisma.guideProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, image: true, createdAt: true } },
      languages: true,
      locations: { include: { destination: true } },
      tourTypes: { include: { tourType: true } },
      availability: true,
      blockedDates: true,
      reviews: {
        where: { isRemoved: false },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { tourist: { include: { user: { select: { name: true } } } } },
      },
    },
  });
  if (!guide || guide.status !== "APPROVED" || guide.deletedAt) notFound();

  const destinations = guide.locations.map((l) => l.destination);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: profile */}
        <div className="lg:col-span-2">
          <div className="card flex items-start gap-5 p-6">
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-100 text-3xl font-bold text-brand-700">
              {guide.user.image ? <img src={guide.user.image} alt="" className="h-full w-full object-cover" /> : guide.user.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{guide.user.name}</h1>
                {guide.isStudentVerified && <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">✓ Student verified</span>}
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">✓ ID verified</span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">Local Guide · {destinations.map((d) => d.name).join(", ")} · Member since {new Date(guide.user.createdAt).getFullYear()}</p>
              <StarRating value={guide.averageRating} count={guide.reviewCount} className="mt-2" />
              <p className="mt-3 text-zinc-700">{guide.bio}</p>
              {guide.college && <p className="mt-2 text-sm text-zinc-500">🎓 {guide.college}</p>}
            </div>
          </div>

          <div className="card mt-4 p-6">
            <h2 className="font-semibold">Details</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div><dt className="text-zinc-500">Languages</dt><dd>{guide.languages.map((l) => l.language).join(", ")}</dd></div>
              <div><dt className="text-zinc-500">Areas covered</dt><dd>{destinations.map((d) => d.name).join(", ")}</dd></div>
              <div><dt className="text-zinc-500">Tour types</dt><dd>{guide.tourTypes.map((t) => t.tourType.name.replaceAll("_", " ").toLowerCase()).join(", ")}</dd></div>
              <div><dt className="text-zinc-500">Experience</dt><dd>{guide.experienceYears} year{guide.experienceYears === 1 ? "" : "s"}</dd></div>
              <div><dt className="text-zinc-500">Availability</dt><dd>{guide.availability.length ? "Open " + [...new Set(guide.availability.map((a) => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][a.dayOfWeek]))].join(", ") : "Contact to arrange"}</dd></div>
              <div><dt className="text-zinc-500">Max bookings/day</dt><dd>{guide.maxBookingsPerDay}</dd></div>
            </dl>
          </div>

          <div className="card mt-4 p-6">
            <h2 className="font-semibold">Reviews ({guide.reviewCount})</h2>
            {guide.reviews.length === 0 && <p className="mt-3 text-sm text-zinc-500">No reviews yet.</p>}
            <div className="mt-3 space-y-4">
              {guide.reviews.map((r) => (
                <div key={r.id} className="border-b border-zinc-100 pb-4 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{r.tourist.user.name}</p>
                    <StarRating value={r.rating} />
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-zinc-600">{r.comment}</p>}
                  {r.response && <p className="mt-2 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600"><span className="font-medium text-zinc-800">Guide response:</span> {r.response}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: booking card */}
        <div>
          <div className="card sticky top-20 p-5">
            <p className="text-xl font-bold">{formatINR(guide.basePrice)} <span className="text-sm font-normal text-zinc-500">/ {guide.priceUnit.replaceAll("_", " ").toLowerCase()}</span></p>
            <BookingForm guideId={guide.id} destinations={destinations.map((d) => ({ id: d.id, name: d.name }))} tourTypes={guide.tourTypes.map((t) => ({ id: t.tourTypeId, name: t.tourType.name }))} />
            <p className="mt-3 text-center text-xs text-zinc-500">Free cancellation up to 48h before the tour.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
