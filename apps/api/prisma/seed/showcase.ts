import * as bcrypt from "bcryptjs";
import type { Seeder } from "./app";

/**
 * Demo content for showing the staff website and the customer app side by side: a full day of slots,
 * upcoming events, a few more members and bookings, and a demo visitor with a membership,
 * bookings and inbox. Idempotent and top-up only: it never touches rows that already exist, and runs
 * on every demo start so event dates stay in the future.
 */
export async function seedShowcase(seeder: Seeder): Promise<void> {
  const prisma = seeder.prisma;
  const bookings = await seeder.actor("bookings@bsc.com.bd");
  await seedSlots(seeder, bookings);
  await seedEvents(prisma);
  await seedMembersAndBookings(prisma, bookings.id);
  await seedDemoVisitor(prisma, bookings.id);
}

const SLOT_TYPES: Record<string, number> = {
  "Football Pitch": 6000,
  "Turf": 5000,
  "Tennis Court": 2500,
  "Padel Court": 3000,
  "Badminton Court": 1800,
  "Basketball Court": 2200,
  "Squash Court": 1600,
};
const WINDOWS: [string, string][] = [
  ["06:00", "08:00"],
  ["08:00", "10:00"],
  ["10:00", "12:00"],
  ["14:00", "16:00"],
  ["16:00", "18:00"],
  ["18:00", "20:00"],
  ["20:00", "22:00"],
];

async function seedSlots(seeder: Seeder, actor: Awaited<ReturnType<Seeder["actor"]>>) {
  const prisma = seeder.prisma;
  const facilities = await prisma.facility.findMany({ where: { type: { in: Object.keys(SLOT_TYPES) } } });
  for (const facility of facilities) {
    const have = new Set((await prisma.slot.findMany({ where: { facilityId: facility.id }, select: { timeSlotStart: true } })).map((s) => s.timeSlotStart));
    const base = SLOT_TYPES[facility.type]!;
    for (const [start, end] of WINDOWS) {
      if (have.has(start)) continue;
      const peak = start >= "17:00" ? 1.25 : start < "08:00" ? 0.85 : 1;
      await seeder.record("slot", actor, {
        facilityId: facility.id,
        dayOfWeek: "Daily",
        timeSlotStart: start,
        timeSlotEnd: end,
        capacity: Math.min(facility.capacity || 22, 22),
        priceBdt: Math.round((base * peak) / 50) * 50,
      });
    }
  }
}

interface EventPlan {
  title: string;
  sport: string;
  venueName: string;
  venueNote: string;
  days: number;
  hour: number;
  sections: { name: string; rows: number; seatsPerRow: number; price: number; gate: string }[];
}

const EVENTS: EventPlan[] = [
  {
    title: "ABG Kings vs Abahani",
    sport: "Football",
    venueName: "ABG Sports City Stadium",
    venueNote: "International-standard pitch. Gates open 2 hours before kickoff.",
    days: 9,
    hour: 18,
    sections: [
      { name: "West Stand", rows: 6, seatsPerRow: 12, price: 800, gate: "Main Gate North" },
      { name: "East Stand", rows: 6, seatsPerRow: 12, price: 800, gate: "Main Gate North" },
      { name: "VIP", rows: 2, seatsPerRow: 8, price: 4500, gate: "VIP Gate 1" },
    ],
  },
  {
    title: "Women's Football Cup — Semi-final",
    sport: "Football",
    venueName: "Central Stadium Complex",
    venueNote: "Family-friendly fixture. Free entry for under-12s with an adult.",
    days: 4,
    hour: 16,
    sections: [
      { name: "Main Stand", rows: 5, seatsPerRow: 12, price: 400, gate: "Main Gate North" },
      { name: "Grass Bank", rows: 4, seatsPerRow: 14, price: 200, gate: "Main Gate North" },
    ],
  },
  {
    title: "Dhaka Premier League — Day 7",
    sport: "Cricket",
    venueName: "Cricket Ground & Pavilion",
    venueNote: "Covered pavilion seating. Play starts in the afternoon.",
    days: 14,
    hour: 13,
    sections: [
      { name: "Pavilion", rows: 4, seatsPerRow: 10, price: 600, gate: "Main Gate North" },
      { name: "Grass Bank", rows: 5, seatsPerRow: 14, price: 300, gate: "Main Gate North" },
    ],
  },
  {
    title: "National Tennis Open — Final",
    sport: "Tennis",
    venueName: "Racquet Sports Pavilion",
    venueNote: "Centre court. Bags larger than A4 are not admitted.",
    days: 6,
    hour: 17,
    sections: [
      { name: "Court Side", rows: 3, seatsPerRow: 10, price: 1500, gate: "Main Gate North" },
      { name: "Upper Bowl", rows: 4, seatsPerRow: 12, price: 700, gate: "Main Gate North" },
    ],
  },
  {
    title: "City Futsal Festival",
    sport: "Futsal",
    venueName: "Futsal & Hockey Arena",
    venueNote: "Eight teams, one day. Food stalls open from noon.",
    days: 3,
    hour: 15,
    sections: [
      { name: "Courtside", rows: 3, seatsPerRow: 12, price: 350, gate: "Main Gate North" },
      { name: "Gallery", rows: 4, seatsPerRow: 14, price: 150, gate: "Main Gate North" },
    ],
  },
  {
    title: "Inter-School Swim Gala",
    sport: "Swimming",
    venueName: "Aquatic Centre",
    venueNote: "Heats from morning, finals at noon. Poolside seating is limited.",
    days: 11,
    hour: 10,
    sections: [
      { name: "Poolside", rows: 2, seatsPerRow: 10, price: 500, gate: "Main Gate North" },
      { name: "Terrace", rows: 4, seatsPerRow: 12, price: 250, gate: "Main Gate North" },
    ],
  },
];

