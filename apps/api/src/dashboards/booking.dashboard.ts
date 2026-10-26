import { Injectable } from "@nestjs/common";
import { BookingStatus, MemberStatus, PaymentStatus } from "@bsc/shared";
import { minutes } from "../bookings/booking-time";
import { isoDay } from "../common/resource/resource-mapper";
import { PrismaService } from "../prisma/prisma.service";
import { addDays, bucketSum, delta, num, pct, startOfDay, weekBuckets, type RangeKey } from "./range";

const OCCUPANCY_DAYS = 7;
const TOP = 5;
const RECENT = 6;

/** Calendar month containing today (offset 0) or the one before (offset -1), with the month before it. */
function calendarMonth(offset: number, now = new Date()) {
  const start = (n: number) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + n, 1));
  return { from: start(offset), to: start(offset + 1), prevFrom: start(offset - 1), prevTo: start(offset) };
}

const share = <T extends { amount: number }>(rows: T[], total: number) => rows.map((row) => ({ ...row, pct: pct(row.amount, total) }));

/** Bookings, ticket sales, occupancy and the recent booking queue for the booking dashboard. */
@Injectable()
export class BookingDashboard {
  constructor(private readonly prisma: PrismaService) {}

  async get(range: RangeKey) {
    const w = calendarMonth(range === "last-month" ? -1 : 0);
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const horizon = addDays(today, OCCUPANCY_DAYS);
    const live = { not: BookingStatus.CANCELLED };

    const [bookings, prevCount, statusCounts, orders, boxOffice, members, prevMembers, upcomingMatches, upcomingPacks, facilities, week, todayPayments, todayOrders, todayBox, waiting, recent] =
      await Promise.all([
        this.prisma.booking.findMany({ where: { date: { gte: w.from, lt: w.to } }, select: { date: true, amount: true, status: true, timeSlotStart: true, facility: { select: { name: true, type: true } } } }),
        this.prisma.booking.count({ where: { date: { gte: w.prevFrom, lt: w.prevTo } } }),
        this.prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
        this.prisma.ticketOrderItem.findMany({ where: { order: { status: "CONFIRMED", createdAt: { gte: w.from, lt: w.to } } }, select: { order: { select: { createdAt: true } } } }),
        this.prisma.boxOfficeTicket.findMany({ where: { status: { not: "REVOKED" }, createdAt: { gte: w.from, lt: w.to } }, select: { createdAt: true, quantity: true } }),
        this.prisma.member.count({ where: { status: MemberStatus.ACTIVE } }),
        this.prisma.member.count({ where: { status: MemberStatus.ACTIVE, createdAt: { lt: w.from } } }),
        this.prisma.matchEvent.count({ where: { startsAt: { gte: today } } }),
        this.prisma.eventPack.count({ where: { booking: { date: { gte: today } }, status: { not: "Closed" } } }),
        this.prisma.facility.findMany({ select: { id: true, name: true, operatingHoursStart: true, operatingHoursEnd: true } }),
        this.prisma.booking.findMany({ where: { date: { gte: today, lt: horizon }, status: live }, select: { facilityId: true, timeSlotStart: true, timeSlotEnd: true } }),
        this.prisma.bookingPayment.aggregate({ where: { status: "CAPTURED", updatedAt: { gte: today, lt: tomorrow } }, _sum: { amountBdt: true } }),
        this.prisma.ticketOrder.findMany({ where: { status: "CONFIRMED", createdAt: { gte: today, lt: tomorrow } }, select: { total: true, _count: { select: { items: true } } } }),
        this.prisma.boxOfficeTicket.findMany({ where: { status: { not: "REVOKED" }, createdAt: { gte: today, lt: tomorrow } }, select: { quantity: true, totalBdt: true } }),
        this.prisma.waitlistEntry.count({ where: { status: { in: ["WAITING", "OFFERED"] } } }),
        this.prisma.booking.findMany({ orderBy: [{ createdAt: "desc" }, { date: "asc" }], take: RECENT, include: { facility: { select: { name: true } } } }),
      ]);

    const weeks = weekBuckets(w.from, w.to);
    const counted = bookings.filter((booking) => booking.status !== BookingStatus.CANCELLED);
    const revenue = counted.reduce((sum, booking) => sum + num(booking.amount), 0);

    const byVenue = new Map<string, number>();
    const byType = new Map<string, number>();
    const byHour = new Map<string, number>();
    for (const booking of counted) {
      byVenue.set(booking.facility.name, (byVenue.get(booking.facility.name) ?? 0) + num(booking.amount));
      byType.set(booking.facility.type, (byType.get(booking.facility.type) ?? 0) + 1);
      const hour = booking.timeSlotStart.slice(0, 2);
      byHour.set(hour, (byHour.get(hour) ?? 0) + 1);
    }
    const venues = [...byVenue.entries()].map(([label, amount]) => ({ label, amount })).sort((a, b) => b.amount - a.amount);
    const venueRows = venues.length > TOP ? [...venues.slice(0, TOP), { label: "Others", amount: venues.slice(TOP).reduce((s, v) => s + v.amount, 0) }] : venues;
    const types = [...byType.entries()].map(([label, amount]) => ({ label, amount })).sort((a, b) => b.amount - a.amount).slice(0, TOP);

    const bookedMinutes = new Map<string, number>();
    for (const booking of week) bookedMinutes.set(booking.facilityId, (bookedMinutes.get(booking.facilityId) ?? 0) + minutes(booking.timeSlotEnd) - minutes(booking.timeSlotStart));
    const occupancy = facilities
      .map((facility) => {
        const open = (minutes(facility.operatingHoursEnd) - minutes(facility.operatingHoursStart)) * OCCUPANCY_DAYS;
        const used = bookedMinutes.get(facility.id) ?? 0;
        return { id: facility.id, name: facility.name, used, open, pct: Math.min(100, pct(used, open)) };
      })
      .sort((a, b) => b.pct - a.pct);
    const overall = pct(occupancy.reduce((s, f) => s + f.used, 0), occupancy.reduce((s, f) => s + f.open, 0));

    const count = (status: string) => statusCounts.find((row) => row.status === status)?._count._all ?? 0;
    const ticketsToday = todayOrders.reduce((s, o) => s + o._count.items, 0) + todayBox.reduce((s, t) => s + t.quantity, 0);
    const revenueToday = num(todayPayments._sum.amountBdt) + todayOrders.reduce((s, o) => s + num(o.total), 0) + todayBox.reduce((s, t) => s + num(t.totalBdt), 0);
    const peak = [...byHour.entries()].sort((a, b) => b[1] - a[1])[0];

    return {
      range,
      kpis: {
        bookings: bookings.length,
        bookingsDelta: delta(bookings.length, prevCount),
        ticketsToday,
        activeMembers: members,
        membersDelta: delta(members, prevMembers),
        revenueToday,
        occupancy: overall,
        upcomingEvents: upcomingMatches + upcomingPacks,
      },
      trend: {
        labels: weeks.map((b) => b.label),
        bookings: bucketSum(weeks, counted, (b) => b.date),
        revenue: bucketSum(weeks, counted, (b) => b.date, (b) => num(b.amount)),
      },
      tickets: {
        labels: weeks.map((b) => b.label),
        online: bucketSum(weeks, orders, (item) => item.order.createdAt),
        onsite: bucketSum(weeks, boxOffice, (ticket) => ticket.createdAt, (ticket) => ticket.quantity),
      },
      status: {
        Pending: count(BookingStatus.PENDING),
        Confirmed: count(BookingStatus.CONFIRMED),
        Completed: count(BookingStatus.COMPLETED),
        Cancelled: count(BookingStatus.CANCELLED),
      },
      venues: share(venueRows, revenue),
      popular: share(types, counted.length),
      occupancy: occupancy.slice(0, 6),
      recent: recent.map((booking) => ({
        id: booking.id,
        reference: booking.qrConfirmationCode.slice(0, 8).toUpperCase(),
        customer: booking.customerName,
        venue: booking.facility.name,
        date: isoDay(booking.date),
        time: booking.timeSlotStart,
        amount: num(booking.amount),
        paymentStatus: booking.paymentStatus,
        status: booking.status,
        paid: booking.paymentStatus === PaymentStatus.PAID,
      })),
      insights: [
        ...(peak ? [{ icon: "clock", title: "Busiest start time", text: `${peak[0]}:00 · ${peak[1]} bookings this month`, to: "/calendar" }] : []),
        ...(venues[0] ? [{ icon: "trophy", title: `${venues[0].label} earns most`, text: `${pct(venues[0].amount, revenue)}% of booking revenue`, to: "/bookings?feature=online-booking" }] : []),
        { icon: "check", title: `${count(BookingStatus.PENDING)} bookings pending`, text: "waiting for approval", to: "/bookings?feature=online-booking" },
        { icon: "users", title: `${waiting} on the waiting list`, text: "offer them the next free slot", to: "/bookings?feature=waiting-list" },
      ],
    };
  }
}
