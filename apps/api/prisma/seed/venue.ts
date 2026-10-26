import type { PrismaClient } from "@prisma/client";
import type { Data } from "../../src/common/resource/resource-mapper";
import { TicketingService } from "../../src/ticketing/ticketing.service";
import type { Seeder } from "./app";
import { daysFromToday } from "./util";

type Create = (entityKey: string, input: Data, moves?: string[]) => Promise<Data & { id: string }>;

const iso = (offset: number) => daysFromToday(offset).toISOString().slice(0, 10);

const BUYERS: [string, string][] = [
  ["Rafsan Chowdhury", "01711223344"],
  ["Tasnia Haque", "01819445566"],
  ["Mahmud Hasan", "01552667788"],
  ["Nabila Sultana", "01677889900"],
  ["Ehsan Kabir", "01913101112"],
  ["Sharmin Akter", "01715131415"],
];

/** Booking extensions and ticketing setup: slots, pricing, coaches, seating, box office, orders. */
export async function seedVenue(seeder: Seeder): Promise<void> {
  const bookings = await seeder.actor("bookings@bsc.com.bd");
  const rec: Create = (key, input, moves = []) => seeder.record(key, bookings, input, moves);

  if (await seeder.empty("slot")) await seedBookingOps(seeder.prisma, rec);
  if (await seeder.empty("venueLayout")) await seedSeating(seeder.prisma, rec);
  if (await seeder.empty("ticketTransfer")) await seedOnlineOrders(seeder, rec);
  if (await seeder.empty("seasonPass")) await seedPassesAndEntry(seeder.prisma, rec);
}

async function seedBookingOps(prisma: PrismaClient, rec: Create) {
  const facilities = await prisma.facility.findMany({
    where: { type: { in: ["Football Pitch", "Tennis Court", "Padel Court", "Badminton Court", "Turf"] } },
    orderBy: { name: "asc" },
  });
  await prisma.facility.updateMany({ where: { id: { in: facilities.map((facility) => facility.id) } }, data: { bufferMinutes: 15 } });
  for (const facility of facilities.slice(0, 4)) {
    for (const [start, end, price] of [
      ["06:00", "08:00", 3500],
      ["16:00", "18:00", 5000],
      ["18:00", "20:00", 6500],
    ] as const) {
      await rec("slot", { facilityId: facility.id, dayOfWeek: "Daily", timeSlotStart: start, timeSlotEnd: end, capacity: 22, priceBdt: price });
    }
  }
  await rec("pricingRule", { name: "Evening peak", kind: "PEAK", dayOfWeek: "Daily", startsAt: "17:00", endsAt: "21:00", adjustPercent: 25 });
  await rec("pricingRule", { name: "Early bird", kind: "PEAK", dayOfWeek: "Daily", startsAt: "05:00", endsAt: "08:00", adjustPercent: -15 });
  await rec("pricingRule", { name: "Weekend demand", kind: "DYNAMIC", dayOfWeek: "Friday", startsAt: "08:00", endsAt: "22:00", adjustPercent: 20 });
  await rec("pricingRule", { name: "Saturday demand", kind: "DYNAMIC", dayOfWeek: "Saturday", startsAt: "08:00", endsAt: "22:00", adjustPercent: 15 });
  await rec("cancellationPolicy", { name: "Standard 48h", facilityType: "All", hoursBefore: 48, refundPercent: 100 });
  await rec("cancellationPolicy", { name: "Late notice", facilityType: "All", hoursBefore: 12, refundPercent: 50 });
  await rec("cancellationPolicy", { name: "Event hall", facilityType: "Event Hall", hoursBefore: 168, refundPercent: 80 });

  const pitch = facilities[0];
  const court = facilities.find((facility) => facility.type === "Tennis Court") ?? facilities[1];
  if (pitch) {
    await rec("recurringBookingRule", {
      facilityId: pitch.id,
      customerName: "Dhaka Juniors Academy",
      type: "Academy",
      frequency: "Weekly",
      startsOn: iso(3),
      endsOn: iso(59),
      timeSlotStart: "15:00",
      timeSlotEnd: "16:30",
      amountBdt: 4500,
    });
    await rec("waitlistEntry", { facilityId: pitch.id, customerName: "Uttara Strikers", phone: "+880 1711-445500", preferredDate: iso(6), timeSlotStart: "19:00", timeSlotEnd: "20:30", amountBdt: 6500 });
    await rec("waitlistEntry", { facilityId: pitch.id, customerName: "Gulshan Veterans", phone: "+880 1819-662200", preferredDate: iso(9), timeSlotStart: "07:00", timeSlotEnd: "08:30", amountBdt: 3500 }, ["OFFERED"]);
  }

  const coaches = [];
  for (const coach of [
    { name: "Shafiul Islam", sport: "Football", phone: "+880 1711-300400", hourlyRateBdt: 2500 },
    { name: "Nadia Rahman", sport: "Tennis", phone: "+880 1819-500600", hourlyRateBdt: 3000 },
    { name: "Kamal Hossain", sport: "Swimming", phone: "+880 1552-700800", hourlyRateBdt: 2200 },
  ]) {
    coaches.push(await rec("coach", coach));
  }
  if (court) {
    await rec("coachSession", { coachId: coaches[1]!.id, facilityId: court.id, customerName: "Arisha Karim", sessionDate: iso(2), timeSlotStart: "09:00", timeSlotEnd: "10:30" }, ["CONFIRMED"]);
    await rec("coachSession", { coachId: coaches[1]!.id, facilityId: court.id, customerName: "Zayan Ahmed", sessionDate: iso(2), timeSlotStart: "11:00", timeSlotEnd: "12:00" });
  }
  if (pitch) {
    await rec("coachSession", { coachId: coaches[0]!.id, facilityId: pitch.id, customerName: "Mirpur FC U-14", sessionDate: iso(4), timeSlotStart: "16:00", timeSlotEnd: "18:00" }, ["CONFIRMED"]);
  }

  const live = await prisma.booking.findMany({
    where: { status: { in: ["Pending", "Confirmed"] }, featureKey: { not: "recurring-booking" } },
    orderBy: { date: "asc" },
    take: 4,
  });
  const equipment = await prisma.equipment.findMany({ where: { quantity: { gt: 2 } }, take: 2 });
  for (const [n, booking] of live.entries()) {
    const amount = Number(booking.amount);
    if (n === 0 && equipment[0]) await rec("bookingAddOn", { bookingId: booking.id, equipmentId: equipment[0].id, quantity: 2, feeBdt: 800 }, ["ISSUED"]);
    if (n === 1 && equipment[1]) await rec("bookingAddOn", { bookingId: booking.id, equipmentId: equipment[1].id, quantity: 1, feeBdt: 500 });
    if (amount <= 0) continue;
    if (n < 2) await rec("bookingDeposit", { bookingId: booking.id, amountBdt: Math.round(amount * 0.3), method: "bKash", heldOn: iso(-2) });
    if (n === 2) await rec("bookingPayment", { bookingId: booking.id, amountBdt: amount, method: "Card" }, ["CAPTURED"]);
    if (n === 3) await rec("bookingPayment", { bookingId: booking.id, amountBdt: amount, method: "Sandbox" });
  }
}

