"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestBooking } from "@/app/actions/bookings";
import { CheckoutButton } from "./checkout-button";

export function BookingForm({
  guideId, destinations, tourTypes,
}: {
  guideId: string;
  destinations: Array<{ id: string; name: string }>;
  tourTypes: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await requestBooking({
      guideId,
      destinationId: String(fd.get("destinationId")),
      tourTypeId: String(fd.get("tourTypeId")) || undefined,
      date: new Date(String(fd.get("date"))),
      startTime: String(fd.get("startTime")),
      durationHours: Number(fd.get("durationHours")),
      partySize: Number(fd.get("partySize")),
      meetingLocation: String(fd.get("meetingLocation")),
      notes: String(fd.get("notes") ?? "") || undefined,
    });
    setPending(false);
    if (!result.ok) { setError(result.error); return; }
    if (result.bookingId) setBookingId(result.bookingId);
  }

  if (bookingId) {
    return (
      <div className="mt-4">
        <p className="mb-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">Booking request created — complete payment to confirm.</p>
        <CheckoutButton bookingId={bookingId} />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div>
        <label className="label">Destination</label>
        <select name="destinationId" required className="input" defaultValue={destinations[0]?.id}>
          {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      {tourTypes.length > 0 && (
        <div>
          <label className="label">Tour type (optional)</label>
          <select name="tourTypeId" className="input">
            <option value="">Any</option>
            {tourTypes.map((t) => <option key={t.id} value={t.id}>{t.name.replaceAll("_", " ").toLowerCase()}</option>)}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date</label>
          <input name="date" type="date" required className="input"
            min={new Date().toISOString().slice(0, 10)} />
        </div>
        <div>
          <label className="label">Start time</label>
          <input name="startTime" type="time" defaultValue="10:00" required className="input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Duration</label>
          <select name="durationHours" className="input" defaultValue="2">
            {[1, 2, 3, 4, 6, 8].map((h) => <option key={h} value={h}>{h} hour{h > 1 ? "s" : ""}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Group size</label>
          <input name="partySize" type="number" min={1} max={20} defaultValue={1} required className="input" />
        </div>
      </div>
      <div>
        <label className="label">Meeting location</label>
        <input name="meetingLocation" required placeholder="e.g. Main gate of Hawa Mahal" className="input" />
      </div>
      <div>
        <label className="label">Notes for your guide (optional)</label>
        <textarea name="notes" rows={2} className="input" placeholder="Interests, mobility needs…" />
      </div>
      {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <button disabled={pending} className="btn-primary w-full">{pending ? "Requesting…" : "Request booking"}</button>
      <button type="button" onClick={() => router.push("/auth/signin")} className="w-full text-center text-xs text-zinc-500 hover:underline">
        You must be signed in to book
      </button>
    </form>
  );
}
