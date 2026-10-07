"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchDestinations } from "@/app/actions/search";

type SearchResult = Awaited<ReturnType<typeof searchDestinations>>;

export function SearchBox({ large = false }: { large?: boolean }) {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q.trim()) { setResult(null); return; }
    const t = setTimeout(() => {
      startTransition(async () => setResult(await searchDestinations(q)));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const go = (slug: string) => { setOpen(false); router.push(`/search/${slug}`); };

  const hasResults = result && (result.destinations.length > 0 || result.attractions.length > 0);

  return (
    <div ref={boxRef} className="relative w-full">
      <div className={large ? "flex overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg" : "flex overflow-hidden rounded-lg border border-zinc-300 bg-white"}>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Where are you going? Search Jaipur, Goa, Mumbai, Varanasi, Hawa Mahal…"
          className={large ? "flex-1 px-5 py-4 text-base outline-none" : "flex-1 px-3 py-2 text-sm outline-none"}
        />
        <button onClick={() => hasResults && go(result.destinations[0]?.slug ?? "")} className="bg-brand-600 px-5 font-medium text-white hover:bg-brand-700">
          {pending ? "…" : "Search"}
        </button>
      </div>

      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
          {result?.destinations.map((d) => (
            <button key={d.id} onClick={() => go(d.slug)} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-50">
              <span className="font-medium">{d.name}</span>
              <span className="text-xs text-zinc-500">{[d.city, d.state].filter(Boolean).join(", ")}</span>
            </button>
          ))}
          {result?.attractions.map((a) => (
            <button key={a.id} onClick={() => router.push(`/search/${a.destinationId}?attraction=${a.name}`)} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-50">
              <span className="font-medium">{a.name}</span>
              <span className="text-xs text-brand-600">in {a.destination}</span>
            </button>
          ))}
          {result && !hasResults && <p className="px-4 py-3 text-sm text-zinc-500">No destinations found for “{q}” — try a city like Jaipur or Mumbai.</p>}
        </div>
      )}
    </div>
  );
}
