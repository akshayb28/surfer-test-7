"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setUserStatus } from "@/app/actions/admin";

export function UserActions({ userId, suspended }: { userId: string; suspended: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button disabled={busy} onClick={async () => {
      setBusy(true);
      await setUserStatus(userId, !suspended);
      router.refresh();
      setBusy(false);
    }} className={suspended ? "btn-primary !px-3 !py-1.5 text-xs" : "btn-outline !px-3 !py-1.5 text-xs !border-red-300 !text-red-700"}>
      {suspended ? "Reactivate" : "Suspend"}
    </button>
  );
}
