"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitGuideApplication } from "@/app/actions/guide";

export function GuideApplicationForm({ cities, destinations, tourTypes, languages }: {
  cities: Array<{ id: string; name: string }>;
  destinations: Array<{ id: string; name: string }>;
  tourTypes: Array<{ id: string; name: string }>;
  languages: string[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await submitGuideApplication({
      bio: String(fd.get("bio")),
      college: String(fd.get("college") ?? ""),
      currentCityId: String(fd.get("currentCityId")),
      languages: fd.getAll("languages").map(String),
      destinationIds: fd.getAll("destinationIds").map(String),
      tourTypeIds: fd.getAll("tourTypeIds").map(String),
      basePrice: Number(fd.get("basePrice")),
      emergencyContactName: String(fd.get("emergencyContactName")),
      emergencyContactPhone: String(fd.get("emergencyContactPhone")),
      payoutUpiId: String(fd.get("payoutUpiId") ?? ""),
      idType: String(fd.get("idType")),
      idLastFour: String(fd.get("idLastFour")),
      agreeTerms: fd.get("agreeTerms") === "on",
      agreeCodeOfConduct: fd.get("agreeCodeOfConduct") === "on",
    });
    setPending(false);
    if (!result.ok) { setError(result.error); return; }
    router.push("/guide");
    router.refresh();
  }

  const sel = (name: string, opts: Array<{ id: string; name: string }>, multi = false) => (
    <select name={name} multiple={multi} className={`input ${multi ? "h-32" : ""}`}>
      {opts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Short bio *</label>
        <textarea name="bio" required rows={3} placeholder="Who are you? What will tourists experience with you?" className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">College / university</label>
          <input name="college" className="input" />
        </div>
        <div>
          <label className="label">Current city *</label>
          {sel("currentCityId", cities)}
        </div>
      </div>
      <div>
        <label className="label">Languages you speak * (Ctrl/Cmd-click for multiple)</label>
        <select name="languages" multiple required className="input h-28">
          {languages.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Areas you cover * (multiple)</label>
        {sel("destinationIds", destinations, true)}
      </div>
      <div>
        <label className="label">Tour types * (multiple)</label>
        {sel("tourTypeIds", tourTypes, true)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Your price (₹ per 2-hour slot) *</label>
          <input name="basePrice" type="number" min={100} defaultValue={800} required className="input" />
        </div>
        <div>
          <label className="label">UPI ID for payouts</label>
          <input name="payoutUpiId" placeholder="name@upi" className="input" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Emergency contact name *</label>
          <input name="emergencyContactName" required className="input" />
        </div>
        <div>
          <label className="label">Emergency contact phone *</label>
          <input name="emergencyContactPhone" required className="input" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">ID type *</label>
          <select name="idType" className="input">
            <option value="STUDENT_ID">Student ID</option>
            <option value="AADHAAR">Aadhaar</option>
            <option value="PAN">PAN</option>
            <option value="PASSPORT">Passport</option>
          </select>
        </div>
        <div>
          <label className="label">Last 4 digits of ID *</label>
          <input name="idLastFour" required pattern="\d{4}" maxLength={4} className="input" placeholder="e.g. 4521" />
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <label className="flex gap-2"><input name="agreeTerms" type="checkbox" required className="mt-1" /> I agree to the Terms & Conditions, Safety Policies, Cancellation Policy and the 15% platform commission.</label>
        <label className="flex gap-2"><input name="agreeCodeOfConduct" type="checkbox" required className="mt-1" /> I agree to the Guide Code of Conduct and tourist-interaction safety guidelines.</label>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={pending} className="btn-primary w-full">{pending ? "Submitting…" : "Submit application"}</button>
    </form>
  );
}
