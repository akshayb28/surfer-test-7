"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAvailability } from "@/app/actions/guide";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AvailabilityForm({ guideId, currentMax }: { guideId: string; currentMax: number }) {
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [max, setMax] = useState(currentMax);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function save() {
    const r = await setAvailability({
      slots: days.map((d) => ({ dayOfWeek: d, startTime: start, endTime: end })),
      maxBookingsPerDay: max,
    });
    setMsg(r.ok ? "Availability saved." : r.error);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {DAYS.map((d, i) => (
          <button key={d} type="button" onClick={() => setDays((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])}
            className={`rounded-lg border px-3 py-1.5 text-xs ${days.includes(i) ? "border-brand-600 bg-brand-50 text-brand-700" : "border-zinc-300 text-zinc-500"}`}>
            {d}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 text-sm">
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="input !w-auto" />
        <span className="text-zinc-500">to</span>
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="input !w-auto" />
        <label className="ml-auto flex items-center gap-2 text-xs text-zinc-600">
          Max/day
          <input type="number" min={1} max={10} value={max} onChange={(e) => setMax(Number(e.target.value))} className="input !w-16" />
        </label>
      </div>
      {msg && <p className="text-xs text-brand-700">{msg}</p>}
      <button onClick={save} className="btn-primary !px-4 !py-2 text-xs">Save availability</button>
    </div>
  );
}
