import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { PreferencesDto } from "./settings.dto";

export const DEFAULT_PREFERENCES = { email: true, desktop: true, sound: false, digest: true, compact: false };

export type Preferences = typeof DEFAULT_PREFERENCES;

/** Per-user dashboard and notification preferences. Missing keys fall back to defaults. */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<Preferences> {
    const row = await this.prisma.userPreference.findUnique({ where: { userId } });
    return { ...DEFAULT_PREFERENCES, ...((row?.data as Partial<Preferences> | undefined) ?? {}) };
  }

  async save(userId: string, changes: PreferencesDto): Promise<Preferences> {
    const next = { ...(await this.get(userId)), ...changes };
    const data = next as Prisma.InputJsonObject;
    await this.prisma.userPreference.upsert({ where: { userId }, create: { userId, data }, update: { data } });
    return next;
  }
}
