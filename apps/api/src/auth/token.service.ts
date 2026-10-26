import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { accessTtlSeconds, refreshTtlDays } from "../config/env";

export type SubjectType = "staff" | "customer";

export interface Subject {
  type: SubjectType;
  id: string;
  /** Extra claims for the access token (staff carry email and role). */
  claims?: Record<string, unknown>;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Access-token lifetime in seconds. */
  expiresIn: number;
  tokenType: "Bearer";
}

const hash = (raw: string) => createHash("sha256").update(raw).digest("hex");

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async issue(subject: Subject, userAgent?: string): Promise<TokenPair> {
    return (await this.mint(subject, randomUUID(), userAgent)).pair;
  }

  private async mint(subject: Subject, familyId: string, userAgent?: string): Promise<{ id: string; pair: TokenPair }> {
    const refreshToken = randomBytes(48).toString("base64url");
    const row = await this.prisma.refreshToken.create({
      data: {
        subjectType: subject.type,
        subjectId: subject.id,
        familyId,
        tokenHash: hash(refreshToken),
        expiresAt: new Date(Date.now() + refreshTtlDays() * 86_400_000),
        userAgent: userAgent?.slice(0, 200),
      },
    });
    const expiresIn = accessTtlSeconds();
    const accessToken = await this.jwt.signAsync({ ...subject.claims, sub: subject.id, typ: subject.type }, { expiresIn });
    return { id: row.id, pair: { accessToken, refreshToken, expiresIn, tokenType: "Bearer" } };
  }

  /**
   * Swaps a refresh token for a new pair. A token that was already rotated is treated as stolen:
   * the whole family is revoked and the caller must sign in again.
   */
  async rotate(raw: string, type: SubjectType, load: (id: string) => Promise<Subject | null>, userAgent?: string): Promise<TokenPair> {
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash(raw) } });
    if (!stored || stored.subjectType !== type) throw new UnauthorizedException("Invalid refresh token");
    if (stored.revokedAt) {
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException("Refresh token already used. Sign in again.");
    }
    if (stored.expiresAt.getTime() <= Date.now()) throw new UnauthorizedException("Refresh token expired. Sign in again.");
    const subject = await load(stored.subjectId);
    if (!subject) {
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException("Account is inactive or no longer exists");
    }
    const claimed = await this.prisma.refreshToken.updateMany({ where: { id: stored.id, revokedAt: null }, data: { revokedAt: new Date() } });
    if (claimed.count === 0) {
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException("Refresh token already used. Sign in again.");
    }
    const next = await this.mint(subject, stored.familyId, userAgent);
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { replacedById: next.id } });
    return next.pair;
  }

  /** Signs out one device. Unknown tokens are ignored so logout is always safe to call. */
  async revoke(raw: string, type: SubjectType, subjectId?: string): Promise<void> {
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash(raw) } });
    if (!stored || stored.subjectType !== type || (subjectId && stored.subjectId !== subjectId)) return;
    await this.revokeFamily(stored.familyId);
  }

  /** Signs out every device, e.g. after a password change. */
  async revokeAll(type: SubjectType, subjectId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({ where: { subjectType: type, subjectId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  private async revokeFamily(familyId: string) {
    await this.prisma.refreshToken.updateMany({ where: { familyId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
}
