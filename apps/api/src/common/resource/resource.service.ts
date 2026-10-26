import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { entityDef, type EntityDef, type Paginated, type ResourceField } from "@bsc/shared";
import type { RequestUser } from "../../auth/current-user.decorator";
import type { AuditService } from "../../audit/audit.service";
import type { PrismaService } from "../../prisma/prisma.service";
import { dateRange, pageWindow } from "../pagination";
import type { ReferenceService } from "../reference.service";
import { assertTransition, workflowOf } from "../workflow";
import { EXTERNAL_REFS } from "./external-refs";
import type { HookContext, ResourceHooks } from "./resource-hooks";
import { present, toColumns, type Data, type Row } from "./resource-mapper";

/** Minimal surface of a Prisma model delegate used by the generic service. */
export interface Delegate {
  findMany(args: object): Promise<Data[]>;
  findUnique(args: object): Promise<Data | null>;
  count(args: object): Promise<number>;
  create(args: object): Promise<Data>;
  update(args: object): Promise<Data>;
}

export function delegateOf(client: Prisma.TransactionClient, model: string): Delegate {
  const delegate = (client as unknown as Record<string, Delegate | undefined>)[model];
  if (!delegate) throw new Error(`Prisma model "${model}" not found`);
  return delegate;
}

/** `accountId` -> `account`: the Prisma relation that backs a ref column. */
export function relationOf(field: ResourceField): string {
  return field.key.endsWith("Id") ? field.key.slice(0, -2) : field.key;
}

/** Room for hooks that write many rows (payroll runs, bulk receipts). */
const TX_OPTIONS = { timeout: 30_000 };

function titleKeyOf(entityKey: string): string {
  return entityDef(entityKey)?.titleKey ?? EXTERNAL_REFS[entityKey]?.title ?? "id";
}

export class ResourceService {
  private readonly refFields: ResourceField[];
  private readonly include: Record<string, { select: Record<string, true> }> | undefined;

  constructor(
    readonly entity: EntityDef,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly references: ReferenceService,
    private readonly hooks: ResourceHooks,
  ) {
    workflowOf(entity.workflow);
    this.refFields = entity.fields.filter((field) => field.kind === "ref" && field.ref);
    const include = Object.fromEntries(
      this.refFields.map((field) => [relationOf(field), { select: { id: true, [titleKeyOf(field.ref!)]: true } as Record<string, true> }]),
    );
    this.include = this.refFields.length ? include : undefined;
  }

  private get delegate(): Delegate {
    return delegateOf(this.prisma, this.entity.model);
  }

  /** Row for the API: relations collapsed to `<relation>Label`. */
  shape(row: Data): Data {
    const out = present(this.entity.fields, row);
    for (const field of this.refFields) {
      const relation = relationOf(field);
      const related = row[relation] as Data | null | undefined;
      delete out[relation];
      out[`${relation}Label`] = related ? String(related[titleKeyOf(field.ref!)] ?? "") : null;
    }
    return out;
  }

  private where(query: Record<string, unknown>, fixed: Record<string, unknown>): Data {
    const and: Data[] = [{ ...fixed }];
    const search = typeof query.search === "string" ? query.search.trim() : "";
    if (search) {
      const searchable = this.entity.fields.filter((field) => field.kind === "text" || field.kind === "select").map((field) => field.key);
      and.push({
        OR: ["reference", ...searchable].map((key) => ({ [key]: { contains: search, mode: "insensitive" } })),
      });
    }
    if (typeof query.status === "string" && query.status) and.push({ status: query.status });
    const range = dateRange(query);
    if (range) and.push({ createdAt: range });
    for (const field of this.entity.fields) {
      const value = query[field.key];
      if (typeof value !== "string" || !value || field.key in fixed) continue;
      if (field.kind === "select" || field.kind === "ref") and.push({ [field.key]: value });
      if (field.kind === "bool") and.push({ [field.key]: value === "true" });
    }
    return { AND: and };
  }