const firstEvent = (prisma: PrismaClient) =>
  prisma.matchEvent.findFirst({
    where: { salesStatus: "ON_SALE", startsAt: { gt: new Date() } },
    orderBy: { startsAt: "asc" },
    include: { categories: true, sections: { orderBy: { sortOrder: "asc" } } },
  });

async function seedSeating(prisma: PrismaClient, rec: Create) {
  const layout = await rec("venueLayout", { name: "Central Stadium · football", venue: "Central Stadium", notes: "Standard league configuration" });
  const stands = [];
  for (const [name, gate] of [
    ["North Stand", "Gate 1"],
    ["South Stand", "Gate 4"],
    ["East Pavilion", "Gate 2"],
  ] as const) {
    stands.push(await rec("stand", { name, venueLayoutId: layout.id, gate }));
  }
  const blocks = [];
  for (const [stand, name, rows, seats] of [
    [0, "N1", 20, 40],
    [0, "N2", 20, 40],
    [1, "S1", 24, 45],
    [2, "VIP-E", 6, 20],
  ] as const) {
    blocks.push(await rec("seatBlock", { name, standId: stands[stand]!.id, rows, seatsPerRow: seats }));
  }
  const rows = [];
  for (const label of ["A", "B", "C"]) rows.push(await rec("seatRow", { label, seatBlockId: blocks[3]!.id, seats: 20, accessible: label === "A" ? 2 : 0 }));
  await rec("seatRow", { label: "A", seatBlockId: blocks[0]!.id, seats: 40, accessible: 4 });

  const event = await firstEvent(prisma);
  if (!event) return;
  await rec("seatAssignment", { matchEventId: event.id, seatRowId: rows[0]!.id, seatNo: 1, allocation: "VVIP", holder: "Chairman's guest" });
  await rec("seatAssignment", { matchEventId: event.id, seatRowId: rows[0]!.id, seatNo: 2, allocation: "VIP", holder: "BFF President" });
  await rec("seatAssignment", { matchEventId: event.id, seatRowId: rows[1]!.id, seatNo: 5, allocation: "Sponsor", holder: "Meghna Group" });
  await rec("seatAssignment", { matchEventId: event.id, seatRowId: rows[2]!.id, seatNo: 8, allocation: "Public" });
  await rec("boxOfficeTicket", { matchEventId: event.id, kind: "GENERAL", channel: "Box office", holder: "Walk-in sales", mobile: "01700000000", quantity: 120, priceBdt: 500 });
  await rec("boxOfficeTicket", { matchEventId: event.id, kind: "VIP", channel: "QR", holder: "Shahid Alam", mobile: "01711000111", quantity: 2, priceBdt: 6000, seat: "VIP-E A-3" });
  await rec("boxOfficeTicket", { matchEventId: event.id, kind: "VVIP", channel: "NFC", holder: "Ayman Sobhan", mobile: "01811000222", quantity: 4, priceBdt: 15000, seat: "Suite 2", host: "Chairman's office", device: "NFC-88213" });
  await rec("boxOfficeTicket", { matchEventId: event.id, kind: "HOSPITALITY", channel: "Email", holder: "Grameenphone", mobile: "01711000333", quantity: 10, priceBdt: 9500, seat: "Lounge 1" });
  await rec("boxOfficeTicket", { matchEventId: event.id, kind: "COMPLIMENTARY", channel: "SMS", holder: "Youth league winners", mobile: "01911000444", quantity: 20, approvedBy: "Farhan Ahmed" });
  await rec("ticketAllocation", { matchEventId: event.id, holderType: "Sponsor", holder: "Meghna Group", quantity: 200, contact: "Sadia Rahman" }, ["CONFIRMED"]);
  await rec("ticketAllocation", { matchEventId: event.id, holderType: "Federation", holder: "Bangladesh Football Federation", quantity: 150, contact: "Iqbal Hossain" });
  await rec("promoCode", { code: "EARLYBIRD", matchEventId: event.id, discountPercent: 15, validUntil: iso(10), usageLimit: 500 });
  const category = event.categories[0];
  if (category) await rec("priceChange", { ticketCategoryId: category.id, priceBdt: Number(category.priceBdt), reason: "Confirmed for league season" }, ["POSTED"]);
}

