import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { EntityDef } from "@bsc/shared";
import type { RequestUser } from "../../auth/current-user.decorator";
import type { Data, Row } from "./resource-mapper";

export interface HookContext {
  tx: Prisma.TransactionClient;
  user: RequestUser;
  entity: EntityDef;
}

/**
 * Domain rules attached to a registry entity. Every hook runs inside the write transaction,
 * so a throw rolls back the whole change.
 */
export interface ResourceHooks {
  /** Derive server columns (totals, status) before insert/update. `existing` is set on update. */
  prepare?(data: Data, ctx: HookContext, existing?: Row): Promise<Data> | Data;
  afterCreate?(row: Row, ctx: HookContext): Promise<void> | void;
  /** Validate a move and return extra columns to write with it. */
  beforeTransition?(row: Row, to: string, ctx: HookContext): Promise<Data | void> | Data | void;
  afterTransition?(row: Row, from: string, ctx: HookContext): Promise<void> | void;
}

/** Runs several modules' hooks for one entity in registration order. */
function compose(list: ResourceHooks[]): ResourceHooks {
  if (list.length === 1) return list[0]!;
  return {
    async prepare(data, ctx, existing) {
      let next = data;
      for (const hooks of list) if (hooks.prepare) next = await hooks.prepare(next, ctx, existing);
      return next;
    },
    async afterCreate(row, ctx) {
      for (const hooks of list) await hooks.afterCreate?.(row, ctx);
    },
    async beforeTransition(row, to, ctx) {
      let extra: Data = {};
      for (const hooks of list) extra = { ...extra, ...((await hooks.beforeTransition?.(row, to, ctx)) ?? {}) };
      return extra;
    },
    async afterTransition(row, from, ctx) {
      for (const hooks of list) await hooks.afterTransition?.(row, from, ctx);
    },
  };
}

@Injectable()
export class ResourceHookRegistry {
  private readonly hooks = new Map<string, ResourceHooks[]>();

  register(entityKey: string, hooks: ResourceHooks): void {
    this.hooks.set(entityKey, [...(this.hooks.get(entityKey) ?? []), hooks]);
  }

  for(entityKey: string): ResourceHooks {
    const list = this.hooks.get(entityKey);
    return list?.length ? compose(list) : {};
  }
}
