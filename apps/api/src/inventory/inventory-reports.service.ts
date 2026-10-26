import { Injectable } from "@nestjs/common";
import type { ReportResult } from "@bsc/shared";
import { col, daysBetween, report, startOfToday, sum } from "../common/report";
import { isoDay, money } from "../common/resource/resource-mapper";
import { PrismaService } from "../prisma/prisma.service";

const FORECAST_WINDOW_DAYS = 90;
const EXPIRY_HORIZON_DAYS = 60;

@Injectable()
export class InventoryReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async reorder(): Promise<ReportResult> {
    const items = await this.prisma.item.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
    const rows = items
      .filter((item) => item.onHand <= item.reorderLevel)
      .map((item) => {
        const suggested = Math.max(item.reorderLevel * 2 - item.onHand, 0);
        return {
          sku: item.sku,
          item: item.name,
          onHand: item.onHand,
          reorderLevel: item.reorderLevel,
          shortfall: item.reorderLevel - item.onHand,
          suggested,
          cost: suggested * money(item.unitCostBdt),
        };
      });
    return report(
      "Reorder list",
      [
        col("sku", "SKU"),
        col("item", "Item"),
        col("onHand", "On hand", "number"),
        col("reorderLevel", "Reorder level", "number"),
        col("shortfall", "Shortfall", "number"),
        col("suggested", "Suggested order", "number"),
        col("cost", "Estimated cost", "money"),
      ],
      rows,
      [
        { label: "Items to reorder", value: rows.length, kind: "number" },
        { label: "Estimated cost", value: sum(rows, (row) => row.cost), kind: "money" },
      ],
    );
  }

  async forecast(): Promise<ReportResult> {
    const today = startOfToday();
    const since = new Date(today.getTime() - FORECAST_WINDOW_DAYS * 86_400_000);
    const [items, issued] = await Promise.all([
      this.prisma.item.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
      this.prisma.stockMovement.groupBy({ by: ["itemId"], where: { kind: "ISSUE", status: "POSTED", postedAt: { gte: since } }, _sum: { quantity: true } }),
    ]);
    const usage = new Map(issued.map((group) => [group.itemId, group._sum.quantity ?? 0]));
    const rows = items.map((item) => {
      const used = usage.get(item.id) ?? 0;
      const perDay = used / FORECAST_WINDOW_DAYS;
      const cover = perDay > 0 ? Math.floor(item.onHand / perDay) : null;
      return {
        sku: item.sku,
        item: item.name,
        onHand: item.onHand,
        issued90: used,
        perDay: Math.round(perDay * 100) / 100,
        daysOfCover: cover,
        stockoutOn: cover === null ? null : isoDay(new Date(today.getTime() + cover * 86_400_000)),
      };
    });
    rows.sort((a, b) => (a.daysOfCover ?? Number.MAX_SAFE_INTEGER) - (b.daysOfCover ?? Number.MAX_SAFE_INTEGER));
    return report(
      "Stock forecast",
      [
        col("sku", "SKU"),
        col("item", "Item"),
        col("onHand", "On hand", "number"),
        col("issued90", "Issued (90 days)", "number"),
        col("perDay", "Per day", "number"),
        col("daysOfCover", "Days of cover", "number"),
        col("stockoutOn", "Runs out", "date"),
      ],
      rows,
      [{ label: "Under 30 days of cover", value: rows.filter((row) => row.daysOfCover !== null && row.daysOfCover < 30).length, kind: "number" }],
    );
  }

  async summary(): Promise<ReportResult> {
    const [warehouses, balances] = await Promise.all([
      this.prisma.warehouse.findMany({ orderBy: { name: "asc" } }),
      this.prisma.stockBalance.findMany({ where: { quantity: { not: 0 } }, include: { item: { select: { unitCostBdt: true } } } }),
    ]);
    const rows = warehouses.map((warehouse) => {
      const mine = balances.filter((balance) => balance.warehouseId === warehouse.id);
      return {
        warehouse: warehouse.name,
        location: warehouse.location,
        items: mine.length,
        quantity: sum(mine, (balance) => balance.quantity),
        value: sum(mine, (balance) => balance.quantity * money(balance.item.unitCostBdt)),
      };
    });
    return report(
      "Inventory summary",
      [col("warehouse", "Warehouse"), col("location", "Location"), col("items", "Items", "number"), col("quantity", "Units", "number"), col("value", "Stock value", "money")],
      rows,
      [
        { label: "Units", value: sum(rows, (row) => row.quantity), kind: "number" },
        { label: "Stock value", value: sum(rows, (row) => row.value), kind: "money" },
      ],
    );
  }

  async expiry(): Promise<ReportResult> {
    const today = startOfToday();
    const horizon = new Date(today.getTime() + EXPIRY_HORIZON_DAYS * 86_400_000);
    const lots = await this.prisma.stockLot.findMany({
      where: { status: { in: ["IN_STOCK", "EXPIRED"] }, expiresOn: { not: null, lte: horizon } },
      include: { item: { select: { name: true } }, warehouse: { select: { name: true } } },
      orderBy: { expiresOn: "asc" },
    });
    const rows = lots.map((lot) => {
      const days = daysBetween(today, lot.expiresOn!);
      return {
        batch: lot.batchNo,
        item: lot.item.name,
        warehouse: lot.warehouse.name,
        quantity: lot.quantity,
        expiresOn: isoDay(lot.expiresOn!),
        daysLeft: days,
        state: days < 0 ? "Expired" : "Expiring",
      };
    });
    return report(
      "Expiry",
      [
        col("batch", "Batch"),
        col("item", "Item"),
        col("warehouse", "Warehouse"),
        col("quantity", "Quantity", "number"),
        col("expiresOn", "Expires", "date"),
        col("daysLeft", "Days left", "number"),
        col("state", "State"),
      ],
      rows,
      [
        { label: "Expired", value: rows.filter((row) => row.state === "Expired").length, kind: "number" },
        { label: `Expiring in ${EXPIRY_HORIZON_DAYS} days`, value: rows.filter((row) => row.state === "Expiring").length, kind: "number" },
      ],
    );
  }
}
