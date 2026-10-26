export const DEFAULT_TAKE = 50;
export const MAX_TAKE = 200;

export interface PageWindow {
  skip: number;
  take: number;
}

function toInt(value: unknown, fallback: number): number {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function pageWindow(query: Record<string, unknown>): PageWindow {
  const skip = Math.max(0, toInt(query.skip, 0));
  const take = Math.min(MAX_TAKE, Math.max(1, toInt(query.take, DEFAULT_TAKE)));
  return { skip, take };
}

/** Inclusive date range on a column from `from` / `to` (YYYY-MM-DD). */
export function dateRange(query: Record<string, unknown>): { gte?: Date; lt?: Date } | undefined {
  const from = typeof query.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.from) ? new Date(`${query.from}T00:00:00.000Z`) : undefined;
  const to = typeof query.to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.to) ? new Date(`${query.to}T00:00:00.000Z`) : undefined;
  if (!from && !to) return undefined;
  const range: { gte?: Date; lt?: Date } = {};
  if (from) range.gte = from;
  if (to) range.lt = new Date(to.getTime() + 86_400_000);
  return range;
}
