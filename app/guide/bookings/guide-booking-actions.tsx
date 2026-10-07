"use client";

import { useState } from "react";
import { acceptBookingAction, rejectBookingAction, startTourAction, completeTourAction } from "@/app/actions/bookings";

export function GuideBookingActions({ bookingId, status }: { bookingId: string; status: string }) {
  const [error, setError] = useState<string | null>(null);

  const act = async (fn: (id: string) => Promise<{ ok: boolean; error?: string }>) => {
    const r = await fn(bookingId);
    setError(r.ok ? null : (r.error ?? "Failed"));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {error && <p className="w-full rounded bg-red-50 p-2 text-red-700">{error}</p>}
      {(status === "REQUESTED" || status === "CONFIRMED") && (
        <>
          <button onClick={() => act(acceptBookingAction)} className="btn-primary !px-3 !py-1.5">Accept</button>
          <button onClick={() => act(rejectBookingAction)} className="btn-outline !px-3 !py-1.5">Decline</button>
        </>
      )}
      {status === "GUIDE_ACCEPTED" && <button onClick={() => act(startTourAction)} className="btn-outline !px-3 !py-1.5">Start tour</button>}
      {status === "IN_PROGRESS" && <button onClick={() => act(completeTourAction)} className="btn-primary !px-3 !py-1.5">Mark completed</button>}
    </div>
  );
}