async function seedEvents(prisma: Seeder["prisma"]) {
  const now = new Date();
  const upcoming = await prisma.matchEvent.findMany({ where: { startsAt: { gt: now } }, select: { title: true } });
  const taken = new Set(upcoming.map((event) => event.title));
  for (const plan of EVENTS) {
    if (taken.has(plan.title)) continue;
    const at = (hoursBefore = 0) => {
      const date = new Date();
      date.setDate(date.getDate() + plan.days);
      date.setHours(plan.hour - hoursBefore, 0, 0, 0);
      return date;
    };
    const event = await prisma.matchEvent.create({
      data: {
        title: plan.title,
        sport: plan.sport,
        venueName: plan.venueName,
        venueNote: plan.venueNote,
        startsAt: at(),
        doorsAt: at(2),
        salesStatus: "ON_SALE",
        vatRateBps: 1500,
      },
    });
    for (const [index, section] of plan.sections.entries()) {
      const created = await prisma.eventSection.create({
        data: { eventId: event.id, name: section.name, rows: section.rows, seatsPerRow: section.seatsPerRow, sortOrder: index },
      });
      await prisma.ticketCategory.create({
        data: { eventId: event.id, sectionId: created.id, name: section.name, priceBdt: section.price, gateName: section.gate },
      });
    }
  }
}

const MEMBERS = [
  { name: "Sadia Rahman", email: "sadia.rahman@example.com", tier: "Individual", status: "Active", checkInCount: 31 },
  { name: "Imran Hossain", email: "imran.hossain@example.com", tier: "Corporate", status: "Active", checkInCount: 54 },
  { name: "Mehnaz Chowdhury", email: "mehnaz.chowdhury@example.com", tier: "Family", status: "Active", checkInCount: 22 },
  { name: "Jahid Alam", email: "jahid.alam@example.com", tier: "Individual", status: "Active", checkInCount: 9 },
  { name: "Lamia Sultana", email: "lamia.sultana@example.com", tier: "Individual", status: "Frozen", checkInCount: 14 },
];

const WALK_INS = [
  { facility: "Futsal Arena 1", customerName: "Mirpur Strikers", type: "Corporate", days: 1, start: "18:00", end: "20:00", amount: 6500, status: "Confirmed" },
  { facility: "Padel Court 2", customerName: "Sadia Rahman", type: "Member", days: 2, start: "17:00", end: "18:00", amount: 1500, status: "Confirmed" },
  { facility: "Badminton Hall", customerName: "Dhaka Corporate League", type: "Corporate", days: 3, start: "19:00", end: "21:00", amount: 3600, status: "Pending" },
  { facility: "Tennis Court 1", customerName: "Imran Hossain", type: "Member", days: 2, start: "07:00", end: "08:00", amount: 1000, status: "Confirmed" },
  { facility: "Futsal Arena 1", customerName: "Gulshan Veterans", type: "Corporate", days: 4, start: "20:00", end: "22:00", amount: 6500, status: "Confirmed" },
  { facility: "Squash Court A", customerName: "Jahid Alam", type: "Member", days: 1, start: "16:00", end: "17:00", amount: 1200, status: "Confirmed" },
];

