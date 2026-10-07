"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/validations";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function registerAccount(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { name, email, password, accountType } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { ok: false, error: "An account with this email already exists" };

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10), role: accountType },
  });
  if (accountType === "TOURIST") {
    await prisma.touristProfile.create({ data: { userId: user.id } });
  }
  // Guide profile is created on the /guide/apply onboarding form (with KYC).

  try {
    await signIn("credentials", { email, password, redirectTo: accountType === "GUIDE" ? "/guide/apply" : "/tourist" });
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: "Sign-in failed after registration" };
    throw err; // NEXT_REDIRECT
  }
  return { ok: true };
}
