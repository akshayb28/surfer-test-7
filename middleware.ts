import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PROTECTED: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/tourist", roles: ["TOURIST", "ADMIN"] },
  { prefix: "/guide", roles: ["GUIDE", "ADMIN"] },
  { prefix: "/admin", roles: ["ADMIN"] },
];

export default auth((req) => {
  const { nextUrl, auth } = req;
  const role = auth?.user?.role;
  for (const { prefix, roles } of PROTECTED) {
    if (nextUrl.pathname.startsWith(prefix) && (!role || !roles.includes(role))) {
      const url = new URL("/auth/signin", nextUrl.origin);
      url.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
});

export const config = { matcher: ["/tourist/:path*", "/guide/:path*", "/admin/:path*"] };