/** Paid online orders (through the public checkout service) so transfers and cases have real orders. */
async function seedOnlineOrders(seeder: Seeder, rec: Create) {
  const ticketing = seeder.service(TicketingService);
  const event = await firstEvent(seeder.prisma);
  const section = event?.sections[0];
  if (!event || !section || !ticketing.sandboxEnabled()) return;

  const references: string[] = [];
  for (const [n, [name, mobile]] of BUYERS.entries()) {
    const { body: order } = await ticketing.createOrder(
      {
        eventId: event.id,
        buyerName: name,
        buyerMobile: mobile,
        buyerEmail: `${name.split(" ")[0]!.toLowerCase()}@mail.com`,
        termsAccepted: true,
        seats: [{ sectionId: section.id, rowLabel: "A", seatNumber: n + 1 }],
      },
      `seed-order-${event.id}-${n}`,
    );
    await ticketing.pay(order.reference, { buyerMobile: mobile, method: "BKASH" }, `seed-pay-${order.reference}`);
    references.push(order.reference);
  }
  const orders = await seeder.prisma.ticketOrder.findMany({ where: { reference: { in: references } }, orderBy: { createdAt: "asc" } });
  const [moved, transferring, refunding, cancelled] = orders;
  if (moved) await rec("ticketTransfer", { ticketOrderId: moved.id, toHolder: "Imran Kabir", toMobile: "01722334455" }, ["COMPLETED"]);
  if (transferring) await rec("ticketTransfer", { ticketOrderId: transferring.id, toHolder: "Farzana Yasmin", toMobile: "01833445566" });
  if (refunding) await rec("ticketCase", { kind: "REFUND", ticketOrderId: refunding.id, amountBdt: Number(refunding.total), reason: "Unable to attend" });
  if (cancelled) await rec("ticketCase", { kind: "CANCELLATION", ticketOrderId: cancelled.id, reason: "Bought the wrong date" }, ["APPROVED"]);
}

async function seedPassesAndEntry(prisma: PrismaClient, rec: Create) {
  await rec("seasonPass", { holder: "Tahsin Rahman", mobile: "01711556677", season: "2026-27", seat: "N1 C-12", priceBdt: 18000, validUntil: iso(240) });
  await rec("seasonPass", { holder: "Corporate box · Beximco", mobile: "01811667788", season: "2026-27", seat: "VIP-E B-1..6", priceBdt: 240000, validUntil: iso(240) });
  const gates = await prisma.gate.findMany({ take: 2, orderBy: { name: "asc" } });
  if (gates[0]) await rec("entryReview", { gateId: gates[0].id, direction: "IN", result: "ALLOW", note: "Ticket damaged, verified by reference" });
  if (gates[1]) await rec("entryReview", { gateId: gates[1].id, direction: "IN", result: "DENY", note: "Duplicate scan, second attempt" });
}
