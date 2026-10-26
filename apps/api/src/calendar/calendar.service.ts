import { BadRequestException, Injectable } from "@nestjs/common";
import { BookingStatus } from "@bsc/shared";
import { isoDay, toDate } from "../common/resource/resource-mapper";
import { PrismaService } from "../prisma/prisma.service";

const MAX_DAYS = 62;
const DAY_MS = 86_400_000;

export type CalendarKind = "booking" | "match" | "coaching" | "shift";

export interface CalendarItem {
  id: string;
  kind: CalendarKind;
  title: string;
  date: string;
  start: string;
  end: string;
  where: string;
  status: string;
  href: string;
}

const hhmm = (value: Date) => value.toISOString().slice(11, 16);

/** One timeline across facility bookings, match days, coaching sessions and staff shifts. */
@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  private window(from?: string, to?: string) {
    const today = isoDay(new Date());
    const start = toDate(from ?? today);
    const end = toDate(to ?? from ?? today);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new BadRequestException("from and to must be YYYY-MM-DD");
    if (end < start) throw new BadRequestException("to must be on or after from");
    if ((end.getTime() - start.getTime()) / DAY_MS > MAX_DAYS) throw new BadRequestException(`Keep the range to ${MAX_DAYS} days or fewer`);
    return { gte: start, lt: new Date(end.getTime() + DAY_MS) };
  }

  async items(from?: string, to?: string): Promise<CalendarItem[]> {
    const range = this.window(from, to);
    const [bookings, matches, sessions, shifts] = await Promise.all([
      this.prisma.booking.findMany({
        where: { date: range, status: { not: BookingStatus.CANCELLED } },
        include: { facility: { select: { name: true } } },
      }),
      this.prisma.matchEvent.findMany({ where: { startsAt: range } }),
      this.prisma.coachSession.findMany({
        where: { sessionDate: range, status: { not: "CANCELLED" } },
        include: { coach: { select: { name: true } }, facility: { select: { name: true } } },
      }),
      this.prisma.shift.groupBy({
        by: ["workDate", "name", "startsAt", "endsAt", "location"],
        where: { workDate: range, status: { not: "CANCELLED" } },
        _count: { _all: true },
      }),
    ]);

    const items: CalendarItem[] = [
      ...bookings.map((booking) => ({
        id: booking.id,
        kind: "booking" as const,
        title: `${booking.customerName} · ${booking.type}`,
        date: isoDay(booking.date),
        start: booking.timeSlotStart,
        end: booking.timeSlotEnd,
        where: booking.facility.name,
        status: booking.status,
        href: `/bookings?booking=${booking.id}`,
      })),
      ...matches.map((match) => ({
        id: match.id,
        kind: "match" as const,
        title: match.title,
        date: isoDay(match.startsAt),
        start: hhmm(match.doorsAt),
        end: hhmm(new Date(match.startsAt.getTime() + 2 * 3_600_000)),
        where: match.venueName,
        status: match.salesStatus,
        href: `/ticketing/events/${match.id}`,
      })),
      ...sessions.map((session) => ({
        id: session.id,
        kind: "coaching" as const,
        title: `${session.coach.name} with ${session.customerName}`,
        date: isoDay(session.sessionDate),
        start: session.timeSlotStart,
        end: session.timeSlotEnd,
        where: session.facility.name,
        status: session.status,
        href: "/bookings?feature=coach-booking",
      })),
      ...shifts.map((shift) => ({
        id: `${isoDay(shift.workDate)}:${shift.name}:${shift.startsAt}:${shift.location}`,
        kind: "shift" as const,
        title: `${shift.name} · ${shift._count._all} staff`,
        date: isoDay(shift.workDate),
        start: shift.startsAt,
        end: shift.endsAt,
        where: shift.location || "Sports City",
        status: "SCHEDULED",
        href: "/hrm?feature=shift-scheduling",
      })),
    ];
    return items.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  }
}
