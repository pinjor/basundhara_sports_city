import type { ReportColumn, ReportResult } from "@bsc/shared";
import { dateRange } from "./pagination";

export type ReportRow = ReportResult["rows"][number];

export function report(title: string, columns: ReportColumn[], rows: ReportRow[], summary: ReportResult["summary"] = []): ReportResult {
  return { title, columns, rows, summary };
}

export const col = (key: string, label: string, kind: ReportColumn["kind"] = "text"): ReportColumn => ({ key, label, kind });

export function sum<T>(items: T[], pick: (item: T) => number): number {
  return Math.round(items.reduce((total, item) => total + pick(item), 0) * 100) / 100;
}

export const percent = (part: number, whole: number) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);

export function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

/** `from`/`to` query params as a Prisma date filter, or undefined for all time. */
export const queryRange = dateRange;

export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

export function startOfToday(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}
