"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCancelBooking } from "@/app/actions/admin";

export function AdminBookingActions({ bookingId, status }: { bookingId: string; status: string }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  if (!["REQUESTED", "PENDING_PAYMENT", "CONFIRMED", "GUIDE_ACCEPTED"].includes(status)) return null;
  return (
    <div>
      {!show ? (
        <button onClick={() => setShow(true)} className="text-xs text-red-600 hover:underline">Cancel</button>
      ) : (
        <form onSubmit={async (e) => {
          e.preventDefault();
          const reason = String(new FormData(e.currentTarget).get("reason"));
          await adminCancelBooking(bookingId, reason);
          router.refresh();
        }} className="flex items-center gap-2">
          <input name="reason" required placeholder="Reason" className="input !w-40 text-xs" />
          <button className="btn-outline !px-2 !py-1 text-xs !border-red-300 !text-red-700">Confirm</button>
        </form>
      )}
    </div>
  );
}
