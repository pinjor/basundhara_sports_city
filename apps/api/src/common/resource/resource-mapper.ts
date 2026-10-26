import { Prisma } from "@prisma/client";
import type { ResourceField } from "@bsc/shared";

export type Row = Record<string, unknown> & { id: string; status: string; reference: string };
export type Data = Record<string, unknown>;

export function toDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function isoDay(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** Converts validated input into Prisma column values. Absent keys stay absent so PATCH is partial. */
export function toColumns(fields: ResourceField[], input: Data, creating: boolean): Data {
  const data: Data = {};
  for (const field of fields) {
    const has = Object.prototype.hasOwnProperty.call(input, field.key);
    const value = input[field.key];
    if (!has || value === undefined) {
      if (creating && field.kind === "bool") data[field.key] = false;
      continue;
    }
    if (value === null || value === "") {
      data[field.key] = field.kind === "text" || field.kind === "textarea" ? "" : null;
      continue;
    }
    switch (field.kind) {
      case "date":
        data[field.key] = toDate(String(value));
        break;
      case "money":
        data[field.key] = new Prisma.Decimal(Number(value).toFixed(2));
        break;
      case "number":
        data[field.key] = field.integer === false ? new Prisma.Decimal(String(value)) : Number(value);
        break;
      default:
        data[field.key] = value;
    }
  }
  return data;
}

/** Shapes a row for the API: decimals as numbers, date-only columns as YYYY-MM-DD. */
export function present(fields: ResourceField[], row: Data): Data {
  const kinds = new Map(fields.map((field) => [field.key, field.kind]));
  const out: Data = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Prisma.Decimal) out[key] = value.toNumber();
    else if (value instanceof Date) out[key] = kinds.get(key) === "date" ? isoDay(value) : value.toISOString();
    else out[key] = value;
  }
  return out;
}

export function money(value: unknown): number {
  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

export function decimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}
