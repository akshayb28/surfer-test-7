import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listGuidesForDestination } from "@/app/actions/search";
import { GuideCard } from "@/components/guide-card";
import { SearchBox } from "@/components/search-box";
import { LANGUAGES } from "@/lib/constants";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SearchResultsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: SearchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q : undefined;

  const destination = await prisma.destination.findFirst({
    where: query ? { id: slug } : { slug },
    include: { state: true, city: true, attractions: { take: 12 } },
  });
  if (!destination) notFound();

  const filters = {
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    minRating: sp.minRating ? Number(sp.minRating) : undefined,
    language: typeof sp.language === "string" ? sp.language : undefined,
    tourTypeId: typeof sp.tourTypeId === "string" ? sp.tourTypeId : undefined,
    gender: (sp.gender as "MALE" | "FEMALE" | "OTHER") || undefined,
  };
  const [guides, tourTypes] = await Promise.all([
    listGuidesForDestination(destination.id, filters),
    prisma.tourType.findMany(),
  ]);

  const heroImage = destination.imageUrl ?? `/destinations/${destination.slug}.jpg`;

  return (
    <div>
      {/* Destination hero banner */}
      <section className="relative">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt={destination.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/40 to-zinc-950/30" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-20 sm:pt-28">
          <div className="max-w-xl text-white">
            <p className="text-sm font-medium uppercase tracking-widest text-brand-300">
              {[destination.city?.name, destination.state?.name].filter(Boolean).join(", ")}
            </p>
            <h1 className="mt-1 text-4xl font-extrabold drop-shadow sm:text-5xl">Local guides in {destination.name}</h1>
            {destination.description && <p className="mt-3 max-w-lg text-zinc-200 drop-shadow">{destination.description}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{guides.length} guide{guides.length === 1 ? "" : "s"} available</span>
              {destination.attractions.length > 0 && (
                <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{destination.attractions.length} top attractions</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Attractions strip */}
      {destination.attractions.length > 0 && (
        <div className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 text-xs [scrollbar-width:none]">
            {destination.attractions.map((a) => (
              <span key={a.id} className="whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-600">📍 {a.name}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 max-w-xl"><SearchBox /></div>

        {/* Filters */}
        <form method="GET" className="card grid gap-3 p-4 text-sm sm:grid-cols-5">
          <select name="maxPrice" defaultValue={sp.maxPrice ? String(sp.maxPrice) : ""} className="input">
            <option value="">Any price</option>
            {[500, 1000, 1500, 2000].map((p) => <option key={p} value={p}>Under ₹{p}</option>)}
          </select>
          <select name="minRating" defaultValue={sp.minRating ? String(sp.minRating) : ""} className="input">
            <option value="">Any rating</option>
            {[4.5, 4.0, 3.5].map((r) => <option key={r} value={r}>{r}★ & up</option>)}
          </select>
          <select name="language" defaultValue={typeof sp.language === "string" ? sp.language : ""} className="input">
            <option value="">Any language</option>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select name="tourTypeId" defaultValue={typeof sp.tourTypeId === "string" ? sp.tourTypeId : ""} className="input">
            <option value="">Any tour type</option>
            {tourTypes.map((t) => <option key={t.id} value={t.id}>{t.name.replaceAll("_", " ").toLowerCase()}</option>)}
          </select>
          <div className="flex gap-2">
            <button className="btn-primary flex-1">Filter</button>
            <Link href={`/search/${slug}`} className="btn-outline">Reset</Link>
          </div>
        </form>

        {/* Results */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {guides.map((g) => <GuideCard key={g.id} guide={g} />)}
        </div>
        {guides.length === 0 && (
          <div className="card mt-6 p-14 text-center text-zinc-500">
            <p className="text-4xl">🧭</p>
            <p className="mt-3 font-medium text-zinc-700">No guides match those filters yet.</p>
            <p className="mt-1 text-sm">Try widening the price range or removing a filter.</p>
            <Link href={`/search/${slug}`} className="btn-outline mt-4 inline-block">Clear filters</Link>
          </div>
        )}
      </div>
    </div>
  );
}
