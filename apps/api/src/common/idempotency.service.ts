import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createHash } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

export interface IdempotentResult<T> {
  body: T;
  replayed: boolean;
}

/**
 * Runs a money-moving request once per `Idempotency-Key`. A retry with the same key and body gets the
 * stored response; the same key with a different body is a conflict. Failures are not stored, so a
 * declined payment can be retried with the same key.
 */
@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(scope: string, key: string | undefined, payload: unknown, work: () => Promise<T>): Promise<IdempotentResult<T>> {
    if (!key?.trim()) throw new BadRequestException("Idempotency-Key header is required");
    const requestHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    const existing = await this.prisma.idempotencyRecord.findUnique({ where: { key } });
    if (existing) {
      if (existing.scope !== scope || existing.requestHash !== requestHash) throw new ConflictException("IDEMPOTENCY_CONFLICT");
      return { body: existing.body as T, replayed: true };
    }
    const body = await work();
    try {
      await this.prisma.idempotencyRecord.create({
        data: { key, scope, requestHash, statusCode: 200, body: JSON.parse(JSON.stringify(body ?? null)) },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
      const raced = await this.prisma.idempotencyRecord.findUnique({ where: { key } });
      if (raced && raced.requestHash === requestHash) return { body: raced.body as T, replayed: true };
      throw new ConflictException("IDEMPOTENCY_CONFLICT");
    }
    return { body, replayed: false };
  }
}
