"use client";

import { useState } from "react";

export function SignedDocLink({ kycId, doc }: { kycId: string; doc: number }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  return (
    <button
      onClick={async () => {
        setState("loading");
        try {
          const r = await fetch(`/api/files/signed-url?kycId=${kycId}&doc=${doc}`);
          if (!r.ok) throw new Error();
          const { url } = await r.json();
          window.open(url, "_blank", "noreferrer");
          setState("idle");
        } catch {
          setState("error");
        }
      }}
      className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 disabled:opacity-50">
      {state === "loading" ? "Opening…" : state === "error" ? "Unavailable" : `View doc ${doc + 1}`}
    </button>
  );
}
