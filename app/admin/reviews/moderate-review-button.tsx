"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { moderateReview } from "@/app/actions/admin";

export function ModerateReviewButton({ reviewId, action, label, danger }: { reviewId: string; action: "REMOVE" | "RESTORE" | "FLAG"; label: string; danger?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button disabled={busy} onClick={async () => {
      setBusy(true);
      await moderateReview(reviewId, action);
      router.refresh(); setBusy(false);
    }} className={`btn-outline !px-3 !py-1 text-xs ${danger ? "!border-red-300 !text-red-700" : ""}`}>
      {label}
    </button>
  );
}
