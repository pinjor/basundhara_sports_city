import { Injectable } from "@nestjs/common";
import { entityDef } from "@bsc/shared";
import { AuditService } from "../../audit/audit.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ReferenceService } from "../reference.service";
import { ResourceHookRegistry } from "./resource-hooks";
import { ResourceService } from "./resource.service";

/** One generic service per registry entity, created on first use so domain hooks are registered by then. */
@Injectable()
export class ResourceRegistry {
  private readonly services = new Map<string, ResourceService>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly references: ReferenceService,
    private readonly hooks: ResourceHookRegistry,
  ) {}

  get(entityKey: string): ResourceService {
    const cached = this.services.get(entityKey);
    if (cached) return cached;
    const entity = entityDef(entityKey);
    if (!entity) throw new Error(`Unknown entity "${entityKey}"`);
    const service = new ResourceService(entity, this.prisma, this.audit, this.references, this.hooks.for(entityKey));
    this.services.set(entityKey, service);
    return service;
  }
}
