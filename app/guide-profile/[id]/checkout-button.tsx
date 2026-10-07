"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPaymentOrder } from "@/app/actions/payments";

declare global {
  interface Window { Razorpay: new (options: Record<string, unknown>) => { open(): void } }
}

export function CheckoutButton({ bookingId }: { bookingId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function pay() {
    setError(null);
    setPending(true);
    // Load Razorpay checkout.js once
    if (!window.Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Could not load payment gateway"));
        document.body.appendChild(s);
      }).catch((e) => { setError(String(e)); setPending(false); return; });
    }
    const order = await createPaymentOrder(bookingId);
    if (!order.ok || !order.orderId) { setError(order.error ?? "Payment failed"); setPending(false); return; }

    const rzp = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: "INR",
      name: "Surfer Test",
      description: "Local guide booking",
      theme: { color: "#046c40" },
      handler: () => { router.push("/tourist/bookings?paid=1"); router.refresh(); },
      modal: { ondismiss: () => setPending(false) },
    });
    rzp.open();
    setPending(false);
  }

  return (
    <div>
      <button onClick={pay} disabled={pending} className="btn-primary w-full">{pending ? "Opening payment…" : "Pay now (Razorpay)"}</button>
      {error && <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
