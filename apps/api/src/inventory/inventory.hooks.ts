import { Injectable, type OnModuleInit } from "@nestjs/common";
import { assertEditable, fail } from "../common/resource/guards";
import { ResourceHookRegistry } from "../common/resource/resource-hooks";
import type { Data, Row } from "../common/resource/resource-mapper";
import { StockService, type MovementLike } from "./stock.service";

const asMovement = (row: Row): MovementLike => ({
  kind: String(row.kind),
  itemId: String(row.itemId),
  warehouseId: String(row.warehouseId),
  toWarehouseId: (row.toWarehouseId as string | null) ?? null,
  quantity: Number(row.quantity),
  reference: row.reference,
});

@Injectable()
export class InventoryHooks implements OnModuleInit {
  constructor(
    private readonly hooks: ResourceHookRegistry,
    private readonly stock: StockService,
  ) {}

  onModuleInit() {
    this.hooks.register("stockMovement", {
      prepare: (data, _ctx, existing) => {
        assertEditable(existing, ["DRAFT"]);
        const merged = { ...existing, ...data } as Data;
        const quantity = Number(merged.quantity);
        if (merged.kind === "ADJUST" ? quantity === 0 : quantity <= 0) {
          fail(merged.kind === "ADJUST" ? "Adjustment quantity cannot be zero" : "Quantity must be more than zero");
        }
        if (merged.kind === "TRANSFER") {
          if (!merged.toWarehouseId) fail("Choose the warehouse to transfer to");
          if (merged.toWarehouseId === merged.warehouseId) fail("Transfer needs two different warehouses");
        } else if (merged.toWarehouseId) {
          return { ...data, toWarehouseId: null };
        }
        return data;
      },
      beforeTransition: (_row, to) => (to === "POSTED" ? { postedAt: new Date() } : {}),
      afterTransition: async (row, from, { tx }) => {
        if (row.status === "POSTED") await this.stock.apply(tx, asMovement(row), 1);
        if (row.status === "REVERSED" && from === "POSTED") await this.stock.apply(tx, asMovement(row), -1);
      },
    });

    this.hooks.register("stockLot", {
      prepare: (data, _ctx, existing) => {
        const merged = { ...existing, ...data } as Data;
        if (merged.expiresOn && merged.receivedOn && (merged.expiresOn as Date) < (merged.receivedOn as Date)) fail("Expiry cannot be before receipt");
        if (Number(merged.quantity) < 0) fail("Quantity cannot be negative");
        return data;
      },
    });

    this.hooks.register("item", {
      prepare: (data) => {
        if (data.reorderLevel !== undefined && Number(data.reorderLevel) < 0) fail("Reorder level cannot be negative");
        return data;
      },
    });
  }
}
