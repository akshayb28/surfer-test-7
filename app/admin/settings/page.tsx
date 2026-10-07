import { prisma } from "@/lib/prisma";
import { updatePlatformSettings } from "@/app/actions/admin";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function saveSettings(fd: FormData) {
  "use server";
  await updatePlatformSettings({ commissionPercent: Number(fd.get("commissionPercent")) });
  revalidatePath("/admin/settings");
}

export default async function AdminSettingsPage() {
  const settings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
  return (
    <div className="max-w-md">
      <h1 className="mb-4 text-2xl font-bold">Platform settings</h1>
      <form action={saveSettings} className="card space-y-4 p-6 text-sm">
        <div>
          <label className="label">Platform commission (% of each booking)</label>
          <input name="commissionPercent" type="number" min={0} max={50} step={0.5} defaultValue={settings?.commissionPercent ?? 15} className="input" />
          <p className="mt-1 text-xs text-zinc-400">Guides keep the remainder. Applies to new bookings only — existing bookings keep their snapshot.</p>
        </div>
        <div>
          <label className="label">Cancellation policy</label>
          <p className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600">
            ≥48h before start: 100% refund · ≥24h: 50% · less: no refund. Editable in <code>lib/constants.ts</code>.
          </p>
        </div>
        <button className="btn-primary w-full">Save settings</button>
      </form>
    </div>
  );
}
