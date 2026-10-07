"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setGuideStatus } from "@/app/actions/admin";

export function GuideStatusActions({ guideId, status }: { guideId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const suspend = status === "SUSPENDED";
  return (
    <div className="flex gap-2">
      {(status === "PENDING_VERIFICATION" || status === "KYC_UNDER_REVIEW") && (
        <span className="text-xs text-amber-700">Awaiting KYC review</span>
      )}
      <button disabled={busy} onClick={async () => {
        setBusy(true);
        await setGuideStatus(guideId, suspend ? "APPROVED" : "SUSPENDED");
        router.refresh(); setBusy(false);
      }} className="btn-outline !px-3 !py-1.5 text-xs">
        {suspend ? "Unsuspend" : "Suspend"}
      </button>
    </div>
  );
}
