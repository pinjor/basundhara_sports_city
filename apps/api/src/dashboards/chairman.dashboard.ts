import { Injectable } from "@nestjs/common";
import { AccessResult, BookingStatus, FacilityStatus, FacilityType, MemberStatus, Role } from "@bsc/shared";
import { minutes } from "../bookings/booking-time";
import { isoDay } from "../common/resource/resource-mapper";
import { PrismaService } from "../prisma/prisma.service";
import { addDays, amountOf, bucketSum, delta, millions, monthBuckets, num, pct, startOfDay, windowFor } from "./range";
import { STREAM_LABELS } from "./revenue.dashboard";

const UTILISATION_DAYS = 30;
const LIST = 6;
const MONTHS_PER_QUARTER = 3;
const STADIUM_TYPES = new Set<string>([FacilityType.STADIUM, FacilityType.CRICKET_GROUND, FacilityType.EVENT_HALL]);

const quarters = (labels: string[], values: number[]) => {
  const out = { labels: [] as string[], values: [] as number[] };
  for (let i = 0; i < values.length; i += MONTHS_PER_QUARTER) {
    out.labels.push(`${labels[i]}–${labels[Math.min(i + MONTHS_PER_QUARTER, values.length) - 1]}`);
    out.values.push(Math.round(values.slice(i, i + MONTHS_PER_QUARTER).reduce((a, b) => a + b, 0) * 10) / 10);
  }
  return out;
};

