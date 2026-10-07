import "dotenv/config";
import { PrismaClient, Role, GuideStatus, KycStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  // ---------- Admin ----------
  await prisma.user.upsert({
    where: { email: "admin@surfer.test" },
    update: {},
    create: {
      email: "admin@surfer.test", name: "Platform Admin", passwordHash: password, role: Role.ADMIN,
    },
  });

  // ---------- Location graph ----------
  const states = ["Rajasthan", "Maharashtra", "Goa", "Uttar Pradesh", "Karnataka", "Delhi", "Himachal Pradesh", "Telangana"];
  const stateRows: Record<string, string> = {};
  for (const s of states) {
    const row = await prisma.state.upsert({ where: { name: s }, update: {}, create: { name: s } });
    stateRows[s] = row.id;
  }

  const cities: Array<[string, string]> = [
    ["Jaipur", "Rajasthan"], ["Udaipur", "Rajasthan"], ["Jodhpur", "Rajasthan"],
    ["Mumbai", "Maharashtra"], ["Pune", "Maharashtra"], ["Nagpur", "Maharashtra"],
    ["Panaji", "Goa"], ["Varanasi", "Uttar Pradesh"], ["Bengaluru", "Karnataka"],
    ["New Delhi", "Delhi"], ["Manali", "Himachal Pradesh"], ["Hyderabad", "Telangana"],
  ];
  const cityRows: Record<string, string> = {};
  for (const [name, state] of cities) {
    const row = await prisma.city.upsert({
      where: { name_stateId: { name, stateId: stateRows[state] } },
      update: {}, create: { name, stateId: stateRows[state] },
    });
    cityRows[name] = row.id;
  }

  const destinations: Array<{ name: string; slug: string; city: string; state: string; popular: boolean; desc: string }> = [
    { name: "Jaipur", slug: "jaipur", city: "Jaipur", state: "Rajasthan", popular: true, desc: "The Pink City — forts, palaces, bazaars." },
    { name: "Udaipur", slug: "udaipur", city: "Udaipur", state: "Rajasthan", popular: true, desc: "City of Lakes and royal heritage." },
    { name: "Goa", slug: "goa", city: "Panaji", state: "Goa", popular: true, desc: "Beaches, Portuguese history, nightlife." },
    { name: "Mumbai", slug: "mumbai", city: "Mumbai", state: "Maharashtra", popular: true, desc: "Bollywood, street food, colonial architecture." },
    { name: "Varanasi", slug: "varanasi", city: "Varanasi", state: "Uttar Pradesh", popular: true, desc: "India's oldest living city on the Ganges." },
    { name: "Manali", slug: "manali", city: "Manali", state: "Himachal Pradesh", popular: true, desc: "Himalayan valleys, adventure, old-town cafes." },
    { name: "Bengaluru", slug: "bengaluru", city: "Bengaluru", state: "Karnataka", popular: false, desc: "Garden city, craft beer, Nandi Hills." },
    { name: "Hyderabad", slug: "hyderabad", city: "Hyderabad", state: "Telangana", popular: false, desc: "Charminar, biryani, Golconda Fort." },
  ];
  const destRows: Record<string, string> = {};
  for (const d of destinations) {
    const row = await prisma.destination.upsert({
      where: { slug: d.slug },
      update: { imageUrl: `/destinations/${d.slug}.jpg` },
      create: { name: d.name, slug: d.slug, cityId: cityRows[d.city], stateId: stateRows[d.state], isPopular: d.popular, description: d.desc, imageUrl: `/destinations/${d.slug}.jpg` },
    });
    destRows[d.slug] = row.id;
  }

  const attractions: Array<[string, string, string]> = [
    ["Hawa Mahal", "jaipur", "Jaipur"], ["Amber Fort", "jaipur", "Jaipur"], ["City Palace", "jaipur", "Jaipur"],
    ["Lake Pichola", "udaipur", "Udaipur"], ["Baga Beach", "goa", "Panaji"], ["Fort Aguada", "goa", "Panaji"],
    ["Gateway of India", "mumbai", "Mumbai"], ["Marine Drive", "mumbai", "Mumbai"], ["Dashashwamedh Ghat", "varanasi", "Varanasi"],
    ["Hadimba Temple", "manali", "Manali"], ["Charminar", "hyderabad", "Hyderabad"], ["Mysore Palace", "bengaluru", "Bengaluru"],
  ];
  for (const [name, slug, city] of attractions) {
    await prisma.attraction.create({
      data: { name, destinationId: destRows[slug], cityId: cityRows[city] },
    }).catch(() => {});
  }

  // ---------- Tour types ----------
  const tourTypeNames = ["HERITAGE", "STREET_FOOD", "PHOTOGRAPHY", "NATURE", "ADVENTURE", "SPIRITUAL", "NIGHTLIFE", "SHOPPING"];
  for (const n of tourTypeNames) {
    await prisma.tourType.upsert({ where: { name: n }, update: {}, create: { name: n } });
  }

  // ---------- Settings ----------
  await prisma.platformSettings.upsert({
    where: { id: "singleton" }, update: {},
    create: {
      id: "singleton",
      commissionPercent: 15,
      cancellationPolicy: {
        tiers: [
          { hoursBefore: 48, refundPercent: 100 },
          { hoursBefore: 24, refundPercent: 50 },
          { hoursBefore: 0, refundPercent: 0 },
        ],
      },
    },
  });

  // ---------- Demo guides (approved) ----------
  const guides = [
    { email: "rahul@guide.test", name: "Rahul Sharma", city: "Jaipur", langs: ["Hindi", "English"], price: 800, rating: 4.9, reviews: 37, bio: "History student at MNIT Jaipur. I grew up in the old city — let me show you the Jaipur tourists never see.", tourTypes: ["HERITAGE", "STREET_FOOD", "SHOPPING"] },
    { email: "priya@guide.test", name: "Priya Verma", city: "Jaipur", langs: ["Hindi", "English", "French"], price: 1200, rating: 4.8, reviews: 21, bio: "Final-year architecture student. Heritage walks, photography routes, and the best lassi in the Pink City.", tourTypes: ["HERITAGE", "PHOTOGRAPHY"] },
    { email: "arjun@guide.test", name: "Arjun Mehta", city: "Mumbai", langs: ["Hindi", "English", "Marathi"], price: 1000, rating: 4.7, reviews: 52, bio: "Film student and street-food obsessive. From CST's Gothic revival to Mohammad Ali Road at midnight.", tourTypes: ["STREET_FOOD", "NIGHTLIFE", "HERITAGE"] },
    { email: "sneha@guide.test", name: "Sneha Kulkarni", city: "Pune", langs: ["Hindi", "English", "Marathi"], price: 700, rating: 4.9, reviews: 18, bio: "Sociology student. Pune's cafes, forts and the stories behind them.", tourTypes: ["HERITAGE", "NATURE"] },
    { email: "vikram@guide.test", name: "Vikram Singh", city: "Varanasi", langs: ["Hindi", "English"], price: 600, rating: 5.0, reviews: 44, bio: "Born on the ghats. Sunrise boat rides, hidden akharas, and the real Kashi.", tourTypes: ["SPIRITUAL", "HERITAGE"] },
  ];

  for (const g of guides) {
    const user = await prisma.user.upsert({
      where: { email: g.email },
      update: {},
      create: { email: g.email, name: g.name, passwordHash: password, role: Role.GUIDE },
    });
    const guide = await prisma.guideProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id, status: GuideStatus.APPROVED, bio: g.bio,
        currentCityId: cityRows[g.city], college: `${g.city} University`,
        isStudentVerified: true, basePrice: g.price, averageRating: g.rating, reviewCount: g.reviews,
        payoutUpiId: `${g.email.split("@")[0]}@upi`,
        emergencyContactName: "Family", emergencyContactPhone: "+91 90000 00000",
      },
    });
    for (const lang of g.langs) {
      await prisma.guideLanguage.upsert({
        where: { guideId_language: { guideId: guide.id, language: lang } },
        update: {}, create: { guideId: guide.id, language: lang },
      });
    }
    const destSlug = Object.keys(destRows).find((s) => destinations.find((d) => d.slug === s)!.city === g.city);
    if (destSlug) {
      await prisma.guideLocation.create({ data: { guideId: guide.id, destinationId: destRows[destSlug], attractionId: "" } }).catch(() => {});
    }
    for (const tt of g.tourTypes) {
      const type = await prisma.tourType.findUnique({ where: { name: tt } });
      if (type) {
        await prisma.guideTourType.upsert({
          where: { guideId_tourTypeId: { guideId: guide.id, tourTypeId: type.id } },
          update: {}, create: { guideId: guide.id, tourTypeId: type.id },
        });
      }
    }
    for (let d = 0; d < 7; d++) {
      await prisma.guideAvailability.create({
        data: { guideId: guide.id, dayOfWeek: d, startTime: "09:00", endTime: "18:00" },
      }).catch(() => {});
    }
    await prisma.kycVerification.create({
      data: { guideId: guide.id, status: KycStatus.APPROVED, idType: "STUDENT_ID", idLastFour: "0000", submittedAt: new Date() },
    }).catch(() => {});
  }

  // ---------- Demo tourist ----------
  const tourist = await prisma.user.upsert({
    where: { email: "tourist@demo.test" },
    update: {},
    create: { email: "tourist@demo.test", name: "Demo Tourist", passwordHash: password, role: Role.TOURIST },
  });
  await prisma.touristProfile.upsert({
    where: { userId: tourist.id },
    update: {},
    create: { userId: tourist.id, homeCountry: "Germany" },
  });

  console.log("Seed complete:");
  console.log("  admin@surfer.test / password123");
  console.log("  rahul@guide.test, priya@guide.test, arjun@guide.test, sneha@guide.test, vikram@guide.test / password123");
  console.log("  tourist@demo.test / password123");
}

main().finally(() => prisma.$disconnect());
