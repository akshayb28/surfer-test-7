import Link from "next/link";

export default function BecomeAGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">Earn money showing travellers your city</h1>
      <p className="mt-3 text-zinc-600">
        Surfer Test connects you with tourists visiting your city. You set your price, your schedule, and the areas you cover. We handle payments, bookings, and trust &amp; safety.
      </p>
      <ul className="mt-6 space-y-3 text-sm">
        {["Flexible hours around your classes", "Get paid directly to your UPI/bank after each tour", "Free KYC verification builds trust with tourists", "You keep 85% of every booking (platform commission is 15%)", "Built-in messaging and booking management"].map((f) => (
          <li key={f} className="flex gap-2"><span className="text-brand-600">✓</span>{f}</li>
        ))}
      </ul>
      <h2 className="mt-10 font-semibold">Before you apply, have ready:</h2>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-600">
        <li>A government or student ID (last 4 digits only — we never store full ID numbers)</li>
        <li>Your college name and a short bio</li>
        <li>Your UPI ID for payouts</li>
        <li>Emergency contact details</li>
      </ul>
      <div className="mt-8 flex gap-3">
        <Link href="/auth/signup?type=GUIDE" className="btn-primary">Apply as a guide</Link>
        <Link href="/auth/signin" className="btn-outline">I already have an account</Link>
      </div>
    </div>
  );
}
