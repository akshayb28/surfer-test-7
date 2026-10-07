import { cn } from "@/lib/utils";

export function StarRating({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <span className="text-amber-500">★</span>
      <span className="font-medium">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-zinc-500">({count} reviews)</span>}
    </span>
  );
}
