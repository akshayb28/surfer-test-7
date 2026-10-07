import Link from "next/link";
import { StarRating } from "@/components/star-rating";
import { formatINR } from "@/lib/utils";

export type GuideCardData = {
  id: string; name: string; photoUrl: string | null; city: string;
  rating: number; reviewCount: number; languages: string[];
  basePrice: number; priceUnit: string; bio: string | null; isStudentVerified: boolean;
};

export function GuideCard({ guide }: { guide: GuideCardData }) {
  return (
    <div className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start gap-4 p-5">
        <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand-100 to-amber-100 text-xl font-bold text-brand-700 ring-2 ring-brand-100">
          {guide.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={guide.photoUrl} alt={guide.name} className="h-full w-full object-cover" />
          ) : guide.name.charAt(0)}
          {guide.isStudentVerified && (
            <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-[10px] text-white ring-2 ring-white" title="Student verified">✓</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{guide.name}</h3>
            {guide.isStudentVerified && (
              <span className="hidden rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700 sm:inline">✓ Student verified</span>
            )}
          </div>
          <p className="text-xs text-zinc-500">Local Guide · {guide.city}</p>
          <StarRating value={guide.rating} count={guide.reviewCount} className="mt-1" />
          <p className="mt-1 truncate text-xs text-zinc-600">{guide.languages.join(", ")}</p>
          {guide.bio && <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{guide.bio}</p>}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/60 px-5 py-3">
        <p className="text-sm font-semibold">{formatINR(guide.basePrice)} <span className="font-normal text-zinc-500">/ {guide.priceUnit.replaceAll("_", " ").toLowerCase()}</span></p>
        <Link href={`/guide-profile/${guide.id}`} className="btn-primary !px-4 !py-1.5 text-xs transition group-hover:bg-brand-700">View Profile</Link>
      </div>
    </div>
  );
}