/** Whole-city overview for the chairman: money, people, venues, events and projects. */
@Injectable()
export class ChairmanDashboard {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);
    const ytd = windowFor("year", now);
    const last12 = windowFor("last12", now);
    const inYtd = { gte: ytd.from, lt: ytd.to };
    const inPrev = { gte: ytd.prevFrom, lt: ytd.prevTo };

    const [revenue, prevRevenue, expenses, prevExpenses, payroll, prevPayroll, access, prevAccess, tickets, prevTickets, packsYtd, matchesYtd, prevEvents, members, prevMembers] = await Promise.all([
      this.prisma.revenueEntry.findMany({ where: { status: "POSTED", receivedOn: { gte: last12.from, lt: last12.to } }, select: { stream: true, receivedOn: true, amountBdt: true } }),
      this.prisma.revenueEntry.aggregate({ where: { status: "POSTED", receivedOn: inPrev }, _sum: { amountBdt: true } }),
      this.prisma.expense.aggregate({ where: { status: "PAID", spentOn: inYtd }, _sum: { amountBdt: true } }),
      this.prisma.expense.aggregate({ where: { status: "PAID", spentOn: inPrev }, _sum: { amountBdt: true } }),
      this.prisma.payrollRun.aggregate({ where: { status: "POSTED", payDate: inYtd }, _sum: { grossBdt: true } }),
      this.prisma.payrollRun.aggregate({ where: { status: "POSTED", payDate: inPrev }, _sum: { grossBdt: true } }),
      this.prisma.accessLogEntry.findMany({ where: { result: AccessResult.APPROVED, timestamp: { gte: last12.from } }, select: { timestamp: true } }),
      this.prisma.accessLogEntry.count({ where: { result: AccessResult.APPROVED, timestamp: inPrev } }),
      this.prisma.ticketOrderItem.findMany({ where: { order: { status: "CONFIRMED", createdAt: { gte: last12.from } } }, select: { order: { select: { createdAt: true } } } }),
      this.prisma.ticketOrderItem.count({ where: { order: { status: "CONFIRMED", createdAt: inPrev } } }),
      this.prisma.eventPack.count({ where: { booking: { date: inYtd } } }),
      this.prisma.matchEvent.count({ where: { startsAt: inYtd } }),
      this.prisma.eventPack.count({ where: { booking: { date: inPrev } } }),
      this.prisma.member.count({ where: { status: MemberStatus.ACTIVE } }),
      this.prisma.member.count({ where: { status: MemberStatus.ACTIVE, createdAt: { lt: ytd.from } } }),
    ]);

    const [schedule, upcoming, facilities, utilisation, notes, projects, zones] = await Promise.all([
      this.schedule(today, tomorrow, now),
      this.upcomingEvents(today),
      this.prisma.facility.findMany({ select: { id: true, name: true, type: true, status: true, capacity: true, operatingHoursStart: true, operatingHoursEnd: true }, orderBy: { name: "asc" } }),
      this.prisma.booking.findMany({ where: { date: { gte: addDays(today, -UTILISATION_DAYS), lt: addDays(today, UTILISATION_DAYS) }, status: { not: BookingStatus.CANCELLED } }, select: { facilityId: true, timeSlotStart: true, timeSlotEnd: true } }),
      this.prisma.notification.findMany({ where: { OR: [{ role: null }, { role: Role.CHAIRMAN }] }, orderBy: { createdAt: "desc" }, take: 4 }),
      this.prisma.project.findMany({ where: { status: { not: "COMPLETED" } }, orderBy: { dueOn: "asc" } }),
      this.prisma.zone.aggregate({ _count: { _all: true }, _sum: { capacity: true, liveOccupancy: true } }),
    ]);

    const months = monthBuckets(last12.from, last12.to);
    const monthly = bucketSum(months, revenue, (row) => row.receivedOn, amountOf).map(millions);
    const ytdRows = revenue.filter((row) => row.receivedOn >= ytd.from);
    const revenueYtd = ytdRows.reduce((sum, row) => sum + amountOf(row), 0);
    const cost = num(expenses._sum.amountBdt) + num(payroll._sum.grossBdt);
    const prevCost = num(prevExpenses._sum.amountBdt) + num(prevPayroll._sum.grossBdt);
    const visitorMonths = bucketSum(months, access, (row) => row.timestamp).map((n, i) => n + bucketSum(months, tickets, (row) => row.order.createdAt)[i]!);
    const visitorsYtd = access.filter((row) => row.timestamp >= ytd.from).length + tickets.filter((row) => row.order.createdAt >= ytd.from).length;

    const byStream = new Map<string, number>();
    for (const row of ytdRows) byStream.set(row.stream, (byStream.get(row.stream) ?? 0) + amountOf(row));
    const segments = [...byStream.entries()].map(([stream, value]) => ({ label: STREAM_LABELS[stream] ?? stream, amount: value, pct: pct(value, revenueYtd) })).sort((a, b) => b.amount - a.amount);

    const used = new Map<string, number>();
    for (const booking of utilisation) used.set(booking.facilityId, (used.get(booking.facilityId) ?? 0) + minutes(booking.timeSlotEnd) - minutes(booking.timeSlotStart));
    const byType = new Map<string, { used: number; open: number }>();
    for (const facility of facilities) {
      const entry = byType.get(facility.type) ?? { used: 0, open: 0 };
      entry.used += used.get(facility.id) ?? 0;
      entry.open += (minutes(facility.operatingHoursEnd) - minutes(facility.operatingHoursStart)) * UTILISATION_DAYS * 2;
      byType.set(facility.type, entry);
    }
    const utilization = [...byType.entries()].map(([type, v]) => ({ type, pct: pct(v.used, v.open) })).sort((a, b) => b.pct - a.pct).slice(0, 7);
    const occupancy = pct([...byType.values()].reduce((s, v) => s + v.used, 0), [...byType.values()].reduce((s, v) => s + v.open, 0));
    const venues = new Map<string, { type: string; count: number; available: number; inUse: number; maintenance: number; capacity: number }>();
    for (const facility of facilities) {
      const v = venues.get(facility.type) ?? { type: facility.type, count: 0, available: 0, inUse: 0, maintenance: 0, capacity: 0 };
      v.count += 1;
      v.capacity += facility.capacity;
      if (facility.status === FacilityStatus.AVAILABLE) v.available += 1;
      else if (facility.status === FacilityStatus.MAINTENANCE) v.maintenance += 1;
      else v.inUse += 1;
      venues.set(facility.type, v);
    }
    const best = monthly.reduce((top, value, i) => (value > (monthly[top] ?? 0) ? i : top), 0);

    return {
      kpis: {
        visitors: visitorsYtd,
        visitorsDelta: delta(visitorsYtd, prevAccess + prevTickets),
        events: packsYtd + matchesYtd,
        eventsDelta: delta(packsYtd + matchesYtd, prevEvents),
        revenue: revenueYtd,
        revenueDelta: delta(revenueYtd, num(prevRevenue._sum.amountBdt)),
        cost,
        costDelta: delta(cost, prevCost),
        surplus: revenueYtd - cost,
        surplusDelta: delta(revenueYtd - cost, num(prevRevenue._sum.amountBdt) - prevCost),
        occupancy,
        members,
        membersDelta: delta(members, prevMembers),
      },
      campus: {
        facilities: facilities.length,
        zones: zones._count._all,
        stadiums: facilities.filter((f) => STADIUM_TYPES.has(f.type)).length,
        capacity: zones._sum.capacity ?? 0,
        onSite: zones._sum.liveOccupancy ?? 0,
      },
      venues: [...venues.values()].sort((a, b) => b.capacity - a.capacity),
      schedule,
      events: upcoming,
      revenue: { monthly: { labels: months.map((m) => m.label), values: monthly }, quarterly: quarters(months.map((m) => m.label), monthly) },
      visitors: { monthly: { labels: months.map((m) => m.label), values: visitorMonths }, quarterly: quarters(months.map((m) => m.label), visitorMonths) },
      utilization,
      segments,
      highlights: notes.map((note) => ({ id: note.id, title: note.title, body: note.body, href: note.href, at: note.createdAt.toISOString() })),
      projects: projects.map((project) => ({ id: project.id, reference: project.reference, name: project.name, owner: project.owner, budget: num(project.budgetBdt), progress: project.progress, dueOn: isoDay(project.dueOn), status: project.status })),
      maintenance: facilities.slice(0, LIST * 2).map((facility) => ({ id: facility.id, name: facility.name, status: facility.status })),
      finance: { revenue: revenueYtd, cost, surplus: revenueYtd - cost, topSegment: segments[0] ?? null, bestMonth: months[best] ? { label: months[best]!.label, year: months[best]!.from.getUTCFullYear(), amount: monthly[best] } : null },
    };
  }

  private async schedule(today: Date, tomorrow: Date, now: Date) {
    const [bookings, sessions, matches] = await Promise.all([
      this.prisma.booking.findMany({ where: { date: { gte: today, lt: tomorrow }, status: { not: BookingStatus.CANCELLED } }, include: { facility: { select: { name: true, type: true } } } }),
      this.prisma.coachSession.findMany({ where: { sessionDate: { gte: today, lt: tomorrow }, status: { not: "CANCELLED" } }, include: { coach: { select: { name: true, sport: true } }, facility: { select: { name: true } } } }),
      this.prisma.matchEvent.findMany({ where: { startsAt: { gte: today, lt: tomorrow } } }),
    ]);
    const clock = now.getUTCHours() * 60 + now.getUTCMinutes();
    const state = (start: string, end: string) => (clock >= minutes(end) ? "Done" : clock >= minutes(start) ? "Ongoing" : "Upcoming");
    return [
      ...bookings.map((b) => ({ id: b.id, start: b.timeSlotStart, end: b.timeSlotEnd, title: `${b.type} booking`, venue: b.facility.name, kind: b.facility.type, lead: b.customerName, state: state(b.timeSlotStart, b.timeSlotEnd) })),
      ...sessions.map((s) => ({ id: s.id, start: s.timeSlotStart, end: s.timeSlotEnd, title: `${s.coach.sport} coaching`, venue: s.facility.name, kind: s.coach.sport, lead: s.coach.name, state: state(s.timeSlotStart, s.timeSlotEnd) })),
      ...matches.map((m) => {
        const start = m.startsAt.toISOString().slice(11, 16);
        const end = new Date(m.startsAt.getTime() + 2 * 3_600_000).toISOString().slice(11, 16);
        return { id: m.id, start, end, title: m.title, venue: m.venueName, kind: m.sport, lead: "Match day", state: state(start, end) };
      }),
    ].sort((a, b) => a.start.localeCompare(b.start));
  }

  private async upcomingEvents(today: Date) {
    const [packs, matches] = await Promise.all([
      this.prisma.eventPack.findMany({ where: { booking: { date: { gte: today } } }, include: { booking: { select: { date: true, timeSlotStart: true, facility: { select: { name: true } } } } }, orderBy: { booking: { date: "asc" } }, take: LIST }),
      this.prisma.matchEvent.findMany({ where: { startsAt: { gte: today } }, include: { _count: { select: { orders: { where: { status: "CONFIRMED" } } } } }, orderBy: { startsAt: "asc" }, take: LIST }),
    ]);
    return [
      ...packs.map((pack) => ({ id: pack.id, kind: "pack" as const, title: pack.title, date: isoDay(pack.booking.date), venue: pack.booking.facility.name, audience: `${pack.expectedCount.toLocaleString("en-IN")} expected`, approvalStatus: pack.approvalStatus })),
      ...matches.map((match) => ({ id: match.id, kind: "match" as const, title: match.title, date: isoDay(match.startsAt), venue: match.venueName, audience: `${match._count.orders} orders`, approvalStatus: "Approved" })),
    ].sort((a, b) => a.date.localeCompare(b.date));
  }
}
