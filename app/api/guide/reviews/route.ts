import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await requireRole("GUIDE", "ADMIN");
  const guide = await prisma.guideProfile.findUnique({
    where: { userId: user.id },
    include: {
      reviews: { orderBy: { createdAt: "desc" }, include: { tourist: { include: { user: { select: { name: true } } } } } },
    },
  });
  if (!guide) return NextResponse.json({ reviews: [] });
  return NextResponse.json({
    reviews: guide.reviews.map((r) => ({
      id: r.id, rating: r.rating, comment: r.comment, response: r.response,
      createdAt: r.createdAt.toISOString(), tourist: r.tourist,
    })),
  });
}
