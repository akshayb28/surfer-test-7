import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Surfer Test — Explore India with a Local", template: "%s · Surfer Test" },
  description: "Connect with verified local student guides across India.",
};

export const viewport: Viewport = { themeColor: "#046c40", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;
  const dashHref = role === "ADMIN" ? "/admin" : role === "GUIDE" ? "/guide" : role === "TOURIST" ? "/tourist" : null;

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-brand-700">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">S</span>
              Surfer Test
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/search" className="hidden text-zinc-600 hover:text-zinc-900 sm:block">Explore</Link>
              <Link href="/become-a-guide" className="hidden text-zinc-600 hover:text-zinc-900 sm:block">Become a guide</Link>
              {session ? (
                <>
                  <Link href={dashHref!} className="btn-outline !py-1.5 text-xs">Dashboard</Link>
                  <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                    <button className="text-xs text-zinc-500 hover:text-zinc-900">Sign out</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="text-zinc-600 hover:text-zinc-900">Sign in</Link>
                  <Link href="/auth/signup" className="btn-primary !py-1.5 text-xs">Sign up</Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-zinc-500 sm:grid-cols-3">
            <div>
              <p className="mb-2 font-semibold text-zinc-800">Surfer Test</p>
              <p>Explore India with a local. Verified student guides in every city.</p>
            </div>
            <div>
              <p className="mb-2 font-semibold text-zinc-800">Trust & safety</p>
              <p>KYC-verified guides · Report a user · 24×7 support</p>
            </div>
            <div>
              <p className="mb-2 font-semibold text-zinc-800">Guides</p>
              <p>Earn while you study. Apply in 10 minutes.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
