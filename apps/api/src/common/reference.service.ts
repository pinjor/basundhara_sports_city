import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReferenceService {
  constructor(private readonly prisma: PrismaService) {}

  /** Next human reference for a prefix and year, e.g. INV-2026-0042. Safe inside a transaction. */
  async next(prefix: string, tx: Prisma.TransactionClient = this.prisma): Promise<string> {
    const year = new Date().getUTCFullYear();
    const key = `${prefix}-${year}`;
    const row = await tx.sequence.upsert({
      where: { key },
      create: { key, value: 1 },
      update: { value: { increment: 1 } },
    });
    return `${key}-${String(row.value).padStart(4, "0")}`;
  }

  /** `count` consecutive references in one round trip, for bulk inserts. */
  async block(prefix: string, count: number, tx: Prisma.TransactionClient = this.prisma): Promise<string[]> {
    if (count <= 0) return [];
    const year = new Date().getUTCFullYear();
    const key = `${prefix}-${year}`;
    const row = await tx.sequence.upsert({
      where: { key },
      create: { key, value: count },
      update: { value: { increment: count } },
    });
    const first = row.value - count + 1;
    return Array.from({ length: count }, (_, index) => `${key}-${String(first + index).padStart(4, "0")}`);
  }
}
