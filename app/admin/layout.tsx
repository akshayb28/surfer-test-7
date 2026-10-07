import Link from "next/link";

const NAV = [
  ["Dashboard", "/admin"],
  ["Users", "/admin/users"],
  ["Guides", "/admin/guides"],
  ["KYC queue", "/admin/kyc"],
  ["Bookings", "/admin/bookings"],
  ["Disputes", "/admin/disputes"],
  ["Payouts", "/admin/payouts"],
  ["Reviews", "/admin/reviews"],
  ["Reports", "/admin/reports"],
  ["Locations", "/admin/locations"],
  ["Settings", "/admin/settings"],
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
      <aside className="lg:w-48 lg:shrink-0">
        <nav className="flex gap-1 overflow-x-auto lg:sticky lg:top-20 lg:flex-col">
          {NAV.map(([label, href]) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900">
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
