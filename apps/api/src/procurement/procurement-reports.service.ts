import { Injectable } from "@nestjs/common";
import type { ReportResult } from "@bsc/shared";
import { col, queryRange, report, sum } from "../common/report";
import { money } from "../common/resource/resource-mapper";
import { PrismaService } from "../prisma/prisma.service";

const LIVE_ORDER = ["ISSUED", "RECEIVED", "CLOSED"];

@Injectable()
export class ProcurementReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(query: Record<string, unknown>): Promise<ReportResult> {
    const createdAt = queryRange(query);
    const orders = await this.prisma.purchaseOrder.findMany({
      where: { status: { not: "DRAFT" }, ...(createdAt ? { createdAt } : {}) },
      include: { vendor: { select: { name: true } } },
    });
    const byVendor = new Map<string, { vendor: string; orders: number; open: number; received: number; cancelled: number; spend: number }>();
    for (const order of orders) {
      const row = byVendor.get(order.vendorId) ?? { vendor: order.vendor.name, orders: 0, open: 0, received: 0, cancelled: 0, spend: 0 };
      row.orders += 1;
      if (order.status === "ISSUED") row.open += 1;
      if (order.status === "RECEIVED" || order.status === "CLOSED") row.received += 1;
      if (order.status === "CANCELLED") row.cancelled += 1;
      if (LIVE_ORDER.includes(order.status)) row.spend += money(order.amountBdt);
      byVendor.set(order.vendorId, row);
    }
    const rows = [...byVendor.values()].sort((a, b) => b.spend - a.spend);
    const [pendingRequests, pendingApprovals] = await Promise.all([
      this.prisma.purchaseRequest.count({ where: { status: "SUBMITTED" } }),
      this.prisma.approvalRequest.count({ where: { category: "PURCHASE", status: "PENDING" } }),
    ]);
    return report(
      "Procurement summary",
      [
        col("vendor", "Vendor"),
        col("orders", "Orders", "number"),
        col("open", "Open", "number"),
        col("received", "Received", "number"),
        col("cancelled", "Cancelled", "number"),
        col("spend", "Committed spend", "money"),
      ],
      rows,
      [
        { label: "Committed spend", value: sum(rows, (row) => row.spend), kind: "money" },
        { label: "Open orders", value: sum(rows, (row) => row.open), kind: "number" },
        { label: "Requests awaiting approval", value: Math.max(pendingRequests, pendingApprovals), kind: "number" },
      ],
    );
  }

  async costAnalysis(): Promise<ReportResult> {
    const [items, orders, quotations] = await Promise.all([
      this.prisma.item.findMany({ orderBy: { name: "asc" } }),
      this.prisma.purchaseOrder.findMany({ where: { status: { in: LIVE_ORDER } }, select: { itemId: true, quantity: true, unitPriceBdt: true, amountBdt: true } }),
      this.prisma.quotation.findMany({ where: { status: { not: "REJECTED" } }, select: { unitPriceBdt: true, rfq: { select: { itemId: true } } } }),
    ]);
    const rows = items
      .map((item) => {
        const bought = orders.filter((order) => order.itemId === item.id);
        const quoted = quotations.filter((quote) => quote.rfq.itemId === item.id).map((quote) => money(quote.unitPriceBdt));
        const units = sum(bought, (order) => order.quantity);
        const spend = sum(bought, (order) => money(order.amountBdt));
        const paid = units ? Math.round((spend / units) * 100) / 100 : null;
        const standard = money(item.unitCostBdt);
        return {
          sku: item.sku,
          item: item.name,
          standard,
          paid,
          lowestQuote: quoted.length ? Math.min(...quoted) : null,
          highestQuote: quoted.length ? Math.max(...quoted) : null,
          units,
          spend,
          variance: paid === null ? null : Math.round((paid - standard) * units * 100) / 100,
        };
      })
      .filter((row) => row.units > 0 || row.lowestQuote !== null);
    return report(
      "Cost analysis",
      [
        col("sku", "SKU"),
        col("item", "Item"),
        col("standard", "Standard cost", "money"),
        col("paid", "Average paid", "money"),
        col("lowestQuote", "Lowest quote", "money"),
        col("highestQuote", "Highest quote", "money"),
        col("units", "Units bought", "number"),
        col("spend", "Spend", "money"),
        col("variance", "Variance to standard", "money"),
      ],
      rows,
      [
        { label: "Spend", value: sum(rows, (row) => row.spend), kind: "money" },
        { label: "Variance to standard", value: sum(rows, (row) => row.variance ?? 0), kind: "money" },
      ],
    );
  }
}