  async list(query: Record<string, unknown>, fixed: Record<string, unknown> = {}): Promise<Paginated<Data>> {
    const where = this.where(query, fixed);
    const { skip, take } = pageWindow(query);
    const [rows, total] = await Promise.all([
      this.delegate.findMany({ where, include: this.include, orderBy: { createdAt: "desc" }, skip, take }),
      this.delegate.count({ where }),
    ]);
    return { items: rows.map((row) => this.shape(row)), total };
  }

  private async findRow(client: Prisma.TransactionClient, id: string, fixed: Record<string, unknown> = {}): Promise<Row> {
    const row = (await delegateOf(client, this.entity.model).findUnique({ where: { id }, include: this.include })) as Row | null;
    const outOfScope = row && Object.entries(fixed).some(([key, value]) => row[key] !== value);
    if (!row || outOfScope) throw new NotFoundException(`${this.entity.label} not found`);
    return row;
  }

  async get(id: string, fixed: Record<string, unknown> = {}): Promise<Data> {
    return this.shape(await this.findRow(this.prisma, id, fixed));
  }

  auditTrail(id: string) {
    return this.audit.listForEntity(this.entity.key, id);
  }

  private context(tx: Prisma.TransactionClient, user: RequestUser): HookContext {
    return { tx, user, entity: this.entity };
  }

  async create(input: Data, user: RequestUser, fixed: Record<string, unknown> = {}): Promise<Data> {
    const row = await this.prisma.$transaction(async (tx) => {
      const ctx = this.context(tx, user);
      let data: Data = { ...toColumns(this.entity.fields, input, true), ...fixed };
      if (this.hooks.prepare) data = await this.hooks.prepare(data, ctx);
      const created = (await delegateOf(tx, this.entity.model).create({
        data: {
          status: workflowOf(this.entity.workflow).initial,
          ...data,
          reference: await this.references.next(this.entity.prefix, tx),
          createdById: user.id,
        },
      })) as Row;
      await this.hooks.afterCreate?.(created, ctx);
      return this.findRow(tx, created.id);
    }, TX_OPTIONS);
    const shaped = this.shape(row);
    await this.audit.record({ entityType: this.entity.key, entityId: row.id, action: "CREATE", userId: user.id, after: shaped });
    return shaped;
  }

  async update(id: string, input: Data, user: RequestUser, fixed: Record<string, unknown> = {}): Promise<Data> {
    const { before, after } = await this.prisma.$transaction(async (tx) => {
      const existing = await this.findRow(tx, id, fixed);
      const ctx = this.context(tx, user);
      let data = toColumns(this.entity.fields, input, false);
      if (this.hooks.prepare) data = await this.hooks.prepare(data, ctx, existing);
      delete data.status;
      await delegateOf(tx, this.entity.model).update({ where: { id }, data });
      return { before: existing, after: await this.findRow(tx, id) };
    }, TX_OPTIONS);
    const shaped = this.shape(after);
    await this.audit.record({ entityType: this.entity.key, entityId: id, action: "UPDATE", userId: user.id, before: this.shape(before), after: shaped });
    return shaped;
  }

  async transition(id: string, to: string, user: RequestUser, fixed: Record<string, unknown> = {}): Promise<Data> {
    const { before, after } = await this.prisma.$transaction(async (tx) => {
      const existing = await this.findRow(tx, id, fixed);
      assertTransition(this.entity.workflow, existing.status, to);
      const ctx = this.context(tx, user);
      const extra = (await this.hooks.beforeTransition?.(existing, to, ctx)) ?? {};
      if ("status" in extra) throw new BadRequestException("Hooks may not override status");
      await delegateOf(tx, this.entity.model).update({ where: { id }, data: { ...extra, status: to } });
      const updated = await this.findRow(tx, id);
      await this.hooks.afterTransition?.(updated, existing.status, ctx);
      return { before: existing, after: await this.findRow(tx, id) };
    }, TX_OPTIONS);
    const shaped = this.shape(after);
    await this.audit.record({
      entityType: this.entity.key,
      entityId: id,
      action: `STATUS_${to.toUpperCase()}`,
      userId: user.id,
      before: { status: before.status },
      after: { status: after.status },
    });
    return shaped;
  }
}
