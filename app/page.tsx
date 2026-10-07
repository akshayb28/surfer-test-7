import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SearchBox } from "@/components/search-box";
import { GuideCard } from "@/components/guide-card";
import { StarRating } from "@/components/star-rating";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [popularDestinations, topGuides, stats] = await Promise.all([
    prisma.destination.findMany({ where: { isPopular: true }, take: 8, orderBy: { name: "asc" } }),
    prisma.guideProfile.findMany({
      where: { status: "APPROVED", deletedAt: null },
      include: { user: { select: { name: true } }, languages: true, locations: { include: { destination: { select: { name: true } } } } },
      orderBy: [{ averageRating: "desc" }, { reviewCount: "desc" }],
      take: 4,
    }),
    Promise.all([
      prisma.guideProfile.count({ where: { status: "APPROVED", deletedAt: null } }),
      prisma.destination.count(),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
    ]),
  ]);
  const [guideCount, destCount, completedCount] = stats;

  return (
    <div>
      {/* Hero with photo background */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero-jaipur.jpg" alt="Jaipur" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/60 to-zinc-950/80" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-28 text-center text-white sm:py-36">
          <p className="mb-3 inline-block rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-medium tracking-wide backdrop-blur">
            Verified local student guides · 8+ cities across India
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-lg sm:text-6xl">
            Explore India with a Local
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-200">
            Skip the tour buses. A student who actually lives there will show you the streets, the food, and the stories behind every place.
          </p>
          <div className="mx-auto mt-8 max-w-2xl">
            <SearchBox large />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-300">
            <span className="text-zinc-400">Popular:</span>
            {["Jaipur", "Goa", "Mumbai", "Varanasi", "Manali"].map((n) => (
              <Link key={n} href={`/search/${n.toLowerCase()}`} className="rounded-full border border-white/25 bg-white/10 px-3 py-1 backdrop-blur transition hover:bg-white/25">
                {n}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular destinations with photos */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Where to next?</h2>
          <p className="mt-1 text-zinc-500">Hand-picked destinations with verified local guides.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {popularDestinations.map((d) => (
            <Link key={d.id} href={`/search/${d.slug}`} className="group relative block overflow-hidden rounded-2xl shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="aspect-[4/5] w-full overflow-hidden bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.imageUrl ?? `/destinations/${d.slug}.jpg`}
                  alt={d.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-lg font-bold text-white">{d.name}</p>
                {d.description && <p className="mt-0.5 line-clamp-1 text-xs text-zinc-300">{d.description}</p>}
              </div>
              <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Top guides */}
      <section className="bg-gradient-to-b from-white to-zinc-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Guides travellers love</h2>
            <p className="mt-1 text-zinc-500">Top-rated, KYC-verified locals.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {topGuides.map((g) => (
              <GuideCard key={g.id} guide={{
                id: g.id, name: g.user.name, photoUrl: g.photoUrl, bio: g.bio,
                city: g.locations[0]?.destination.name ?? "", rating: g.averageRating,
                reviewCount: g.reviewCount, languages: g.languages.map((l) => l.language),
                basePrice: g.basePrice, priceUnit: g.priceUnit, isStudentVerified: g.isStudentVerified,
              }} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight">How it works</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            ["1", "Search your destination", "Find KYC-verified local guides who actually live where you're going — filter by price, rating, language and tour type."],
            ["2", "Book & pay securely", "Pick a date and time, pay through Razorpay's secure checkout, and chat with your guide before the tour."],
            ["3", "Tour & review", "Meet your guide, explore like a local, then rate the experience so the community stays trustworthy."],
          ].map(([n, t, d]) => (
            <div key={n} className="card relative overflow-hidden p-7">
              <span className="absolute -right-2 -top-4 text-8xl font-black text-brand-50">{n}</span>
              <div className="relative">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-lg font-bold text-white shadow-md shadow-brand-600/30">{n}</div>
                <h3 className="text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{d}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/become-a-guide" className="btn-primary !px-6 !py-3 text-base shadow-lg shadow-brand-600/30">
            Become a guide — earn while you study
          </Link>
          <p className="mt-2 text-xs text-zinc-400">Keep 85% of every booking · flexible hours · free verification</p>
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-zinc-950 py-14 text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 text-center sm:grid-cols-4">
          <div><p className="text-4xl font-extrabold text-brand-400">{guideCount}+</p><p className="mt-1 text-sm text-zinc-400">verified local guides</p></div>
          <div><p className="text-4xl font-extrabold text-brand-400">{destCount}+</p><p className="mt-1 text-sm text-zinc-400">destinations in India</p></div>
          <div><p className="text-4xl font-extrabold text-brand-400">{completedCount}+</p><p className="mt-1 text-sm text-zinc-400">tours completed</p></div>
          <div><p className="text-4xl font-extrabold text-brand-400">4.8★</p><p className="mt-1 text-sm text-zinc-400">average rating</p></div>
        </div>
      </section>

      {/* Trust band */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="card flex flex-col items-start gap-6 bg-gradient-to-r from-brand-50 to-amber-50 p-8 sm:flex-row sm:items-center">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-600 text-2xl text-white">🛡️</div>
          <div>
            <h3 className="text-xl font-bold">Every guide is identity-verified</h3>
            <p className="mt-1 text-sm text-zinc-600">
              Government or student ID checks, signed safety agreements, and a public review system — so you always know who you're meeting.
            </p>
          </div>
          <StarRating value={4.8} className="sm:ml-auto" />
        </div>
      </section>
    </div>
  );
}
