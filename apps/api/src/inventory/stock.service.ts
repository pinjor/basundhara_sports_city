import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { fail } from "../common/resource/guards";

export interface MovementLike {
  kind: string;
  itemId: string;
  warehouseId: string;
  toWarehouseId?: string | null;
  quantity: number;
  reference: string;
}

/** Keeps StockBalance and Item.onHand in step with posted movements. */
@Injectable()
export class StockService {
  private async change(tx: Prisma.TransactionClient, itemId: string, warehouseId: string, delta: number, reference: string) {
    if (delta === 0) return;
    const balance = await tx.stockBalance.upsert({
      where: { itemId_warehouseId: { itemId, warehouseId } },
      create: { itemId, warehouseId, quantity: 0 },
      update: {},
    });
    const next = balance.quantity + delta;
    if (next < 0) {
      const [item, warehouse] = await Promise.all([
        tx.item.findUnique({ where: { id: itemId }, select: { name: true } }),
        tx.warehouse.findUnique({ where: { id: warehouseId }, select: { name: true } }),
      ]);
      fail(`${reference}: only ${balance.quantity} ${item?.name ?? "units"} in ${warehouse?.name ?? "the warehouse"}`);
    }
    await tx.stockBalance.update({ where: { id: balance.id }, data: { quantity: next } });
    await tx.item.update({ where: { id: itemId }, data: { onHand: { increment: delta } } });
  }

  /** Quantity effects of a movement as (warehouse, delta) pairs. */
  private effects(movement: MovementLike): [string, number][] {
    switch (movement.kind) {
      case "RECEIPT":
        return [[movement.warehouseId, movement.quantity]];
      case "ISSUE":
        return [[movement.warehouseId, -movement.quantity]];
      case "ADJUST":
        return [[movement.warehouseId, movement.quantity]];
      case "TRANSFER":
        return [
          [movement.warehouseId, -movement.quantity],
          [movement.toWarehouseId!, movement.quantity],
        ];
      default:
        return fail(`Unknown movement kind ${movement.kind}`);
    }
  }

  async apply(tx: Prisma.TransactionClient, movement: MovementLike, sign: 1 | -1 = 1) {
    const effects = this.effects(movement);
    // Withdrawals first so a shortfall fails before anything is credited.
    const ordered = [...effects].sort((a, b) => sign * a[1] - sign * b[1]);
    for (const [warehouseId, delta] of ordered) await this.change(tx, movement.itemId, warehouseId, sign * delta, movement.reference);
  }
}
