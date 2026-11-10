import type { PrismaClient } from "@prisma/client";

const photo = (id: string, width = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

const PLANS = [
  { code: "annual", name: "Annual", label: "Annual Membership", memberTier: "Individual", priceBdt: 18000, perks: ["Gym + pool", "Members Gate", "2 classes / week"], maxHolders: 0, employerBilled: false, sortOrder: 1 },
  { code: "family", name: "Family", label: "Family Membership", memberTier: "Family", priceBdt: 36000, perks: ["Up to 4 holders", "Pool access", "Kids club"], maxHolders: 3, employerBilled: false, sortOrder: 2 },
  { code: "student", name: "Student", label: "Student Membership", memberTier: "Individual", priceBdt: 6000, perks: ["Student ID checked at first entry", "Gym + pool"], maxHolders: 0, employerBilled: false, sortOrder: 3 },
  { code: "corporate", name: "Corporate", label: "Corporate Membership", memberTier: "Corporate", priceBdt: 0, perks: ["Employer billed", "Members Gate", "Corporate events"], maxHolders: 0, employerBilled: true, sortOrder: 4 },
];

const CORPORATE = [
  { code: "ACME-2026", name: "Acme Ltd" },
  { code: "BSC-CORP", name: "Bangladesh Sports Council" },
];

type Dish = { name: string; category: string; priceBdt: number; station: string; prepMinutes: number; image: string };
const DISH: Record<string, Dish> = {
  seabass: { name: "Citrus seabass", category: "Kitchen", priceBdt: 480, station: "Hot kitchen · ~12 min", prepMinutes: 12, image: "1519708227418-c8fd9a32b7a2" },
  bowl: { name: "Match bowl", category: "Kitchen", priceBdt: 220, station: "Cold kitchen · ~12 min", prepMinutes: 12, image: "1512621776951-a57141f2eefd" },
  burger: { name: "Stadium burger", category: "Kitchen", priceBdt: 280, station: "Grill · ~12 min", prepMinutes: 12, image: "1568901346375-23c9450c58cd" },
  salad: { name: "Athlete salad", category: "Kitchen", priceBdt: 180, station: "Cold kitchen · ~12 min", prepMinutes: 12, image: "1546069901-ba9599a7e63c" },
  spritz: { name: "Gold spritz", category: "Bar", priceBdt: 160, station: "Bar · ~3 min", prepMinutes: 3, image: "1514362545857-3bc16c4c7d1b" },
  brew: { name: "Cold brew", category: "Bar", priceBdt: 90, station: "Bar · ~3 min", prepMinutes: 3, image: "1461023058943-07fcbe16d735" },
  cooler: { name: "Electrolyte cooler", category: "Bar", priceBdt: 80, station: "Bar · ~3 min", prepMinutes: 3, image: "1622597467836-f3285f2131b8" },
  financier: { name: "Date financier", category: "Pastry", priceBdt: 120, station: "Ready now", prepMinutes: 1, image: "1587314168485-3236d6710814" },
  bite: { name: "Protein bite", category: "Snacks", priceBdt: 100, station: "Ready now", prepMinutes: 1, image: "1606313564200-e75d5e30476c" },
  trail: { name: "Trail mix cup", category: "Snacks", priceBdt: 70, station: "Ready now", prepMinutes: 1, image: "1599599810769-bcde5a160d32" },
};
const MENUS: Record<string, string[]> = {
  "Boulevard Grill House": ["seabass", "burger", "salad", "bowl", "spritz", "brew"],
  "Courtside Food Court": ["burger", "bowl", "cooler", "bite", "trail"],
  "Aquatic Centre Café": ["salad", "brew", "cooler", "financier", "bite"],
};

/** Photo and one-line description per facility type, used where staff have not set their own. */
const VENUE_LOOK: Record<string, { image: string; summary: string }> = {
  Stadium: { image: "1522778119026-d647f0596c20", summary: "Flagship bowl with hospitality rings, media gantry and broadcast compound." },
  "Football Pitch": { image: "1459865264687-595d652de67e", summary: "Floodlit full-size pitch for matches, academies and community play." },
  "Cricket Ground": { image: "1531415074968-036ba1b575da", summary: "International square with sight screens and a players' pavilion." },
  "Event Hall": { image: "1522778119026-d647f0596c20", summary: "Column-free hall for conferences, galas and fan events." },
  "Training Ground": { image: "1560272564-c83b66b1ad12", summary: "Covered training pitches and warm-up space for resident clubs." },
  Turf: { image: "1574629810360-7efbbe195018", summary: "All-weather turf for small-sided games and corporate leagues." },
  "Basketball Court": { image: "1546519638-68e109498ffc", summary: "Indoor court with sprung floor and spectator seating." },
  "Badminton Court": { image: "1546519638-68e109498ffc", summary: "Indoor courts with competition lighting and racket hire." },
  "Tennis Court": { image: "1595435934249-5df7ed86e1c0", summary: "Hard courts with floodlights for day and evening play." },
  "Padel Court": { image: "1612534847738-b3af9bc31f0c", summary: "Glass-walled padel court with racket hire." },
  "Squash Court": { image: "1612534847738-b3af9bc31f0c", summary: "Glass-backed squash court for singles and coaching." },
  "Swimming Pool": { image: "1519315901367-f34ff9154487", summary: "Competition lanes, a diving well and a recovery spa." },
  Gym: { image: "1534438327276-14e5300c3a48", summary: "Strength floor, recovery lab and class studios." },
  Restaurant: { image: "1517248135467-4c7edcad34c4", summary: "Match-day dining with views over the boulevard." },
  Lounge: { image: "1621293954908-907159247fc8", summary: "Host lounge for members, families and guests." },
  "Medical Room": { image: "1519494026892-80bbd2d6fd0d", summary: "Pitch-side medical care and first aid." },
};
const FUTSAL = { image: "1606925797300-0b35e9d1794e", summary: "Indoor futsal court with sprung floor and bench seating." };

const LOUNGES: Record<string, { image: string; summary: string }> = {
  "VIP Lounge Deck": { image: "1621293954908-907159247fc8", summary: "Quiet seating and light service" },
  "Sponsor Box Lounge": { image: "1560448204-e02f11c3d0e2", summary: "Private box with sofas and a match view" },
  "Cricket Pavilion Lounge": { image: "1621293954908-907159247fc8", summary: "Pavilion seating with a view of the square" },
  "Aquatic Viewing Lounge": { image: "1575429198097-0414ec08e8cd", summary: "After-swim shade and cold drinks" },
  "Retail Sky Lounge": { image: "1560448204-e02f11c3d0e2", summary: "Sofas and a small play corner" },
};

const STOPS = [
  { code: "main-gate", name: "Main Gate North", zone: "Entry", x: 0.48, y: 0.22, icon: "gate", sortOrder: 1 },
  { code: "stadium", name: "ABG Stadium", zone: "Stadium", x: 0.52, y: 0.32, icon: "stadium", sortOrder: 2 },
  { code: "pool", name: "Aquatic Centre", zone: "Pool", x: 0.3, y: 0.45, icon: "pool", sortOrder: 3 },
  { code: "plaza", name: "Central Plaza", zone: "Plaza", x: 0.42, y: 0.52, icon: "plaza", sortOrder: 4 },
  { code: "retail", name: "Retail Boulevard", zone: "Food", x: 0.2, y: 0.65, icon: "food", sortOrder: 5 },
];

/** Customer app catalogue: plans, employer codes, menus, venue photos, shuttle stops and bookable lounges. Fills gaps only. */
export async function seedCustomerApp(prisma: PrismaClient): Promise<void> {
  for (const plan of PLANS) {
    if (await prisma.membershipPlan.findUnique({ where: { code: plan.code } })) continue;
    await prisma.membershipPlan.create({ data: plan });
  }
  for (const account of CORPORATE) {
    if (await prisma.corporateAccount.findUnique({ where: { code: account.code } })) continue;
    await prisma.corporateAccount.create({ data: account });
  }

  const outlets = await prisma.outlet.findMany({ where: { name: { in: Object.keys(MENUS) } } });
  for (const outlet of outlets) {
    for (const [sortOrder, key] of MENUS[outlet.name]!.entries()) {
      const { image, ...dish } = DISH[key]!;
      if (await prisma.menuItem.findFirst({ where: { outletId: outlet.id, name: dish.name } })) continue;
      await prisma.menuItem.create({ data: { ...dish, outletId: outlet.id, imageUrl: photo(image, 900), sortOrder } });
    }
  }

  for (const stop of STOPS) {
    if (await prisma.shuttleStop.findUnique({ where: { code: stop.code } })) continue;
    await prisma.shuttleStop.create({ data: stop });
  }

  const bare = await prisma.facility.findMany({ where: { imageUrl: null } });
  for (const facility of bare) {
    const look = facility.name.includes("Futsal") ? FUTSAL : VENUE_LOOK[facility.type];
    if (!look) continue;
    await prisma.facility.update({ where: { id: facility.id }, data: { imageUrl: photo(look.image), summary: facility.summary ?? look.summary } });
  }

  for (const [name, look] of Object.entries(LOUNGES)) {
    await prisma.lounge.updateMany({
      where: { name, imageUrl: null },
      data: { customerBookable: true, imageUrl: photo(look.image, 900), summary: look.summary },
    });
  }
}
