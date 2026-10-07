import { requireRole, requireOwnGuide } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { AvailabilityForm } from "./availability-form";
import { BlockedDates } from "./blocked-dates";

export const dynamic = "force-dynamic";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function GuideAvailabilityPage() {
  await requireRole("GUIDE", "ADMIN");
  const guide = await requireOwnGuide();
  const [availability, blockedDates] = await Promise.all([
    prisma.guideAvailability.findMany({ where: { guideId: guide.id } }),
    prisma.guideBlockedDate.findMany({ where: { guideId: guide.id }, orderBy: { date: "asc" } }),
  ]);

  const slotsByDay = DAYS.map((_, i) => ({
    dayOfWeek: i,
    day: DAYS[i],
    slots: availability.filter((a) => a.dayOfWeek === i),
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Availability</h1>

      <div className="card p-5">
        <h2 className="mb-3 font-semibold">Weekly hours</h2>
        <div className="space-y-2 text-sm">
          {slotsByDay.map((d) => (
            <div key={d.dayOfWeek} className="flex items-center justify-between border-b border-zinc-100 pb-2 last:border-0">
              <span className="font-medium">{d.day}</span>
              <span className="text-zinc-500">
                {d.slots.length ? d.slots.map((s) => `${s.startTime}–${s.endTime}`).join(", ") : "Unavailable"}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4"><AvailabilityForm guideId={guide.id} currentMax={guide.maxBookingsPerDay} /></div>
      </div>

      <div className="card mt-6 p-5">
        <h2 className="mb-3 font-semibold">Blocked dates</h2>
        <BlockedDates blockedDates={blockedDates.map((b) => ({ id: b.id, date: b.date.toISOString().slice(0, 10), reason: b.reason }))} />
      </div>
    </div>
  );
}
