import { ConflictException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { BookingStatus } from "@bsc/shared";

const DAY_MS = 86_400_000;
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LIVE = [BookingStatus.PENDING, BookingStatus.CONFIRMED];

export function minutes(hhmm: string): number {
  return Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
}

/** True when two same-day windows overlap once each is padded by `buffer` minutes. */
export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string, buffer = 0): boolean {
  return minutes(aStart) - buffer < minutes(bEnd) && minutes(bStart) < minutes(aEnd) + buffer;
}

export function weekdayOf(date: Date): string {
  return WEEKDAY_NAMES[date.getUTCDay()]!;
}

/** True when a rule's day ("Daily" or a weekday name) covers `date`. */
export function coversDay(dayOfWeek: string, date: Date): boolean {
  return dayOfWeek === "Daily" || dayOfWeek === weekdayOf(date);
}

/** Dates from `start` to `end` inclusive, stepping weekly, fortnightly or monthly. */
export function occurrences(start: Date, end: Date, frequency: string): Date[] {
  const dates: Date[] = [];
  for (let step = 0; ; step++) {
    const next =
      frequency === "Monthly"
        ? new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + step, start.getUTCDate()))
        : new Date(start.getTime() + step * (frequency === "Fortnightly" ? 14 : 7) * DAY_MS);
    if (next > end) return dates;
    dates.push(next);
  }
}

export function dayWindow(date: Date): { gte: Date; lt: Date } {
  const gte = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return { gte, lt: new Date(gte.getTime() + DAY_MS) };
}

export interface SlotRequest {
  facilityId: string;
  date: Date;
  start: string;
  end: string;
  excludeId?: string;
}

/** The live booking that clashes with a request, honouring the facility's setup buffer. */
export async function findClash(db: Prisma.TransactionClient, request: SlotRequest) {
  const [facility, sameDay] = await Promise.all([
    db.facility.findUnique({ where: { id: request.facilityId }, select: { bufferMinutes: true } }),
    db.booking.findMany({
      where: {
        facilityId: request.facilityId,
        date: dayWindow(request.date),
        status: { in: LIVE },
        ...(request.excludeId ? { id: { not: request.excludeId } } : {}),
      },
      select: { id: true, customerName: true, timeSlotStart: true, timeSlotEnd: true },
    }),
  ]);
  const buffer = facility?.bufferMinutes ?? 0;
  return sameDay.find((booking) => overlaps(request.start, request.end, booking.timeSlotStart, booking.timeSlotEnd, buffer)) ?? null;
}

export async function assertNoClash(db: Prisma.TransactionClient, request: SlotRequest): Promise<void> {
  if (minutes(request.end) <= minutes(request.start)) throw new ConflictException("The slot must end after it starts");
  const clash = await findClash(db, request);
  if (clash) {
    throw new ConflictException(
      `Clashes with ${clash.customerName} (${clash.timeSlotStart}-${clash.timeSlotEnd}) once setup time is allowed for`,
    );
  }
}
