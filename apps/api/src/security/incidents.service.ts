import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Role, WORKFLOWS } from "@bsc/shared";
import { AuditService } from "../audit/audit.service";
import type { RequestUser } from "../auth/current-user.decorator";
import { NotificationService } from "../common/notification.service";
import { assertTransition } from "../common/workflow";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateIncidentDto, UpdateIncidentDto } from "./incidents.dto";

const ENTITY = "OpsIncident";
const include = { eventPack: { select: { id: true, title: true } } } as const;

/** Operational incidents: logged by security, worked to resolution, every change audited. */
@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
  ) {}

  list(status?: string) {
    return this.prisma.opsIncident.findMany({ where: { status }, include, orderBy: { createdAt: "desc" } });
  }

  private async find(id: string) {
    const incident = await this.prisma.opsIncident.findUnique({ where: { id } });
    if (!incident) throw new NotFoundException("Incident not found");
    return incident;
  }

  async create(dto: CreateIncidentDto, user: RequestUser) {
    const incident = await this.prisma.opsIncident.create({
      data: { title: dto.title.trim(), severity: dto.severity, notes: dto.notes ?? null, eventPackId: dto.eventPackId ?? null, status: WORKFLOWS.incident.initial },
      include,
    });
    await this.audit.record({ entityType: ENTITY, entityId: incident.id, action: "create", userId: user.id, after: incident });
    if (dto.severity === "Critical") {
      await this.notifications.notify({ title: "Critical incident logged", body: incident.title, href: "/security#incidents", role: Role.SECURITY_MANAGER });
    }
    return incident;
  }

  async update(id: string, dto: UpdateIncidentDto, user: RequestUser) {
    const before = await this.find(id);
    if (before.status === "Resolved") throw new BadRequestException("Resolved incidents can no longer be edited");
    const incident = await this.prisma.opsIncident.update({ where: { id }, data: { ...dto, title: dto.title?.trim() }, include });
    await this.audit.record({ entityType: ENTITY, entityId: id, action: "update", userId: user.id, before, after: incident });
    return incident;
  }

  async setStatus(id: string, status: string, user: RequestUser) {
    const before = await this.find(id);
    assertTransition("incident", before.status, status);
    const incident = await this.prisma.opsIncident.update({ where: { id }, data: { status }, include });
    await this.audit.record({ entityType: ENTITY, entityId: id, action: `status:${status}`, userId: user.id, before: { status: before.status }, after: { status } });
    return incident;
  }
}
