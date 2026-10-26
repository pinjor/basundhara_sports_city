import { Controller, Get, Inject, UseGuards, type Type } from "@nestjs/common";
import { ENTITIES, entityDef, type Role } from "@bsc/shared";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { PrismaService } from "../../prisma/prisma.service";
import { EXTERNAL_REFS } from "./external-refs";
import { delegateOf } from "./resource.service";

const LOOKUP_SIZE = 200;

export interface LookupOption {
  value: string;
  label: string;
}

const detailText = (value: unknown) => (value instanceof Date ? value.toISOString().slice(0, 10) : value == null ? "" : String(value));

/** External models picked in registry forms, with the roles of every register that picks them. */
function lookupTargets(): Map<string, Set<Role>> {
  const targets = new Map<string, Set<Role>>();
  for (const entity of ENTITIES) {
    for (const field of entity.fields) {
      if (field.kind !== "ref" || !field.ref || entityDef(field.ref) || !EXTERNAL_REFS[field.ref]) continue;
      const roles = targets.get(field.ref) ?? new Set<Role>();
      entity.writeRoles.forEach((role) => roles.add(role));
      targets.set(field.ref, roles);
    }
  }
  return targets;
}

/** `GET /lookups/<ref>`: id + label options for one external model. */
function createLookupController(ref: string, roles: Role[]): Type<unknown> {
  const { title, detail, sort } = EXTERNAL_REFS[ref]!;
  const orderBy = sort ? { [sort]: "asc" } : { createdAt: "desc" };

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...roles)
  @Controller(`lookups/${ref}`)
  class LookupController {
    constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

    @Get()
    async list(): Promise<LookupOption[]> {
      const rows = await delegateOf(this.prisma, ref).findMany({
        select: { id: true, [title]: true, ...(detail ? { [detail]: true } : {}) },
        orderBy,
        take: LOOKUP_SIZE,
      });
      return rows.map((row) => {
        const extra = detail ? detailText(row[detail]) : "";
        return { value: String(row.id), label: extra ? `${String(row[title])} · ${extra}` : String(row[title]) };
      });
    }
  }

  Object.defineProperty(LookupController, "name", { value: `${ref[0]!.toUpperCase()}${ref.slice(1)}LookupController` });
  return LookupController;
}

export function lookupControllers(): Type<unknown>[] {
  return [...lookupTargets()].map(([ref, roles]) => createLookupController(ref, [...roles]));
}
