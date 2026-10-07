"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveReport } from "@/app/actions/admin";

export function ResolveReportButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button disabled={busy} onClick={async () => {
      const resolution = prompt("Resolution note:");
      if (!resolution) return;
      setBusy(true);
      await resolveReport(reportId, resolution);
      router.refresh(); setBusy(false);
    }} className="btn-outline !px-3 !py-1 text-xs">
      Resolve
    </button>
  );
}
