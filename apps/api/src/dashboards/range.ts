import { BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

export const RANGES = ["today", "yesterday", "week", "month", "last-month", "quarter", "year", "last6", "last12"] as const;
export type RangeKey = (typeof RANGES)[number];

/** Half-open window [from, to) plus the window of the same length just before it. */
export interface Window {
  key: RangeKey;
  from: Date;
  to: Date;
  prevFrom: Date;
  prevTo: Date;
}

const DAY = 86_400_000;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const startOfDay = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
export const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY);
const monthStart = (year: number, month: number) => new Date(Date.UTC(year, month, 1));

export function parseRange(value: string | undefined, fallback: RangeKey): RangeKey {
  if (!value) return fallback;
  if (!(RANGES as readonly string[]).includes(value)) throw new BadRequestException(`range must be one of: ${RANGES.join(", ")}`);
  return value as RangeKey;
}

export function windowFor(key: RangeKey, now = new Date()): Window {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  const shifted = (from: Date, to: Date): Window => {
    const span = to.getTime() - from.getTime();
    return { key, from, to, prevFrom: new Date(from.getTime() - span), prevTo: from };
  };
  switch (key) {
    case "today":
      return shifted(today, tomorrow);
    case "yesterday":
      return shifted(addDays(today, -1), today);
    case "week":
      return shifted(addDays(today, -6), tomorrow);
    case "month":
      return { key, from: monthStart(y, m), to: tomorrow, prevFrom: monthStart(y, m - 1), prevTo: addDays(monthStart(y, m - 1), today.getUTCDate()) };
    case "last-month":
      return { key, from: monthStart(y, m - 1), to: monthStart(y, m), prevFrom: monthStart(y, m - 2), prevTo: monthStart(y, m - 1) };
    case "quarter": {
      const q = Math.floor(m / 3) * 3;
      const from = monthStart(y, q);
      const prevFrom = monthStart(y, q - 3);
      return { key, from, to: tomorrow, prevFrom, prevTo: new Date(prevFrom.getTime() + (tomorrow.getTime() - from.getTime())) };
    }
    case "year": {
      const from = monthStart(y, 0);
      const prevFrom = monthStart(y - 1, 0);
      return { key, from, to: tomorrow, prevFrom, prevTo: new Date(Date.UTC(y - 1, m, today.getUTCDate() + 1)) };
    }
    case "last6":
    case "last12": {
      const n = key === "last6" ? 6 : 12;
      return { key, from: monthStart(y, m - n + 1), to: tomorrow, prevFrom: monthStart(y, m - 2 * n + 1), prevTo: monthStart(y, m - n + 1) };
    }
  }
}

/** Percentage change, one decimal. Null when there is nothing to compare against. */
export function delta(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function pct(part: number, whole: number): number {
  return whole ? Math.round((part / whole) * 1000) / 10 : 0;
}

export const num = (value: Prisma.Decimal | number | null | undefined) => (value instanceof Prisma.Decimal ? value.toNumber() : (value ?? 0));

export interface Bucket {
  label: string;
  from: Date;
  to: Date;
}

/** Calendar months overlapping [from, to). */
export function monthBuckets(from: Date, to: Date): Bucket[] {
  const buckets: Bucket[] = [];
  for (let cursor = monthStart(from.getUTCFullYear(), from.getUTCMonth()); cursor < to; cursor = monthStart(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1)) {
    buckets.push({ label: MONTH_LABELS[cursor.getUTCMonth()]!, from: cursor, to: monthStart(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1) });
  }
  return buckets;
}

/** Seven-day buckets from `from`, labelled W1, W2, ... */
export function weekBuckets(from: Date, to: Date): Bucket[] {
  const buckets: Bucket[] = [];
  for (let cursor = from, n = 1; cursor < to; cursor = addDays(cursor, 7), n++) {
    buckets.push({ label: `W${n}`, from: cursor, to: new Date(Math.min(addDays(cursor, 7).getTime(), to.getTime())) });
  }
  return buckets;
}

/** One bucket per day, labelled "18 Oct". */
export function dayBuckets(from: Date, to: Date): Bucket[] {
  const buckets: Bucket[] = [];
  for (let cursor = startOfDay(from); cursor < to; cursor = addDays(cursor, 1)) {
    buckets.push({ label: `${cursor.getUTCDate()} ${MONTH_LABELS[cursor.getUTCMonth()]}`, from: cursor, to: addDays(cursor, 1) });
  }
  return buckets;
}

const MIN_TREND_DAYS = 7;
const MAX_DAILY_DAYS = 31;

/** Trend buckets for a window: daily up to a month (never fewer than a week), monthly beyond that. */
export function trendBuckets(w: Window): Bucket[] {
  const days = Math.round((w.to.getTime() - w.from.getTime()) / DAY);
  if (days > MAX_DAILY_DAYS) return monthBuckets(w.from, w.to);
  return dayBuckets(days < MIN_TREND_DAYS ? addDays(w.to, -MIN_TREND_DAYS) : w.from, w.to);
}

/** Sums `value(row)` into the bucket containing `at(row)`. */
export function bucketSum<T>(buckets: Bucket[], rows: T[], at: (row: T) => Date, value: (row: NoInfer<T>) => number = () => 1): number[] {
  const totals = buckets.map(() => 0);
  for (const row of rows) {
    const time = at(row).getTime();
    const index = buckets.findIndex((bucket) => time >= bucket.from.getTime() && time < bucket.to.getTime());
    if (index >= 0) totals[index]! += value(row);
  }
  return totals;
}

export const amountOf = (row: { amountBdt: Prisma.Decimal }) => row.amountBdt.toNumber();

export const millions = (value: number) => Math.round(value / 100_000) / 10;
