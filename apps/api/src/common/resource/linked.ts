import type { Prisma } from "@prisma/client";
import { canTransition, entityDef } from "@bsc/shared";
import { delegateOf } from "./resource.service";
import type { Data } from "./resource-mapper";

/**
 * Moves a related registry record as a side effect of another document (e.g. an accepted
 * quotation awards its RFQ). Silently skips when the workflow does not allow the move.
 */
export async function moveLinked(tx: Prisma.TransactionClient, entityKey: string, id: string, to: string, extra: Data = {}): Promise<boolean> {
  const entity = entityDef(entityKey);
  if (!entity) throw new Error(`Unknown entity "${entityKey}"`);
  const delegate = delegateOf(tx, entity.model);
  const row = await delegate.findUnique({ where: { id } });
  if (!row || !canTransition(entity.workflow, String(row.status), to)) return false;
  await delegate.update({ where: { id }, data: { ...extra, status: to } });
  return true;
}
