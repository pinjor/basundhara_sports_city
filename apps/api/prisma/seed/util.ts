import { Prisma, type PrismaClient } from "@prisma/client";

export type Db = PrismaClient | Prisma.TransactionClient;

/** Same numbering as the API's ReferenceService, so seeded and live records share one sequence. */
export async function nextRef(db: Db, prefix: string, year = new Date().getUTCFullYear()): Promise<string> {
  const key = `${prefix}-${year}`;
  const row = await db.sequence.upsert({ where: { key }, create: { key, value: 1 }, update: { value: { increment: 1 } } });
  return `${key}-${String(row.value).padStart(4, "0")}`;
}

/** `count` consecutive references for bulk inserts. */
export async function refBlock(db: Db, prefix: string, count: number, year = new Date().getUTCFullYear()): Promise<string[]> {
  const key = `${prefix}-${year}`;
  const row = await db.sequence.upsert({ where: { key }, create: { key, value: count }, update: { value: { increment: count } } });
  const first = row.value - count + 1;
  return Array.from({ length: count }, (_, index) => `${key}-${String(first + index).padStart(4, "0")}`);
}

/** Deterministic pseudo-random numbers so re-seeding an empty DB gives the same data. */
export function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

export const bdt = (value: number) => new Prisma.Decimal(value.toFixed(2));

export function day(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Date `offset` days from today (UTC midnight). */
export function daysFromToday(offset: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
}

interface Creatable {
  count(args?: object): Promise<number>;
  create(args: { data: object }): Promise<{ id: string }>;
}

/**
 * Inserts rows only when the table is empty, assigning references from the shared sequence.
 * Returns created ids in input order (or [] when the table already had data).
 */
export async function seedTable<T extends object>(db: Db, model: string, prefix: string, rows: T[], createdById?: string): Promise<string[]> {
  const delegate = (db as unknown as Record<string, Creatable>)[model]!;
  if ((await delegate.count()) > 0) return [];
  const ids: string[] = [];
  for (const row of rows) {
    const created = await delegate.create({ data: { ...row, reference: await nextRef(db, prefix), createdById } });
    ids.push(created.id);
  }
  return ids;
}
