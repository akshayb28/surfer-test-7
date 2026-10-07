import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // JWT required for credentials provider
  pages: { signIn: "/auth/signin" },
  providers: [
    Google({ allowDangerousEmailAccountLinking: false }),
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const { email, password } = credentials as { email: string; password: string };
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user?.passwordHash || user.isSuspended || user.deletedAt) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = (user as { role?: Role }).role ?? "TOURIST"; }
      return token;
    },
    session({ session, token }) {
      if (token) { session.user.id = token.id as string; session.user.role = token.role as Role; }
      return session;
    },
  },
});
