const COLORS: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700",
  PENDING_PAYMENT: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  GUIDE_ACCEPTED: "bg-blue-50 text-blue-700",
  IN_PROGRESS: "bg-violet-50 text-violet-700",
  COMPLETED: "bg-brand-50 text-brand-700",
  CANCELLED: "bg-zinc-100 text-zinc-600",
  DISPUTED: "bg-red-50 text-red-700",
  REFUNDED: "bg-zinc-100 text-zinc-600",
};

export function BookingStatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${COLORS[status] ?? "bg-zinc-100 text-zinc-600"}`}>{status.replaceAll("_", " ").toLowerCase()}</span>;
}