function dayAt(offset: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
}

async function seedMembersAndBookings(prisma: Seeder["prisma"], createdById: string) {
  for (const member of MEMBERS) {
    if (await prisma.member.findUnique({ where: { email: member.email } })) continue;
    const created = await prisma.member.create({
      data: { ...member, expiryDate: dayAt(member.status === "Expired" ? -10 : 200), billingCycle: "Annual" },
    });
    await prisma.credential.create({
      data: { holderRef: created.name, type: "Member", memberId: created.id, status: created.status === "Active" ? "Active" : "Suspended" },
    });
  }
  for (const row of WALK_INS) {
    const facility = await prisma.facility.findFirst({ where: { name: row.facility } });
    if (!facility) continue;
    const date = dayAt(row.days);
    const exists = await prisma.booking.findFirst({
      where: { facilityId: facility.id, date, timeSlotStart: row.start, customerName: row.customerName },
    });
    if (exists) continue;
    await prisma.booking.create({
      data: {
        facilityId: facility.id,
        customerName: row.customerName,
        type: row.type,
        date,
        timeSlotStart: row.start,
        timeSlotEnd: row.end,
        status: row.status,
        amount: row.amount,
        paymentStatus: row.status === "Confirmed" ? "Paid" : "Unpaid",
        createdById,
      },
    });
  }
}

export const DEMO_VISITOR = { email: "demo.visitor@abg.example", mobile: "01711000001", password: "Password123!" };

/** A visitor account for the app: sign in and see a membership, bookings and messages straight away. */
async function seedDemoVisitor(prisma: Seeder["prisma"], createdById: string) {
  if (await prisma.customer.findUnique({ where: { email: DEMO_VISITOR.email } })) return;
  const customer = await prisma.customer.create({
    data: {
      name: "Demo Visitor",
      email: DEMO_VISITOR.email,
      mobile: DEMO_VISITOR.mobile,
      passwordHash: await bcrypt.hash(DEMO_VISITOR.password, 10),
      idType: "NID",
      idLast4: "4821",
      dob: new Date("1994-05-06T00:00:00.000Z"),
      consents: [{ purpose: "Terms of use", granted: true, at: new Date().toISOString(), version: "v1.1", channel: "App", language: "en" }],
    },
  });
  const member = await prisma.member.create({
    data: {
      name: customer.name,
      email: customer.email,
      phone: customer.mobile,
      tier: "Individual",
      status: "Active",
      expiryDate: dayAt(300),
      billingCycle: "Annual",
      customerId: customer.id,
      planCode: "annual",
      checkInCount: 12,
    },
  });
  await prisma.credential.create({ data: { holderRef: customer.name, type: "Member", memberId: member.id, customerId: customer.id, status: "Active" } });

  const sessions = [
    { facility: "Futsal Arena 1", days: 2, start: "18:00", end: "20:00", amount: 7000 },
    { facility: "Padel Court 2", days: 5, start: "17:00", end: "19:00", amount: 3750 },
  ];
  for (const row of sessions) {
    const facility = await prisma.facility.findFirst({ where: { name: row.facility } });
    if (!facility) continue;
    await prisma.booking.create({
      data: {
        facilityId: facility.id,
        customerName: customer.name,
        type: "Member",
        date: dayAt(row.days),
        timeSlotStart: row.start,
        timeSlotEnd: row.end,
        status: "Confirmed",
        amount: row.amount,
        paymentStatus: "Paid",
        createdById,
        customerId: customer.id,
      },
    });
  }
  await prisma.customerNotification.createMany({
    data: [
      { customerId: customer.id, title: "Welcome to ABG Sports City", body: "Your account is ready. Book a session or pick up event tickets." },
      { customerId: customer.id, title: "Membership active", body: "Annual membership is active. Show your member QR at the Members Gate." },
      { customerId: customer.id, title: "Booking confirmed", body: "Futsal Arena 1 · 18:00–20:00 is confirmed. Entry opens 30 minutes before." },
    ],
  });
}
