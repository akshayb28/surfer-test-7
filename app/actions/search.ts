"use server";

import { prisma } from "@/lib/prisma";

export type GuideSearchFilters = {
  destinationId?: string;
  maxPrice?: number;       // INR
  minRating?: number;
  language?: string;
  tourTypeId?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
};

/**
 * DB-driven discovery: resolve a free-text query to a destination (exact or
 * contains) or an attraction, then list APPROVED guides covering it.
 * Scales to thousands of destinations via the GuideLocation index.
 */
export async function searchDestinations(query: string) {
  const q = query.trim();
  if (!q) return { destinations: [], attractions: [] };
  const [destinations, attractions] = await Promise.all([
    prisma.destination.findMany({
      where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q.toLowerCase() } }] },
      take: 8, include: { state: true, city: true },
    }),
    prisma.attraction.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 5, include: { destination: true },
    }),
  ]);
  return {
    destinations: destinations.map((d) => ({ id: d.id, name: d.name, slug: d.slug, state: d.state?.name, city: d.city?.name })),
    attractions: attractions.map((a) => ({ id: a.id, name: a.name, destinationId: a.destinationId, destination: a.destination.name })),
  };
}

export async function listGuidesForDestination(destinationId: string, filters: GuideSearchFilters = {}) {
  const guides = await prisma.guideProfile.findMany({
    where: {
      status: "APPROVED",
      deletedAt: null,
      locations: { some: { destinationId } },
      ...(filters.maxPrice ? { basePrice: { lte: filters.maxPrice } } : {}),
      ...(filters.minRating ? { averageRating: { gte: filters.minRating } } : {}),
      ...(filters.gender ? { gender: filters.gender } : {}),
      ...(filters.language ? { languages: { some: { language: filters.language } } } : {}),
      ...(filters.tourTypeId ? { tourTypes: { some: { tourTypeId: filters.tourTypeId } } } : {}),
    },
    include: {
      user: { select: { name: true, image: true } },
      languages: true,
      locations: { include: { destination: { select: { name: true } } } },
    },
    orderBy: [{ averageRating: "desc" }, { reviewCount: "desc" }],
    take: 50,
  });
  return guides.map((g) => ({
    id: g.id, name: g.user.name, photoUrl: g.photoUrl, bio: g.bio,
    city: g.locations[0]?.destination.name ?? "",
    rating: g.averageRating, reviewCount: g.reviewCount,
    languages: g.languages.map((l) => l.language),
    basePrice: g.basePrice, priceUnit: g.priceUnit, experienceYears: g.experienceYears,
    isStudentVerified: g.isStudentVerified,
  }));
}
