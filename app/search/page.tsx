import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SearchBox } from "@/components/search-box";

export const dynamic = "force-dynamic";
export const metadata = { title: "Explore destinations" };

export default async function ExplorePage() {
  const destinations = await prisma.destination.findMany({
    orderBy: [{ isPopular: "desc" }, { name: "asc" }],
    include: { state: true, city: true, _count: { select: { guideLocations: true, attractions: true } } },
  });

  const popular = destinations.filter((d) => d.isPopular);
  const rest = destinations.filter((d) => !d.isPopular);

  const card = (d: (typeof destinations)[number]) => (
    <Link
      key={d.id}
      href={`/search/${d.slug}`}
      className="group relative block overflow-hidden rounded-2xl shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={d.imageUrl ?? `/destinations/${d.slug}.jpg`}
          alt={d.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-bold text-white">{d.name}</p>
            <p className="mt-0.5 text-xs text-zinc-300">{[d.city?.name, d.state?.name].filter(Boolean).join(", ")}</p>
          </div>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs text-white backdrop-blur">
            {d._count.guideLocations} guide{d._count.guideLocations === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </Link>
  );

  return (
    <div>
      {/* Page header */}
      <section className="bg-gradient-to-b from-brand-800 to-brand-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-4xl font-extrabold tracking-tight">Explore India</h1>
          <p className="mt-2 max-w-xl text-brand-100">
            Every destination has verified local student guides ready to show you around. Pick a place — or search one.
          </p>
          <div className="mt-6 max-w-xl">
            <SearchBox />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        {popular.length > 0 && (
          <>
            <h2 className="mb-5 text-2xl font-bold tracking-tight">Popular destinations</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {popular.map(card)}
            </div>
          </>
        )}

        {rest.length > 0 && (
          <>
            <h2 className="mb-5 mt-12 text-2xl font-bold tracking-tight">All destinations</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {rest.map(card)}
            </div>
          </>
        )}

        <div className="card mt-14 flex flex-col items-start gap-4 bg-gradient-to-r from-brand-50 to-amber-50 p-6 sm:flex-row sm:items-center">
          <span className="text-3xl">🧭</span>
          <div>
            <h3 className="font-bold">Don't see your destination?</h3>
            <p className="text-sm text-zinc-600">
              We're adding new cities every week. Guides can apply from anywhere in India.
            </p>
          </div>
          <Link href="/become-a-guide" className="btn-primary sm:ml-auto">Become a guide</Link>
        </div>
      </div>
    </div>
  );
}
