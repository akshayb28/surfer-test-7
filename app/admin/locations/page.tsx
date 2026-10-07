import { prisma } from "@/lib/prisma";
import { createState, createCity, createDestination, createAttraction } from "@/app/actions/admin";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function addState(fd: FormData) { "use server"; await createState({ name: String(fd.get("name")) }); revalidatePath("/admin/locations"); }
async function addCity(fd: FormData) { "use server"; await createCity({ name: String(fd.get("name")), stateId: String(fd.get("stateId")) }); revalidatePath("/admin/locations"); }
async function addDestination(fd: FormData) {
  "use server";
  await createDestination({
    name: String(fd.get("name")), slug: String(fd.get("slug")).toLowerCase(),
    cityId: String(fd.get("cityId")) || undefined, isPopular: fd.get("isPopular") === "on",
  });
  revalidatePath("/admin/locations");
}
async function addAttraction(fd: FormData) {
  "use server";
  await createAttraction({ name: String(fd.get("name")), destinationId: String(fd.get("destinationId")) });
  revalidatePath("/admin/locations");
}

const input = "rounded border border-zinc-300 px-2 py-1.5 text-sm";

export default async function AdminLocationsPage() {
  const [states, cities, destinations, attractionCount] = await Promise.all([
    prisma.state.findMany({ orderBy: { name: "asc" } }),
    prisma.city.findMany({ orderBy: { name: "asc" }, include: { state: true } }),
    prisma.destination.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { attractions: true, guideLocations: true } } } }),
    prisma.attraction.count(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Locations</h1>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">States ({states.length})</h2>
        <form action={addState} className="mb-3 flex gap-2">
          <input name="name" required placeholder="New state" className={input} />
          <button className="btn-primary !px-3 !py-1.5 text-xs">Add</button>
        </form>
        <div className="flex flex-wrap gap-2 text-xs">
          {states.map((s) => <span key={s.id} className="rounded-full bg-zinc-100 px-3 py-1">{s.name}</span>)}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">Cities ({cities.length})</h2>
        <form action={addCity} className="mb-3 flex flex-wrap gap-2">
          <input name="name" required placeholder="New city" className={input} />
          <select name="stateId" required className={input}>{states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <button className="btn-primary !px-3 !py-1.5 text-xs">Add</button>
        </form>
        <div className="flex flex-wrap gap-2 text-xs">
          {cities.map((c) => <span key={c.id} className="rounded-full bg-zinc-100 px-3 py-1">{c.name}, {c.state.name}</span>)}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">Destinations ({destinations.length}) · {attractionCount} attractions</h2>
        <form action={addDestination} className="mb-4 flex flex-wrap gap-2">
          <input name="name" required placeholder="Name (e.g. Kochi)" className={input} />
          <input name="slug" required placeholder="slug (e.g. kochi)" className={input} />
          <select name="cityId" className={input}><option value="">— city —</option>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <label className="flex items-center gap-1 text-xs text-zinc-600"><input name="isPopular" type="checkbox" />Popular</label>
          <button className="btn-primary !px-3 !py-1.5 text-xs">Add destination</button>
        </form>
        <form action={addAttraction} className="mb-4 flex flex-wrap gap-2">
          <input name="name" required placeholder="Attraction (e.g. Chinese Fishing Nets)" className={input} />
          <select name="destinationId" required className={input}>{destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <button className="btn-outline !px-3 !py-1.5 text-xs">Add attraction</button>
        </form>
        <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 text-sm">
          {destinations.map((d) => (
            <div key={d.id} className="flex justify-between p-3">
              <span>{d.name} <span className="text-zinc-400">/{d.slug}</span>{d.isPopular && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">popular</span>}</span>
              <span className="text-zinc-500">{d._count.guideLocations} guides · {d._count.attractions} attractions</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
