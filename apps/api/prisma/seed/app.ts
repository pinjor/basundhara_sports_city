import "reflect-metadata";
import { Logger, type Type } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { PrismaClient } from "@prisma/client";
import { AppModule } from "../../src/app.module";
import type { RequestUser } from "../../src/auth/current-user.decorator";
import { ResourceRegistry } from "../../src/common/resource/resource.registry";
import type { Data } from "../../src/common/resource/resource-mapper";

/**
 * Domain seeds create records through the same services the API uses, so seeded documents
 * carry real references, journal postings and audit entries.
 */
export interface Seeder {
  prisma: PrismaClient;
  actor(email: string): Promise<RequestUser>;
  /** Creates a record, then walks it through `moves` (workflow statuses, in order). */
  record(entityKey: string, actor: RequestUser, input: Data, moves?: string[]): Promise<Data & { id: string }>;
  /** Moves an existing record (e.g. one raised by another document's hook). */
  move(entityKey: string, id: string, status: string, actor: RequestUser): Promise<Data>;
  /** A Nest provider, for seeding through non-registry services (e.g. ticket orders). */
  service<T>(type: Type<T>): T;
  /** True when the entity's table has no rows yet. */
  empty(entityKey: string): Promise<boolean>;
}

export async function withSeeder(prisma: PrismaClient, run: (seeder: Seeder) => Promise<void>): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn"] });
  try {
    const registry = app.get(ResourceRegistry);
    const actors = new Map<string, RequestUser>();
    const seeder: Seeder = {
      prisma,
      async actor(email) {
        const cached = actors.get(email);
        if (cached) return cached;
        const user = await prisma.user.findUniqueOrThrow({ where: { email } });
        const actor = { id: user.id, name: user.name, email: user.email, role: user.role };
        actors.set(email, actor);
        return actor;
      },
      async record(entityKey, actor, input, moves = []) {
        const service = registry.get(entityKey);
        let row = (await service.create(input, actor)) as Data & { id: string };
        for (const status of moves) row = (await service.transition(row.id, status, actor)) as Data & { id: string };
        return row;
      },
      service: (type) => app.get(type),
      move(entityKey, id, status, actor) {
        return registry.get(entityKey).transition(id, status, actor);
      },
      async empty(entityKey) {
        const model = registry.get(entityKey).entity.model;
        const delegate = (prisma as unknown as Record<string, { count(): Promise<number> }>)[model]!;
        return (await delegate.count()) === 0;
      },
    };
    await run(seeder);
  } finally {
    await app.close();
    Logger.flush();
  }
}
