import { Injectable, type OnModuleInit } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { ReferenceService } from "../common/reference.service";
import { assertEditable, fail } from "../common/resource/guards";
import { moveLinked } from "../common/resource/linked";
import { ResourceHookRegistry } from "../common/resource/resource-hooks";
import { decimal, money, type Data, type Row } from "../common/resource/resource-mapper";
import { round2 } from "../finance/ledger";
import { StockService } from "../inventory/stock.service";

const BILL_TERMS_DAYS = 30;
const OPEN_OFFERS = ["RECEIVED", "SHORTLISTED"];

const merge = (data: Data, existing?: Row) => ({ ...existing, ...data }) as Data;

function score(value: unknown, label: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) fail(`${label} must be a whole number from 1 to 5`);
  return n;
}

/** Request -> approval -> sourcing -> order -> delivery -> invoice match rules. */
@Injectable()
export class ProcurementHooks implements OnModuleInit {
  constructor(
    private readonly hooks: ResourceHookRegistry,
    private readonly references: ReferenceService,
    private readonly stock: StockService,
  ) {}

  onModuleInit() {
    this.hooks.register("purchaseRequest", {
      prepare: (data, _ctx, existing) => {
        assertEditable(existing, ["DRAFT", "RETURNED"]);
        const merged = merge(data, existing);
        if (Number(merged.quantity) <= 0) fail("Quantity must be more than zero");
        return data;
      },
      afterTransition: async (row, _from, { tx, user }) => {
        if (row.status !== "SUBMITTED") return;
        await tx.approvalRequest.create({
          data: {
            reference: await this.references.next("APR", tx),
            status: "PENDING",
            category: "PURCHASE",
            subject: `${row.reference} · ${row.title}`,
            requester: String(row.requestedBy),
            approver: "Finance Controller",
            step: row.emergency ? "Emergency fast-track" : "Purchase approval",
            amountBdt: row.estimatedBdt as Prisma.Decimal,
            sourceType: "purchaseRequest",
            sourceId: row.id,
            createdById: user.id,
          },
        });
      },
    });

    this.hooks.register("approvalRequest", {
      afterTransition: async (row, _from, { tx }) => {
        if (row.sourceType !== "purchaseRequest" || !row.sourceId) return;
        await moveLinked(tx, "purchaseRequest", String(row.sourceId), row.status === "APPROVED" ? "APPROVED" : "RETURNED");
      },
    });

    this.hooks.register("rfq", { prepare: (data, _ctx, existing) => (assertEditable(existing, ["OPEN"]), data) });
    this.hooks.register("tender", {
      prepare: (data, _ctx, existing) => {
        assertEditable(existing, ["OPEN"]);
        const merged = merge(data, existing);
        if ((merged.closesOn as Date) < (merged.publishedOn as Date)) fail("Closing date cannot be before publishing");
        return data;
      },
    });

    this.hooks.register("quotation", {
      prepare: (data, _ctx, existing) => {
        assertEditable(existing, OPEN_OFFERS);
        const merged = merge(data, existing);
        if (Number(merged.quantity) <= 0) fail("Quantity must be more than zero");
        return { ...data, totalBdt: decimal(money(merged.unitPriceBdt) * Number(merged.quantity)) };
      },
      afterTransition: async (row, _from, { tx }) => {
        if (row.status !== "ACCEPTED") return;
        await this.award(tx, "rfq", String(row.rfqId));
        await tx.quotation.updateMany({ where: { rfqId: row.rfqId as string, id: { not: row.id }, status: { in: OPEN_OFFERS } }, data: { status: "REJECTED" } });
      },
    });

    this.hooks.register("tenderBid", {
      prepare: (data, _ctx, existing) => {
        assertEditable(existing, OPEN_OFFERS);
        const technical = Number(merge(data, existing).technicalScore);
        if (technical < 0 || technical > 100) fail("Technical score must be between 0 and 100");
        return data;
      },
      afterTransition: async (row, _from, { tx }) => {
        if (row.status !== "ACCEPTED") return;
        await this.award(tx, "tender", String(row.tenderId));
        await tx.tenderBid.updateMany({ where: { tenderId: row.tenderId as string, id: { not: row.id }, status: { in: OPEN_OFFERS } }, data: { status: "REJECTED" } });
      },
    });

    this.hooks.register("supplierEvaluation", {
      prepare: (data, _ctx, existing) => {
        assertEditable(existing, ["PROPOSED"]);
        const merged = merge(data, existing);
        const total = score(merged.quality, "Quality") + score(merged.price, "Price") + score(merged.delivery, "Delivery");
        return { ...data, score: decimal(Math.round((total / 3) * 10) / 10) };
      },
      afterTransition: async (row, _from, { tx }) => {
        if (row.status !== "SELECTED") return;
        const { _avg } = await tx.supplierEvaluation.aggregate({ where: { vendorId: row.vendorId as string, status: "SELECTED" }, _avg: { score: true } });
        await tx.vendor.update({ where: { id: row.vendorId as string }, data: { rating: decimal(Math.round(money(_avg.score) * 10) / 10) } });
      },
    });

    this.hooks.register("contract", {
      prepare: (data, _ctx, existing) => {
        assertEditable(existing, ["DRAFT"]);
        const merged = merge(data, existing);
        if ((merged.endsOn as Date) < (merged.startsOn as Date)) fail("End date cannot be before the start date");
        return data;
      },
    });

    this.hooks.register("procurementBudget", { prepare: (data, _ctx, existing) => (assertEditable(existing, ["DRAFT"]), data) });

    this.hooks.register("purchaseOrder", {
      prepare: async (data, { tx }, existing) => {
        assertEditable(existing, ["DRAFT"]);
        const merged = merge(data, existing);
        if (Number(merged.quantity) <= 0) fail("Quantity must be more than zero");
        if (typeof merged.purchaseRequestId === "string") {
          const request = await tx.purchaseRequest.findUnique({ where: { id: merged.purchaseRequestId } });
          if (request && request.status !== "APPROVED" && request.status !== "ORDERED") fail(`${request.reference} must be approved before ordering`);
        }
        return { ...data, amountBdt: decimal(money(merged.unitPriceBdt) * Number(merged.quantity)) };
      },
      afterTransition: async (row, from, { tx }) => {
        if (row.status === "ISSUED") {
          await this.commit(tx, row, 1);
          if (row.purchaseRequestId) await moveLinked(tx, "purchaseRequest", String(row.purchaseRequestId), "ORDERED");
        }
        if (row.status === "CANCELLED" && from === "ISSUED") {
          if (Number(row.receivedQty) > 0) fail("Stock has already been received against this order");
          await this.commit(tx, row, -1);
        }
      },
    });

    this.hooks.register("delivery", {
      prepare: async (data, { tx }, existing) => {
        assertEditable(existing, ["SCHEDULED", "IN_TRANSIT", "DELAYED"]);
        const merged = merge(data, existing);
        const order = await tx.purchaseOrder.findUnique({ where: { id: String(merged.purchaseOrderId) } });
        if (!order) fail("Purchase order not found");
        if (order.status !== "ISSUED") fail(`${order.reference} is ${order.status}; only issued orders can be delivered`);
        const quantity = Number(merged.quantity);
        if (quantity <= 0) fail("Quantity must be more than zero");
        if (quantity > order.quantity - order.receivedQty) fail(`Only ${order.quantity - order.receivedQty} units are still due on ${order.reference}`);
        return data;
      },
      beforeTransition: (_row, to) => (to === "DELIVERED" ? { deliveredAt: new Date() } : {}),
      afterTransition: async (row, _from, ctx) => {
        if (row.status === "DELIVERED") await this.receive(ctx.tx, row, ctx.user.id);
      },
    });

    this.hooks.register("invoiceMatch", {
      prepare: async (data, { tx }, existing) => {
        assertEditable(existing, ["MATCHED", "VARIANCE", "DISPUTED"]);
        const merged = merge(data, existing);
        const order = await tx.purchaseOrder.findUnique({ where: { id: String(merged.purchaseOrderId) } });
        if (!order) fail("Purchase order not found");
        const unit = money(order.unitPriceBdt);
        const variance = round2(money(merged.invoicedBdt) - unit * order.receivedQty);
        const balanced = variance === 0 && Number(merged.invoicedQty) === order.receivedQty;
        const next: Data = { ...data, receivedQty: order.receivedQty, orderedBdt: order.amountBdt, varianceBdt: decimal(variance) };
        if (!existing) return { ...next, status: balanced ? "MATCHED" : "VARIANCE" };
        if (existing.status !== "DISPUTED") await tx.invoiceMatch.update({ where: { id: existing.id }, data: { status: balanced ? "MATCHED" : "VARIANCE" } });
        return next;
      },
      afterTransition: async (row, _from, { tx, user }) => {
        if (row.status !== "APPROVED") return;
        const order = await tx.purchaseOrder.findUniqueOrThrow({ where: { id: String(row.purchaseOrderId) }, include: { vendor: { select: { name: true } } } });
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const amount = row.invoicedBdt as Prisma.Decimal;
        await tx.invoice.create({
          data: {
            reference: await this.references.next("INV", tx),
            status: "DRAFT",
            kind: "PAYABLE",
            party: order.vendor.name,
            issuedOn: today,
            dueOn: new Date(today.getTime() + BILL_TERMS_DAYS * 86_400_000),
            subtotalBdt: amount,
            totalBdt: amount,
            notes: `Vendor invoice ${row.vendorInvoiceNo} for ${order.reference}`,
            sourceType: "invoiceMatch",
            sourceId: row.id,
            createdById: user.id,
          },
        });
        await moveLinked(tx, "purchaseOrder", order.id, "CLOSED");
      },
    });
  }

  /** OPEN sourcing documents pass through evaluation on their way to awarded. */
  private async award(tx: Prisma.TransactionClient, entityKey: "rfq" | "tender", id: string) {
    await moveLinked(tx, entityKey, id, "EVALUATION");
    await moveLinked(tx, entityKey, id, "AWARDED");
  }

  /** Moves an order's value into (sign 1) or out of (sign -1) its department's approved budgets. */
  private async commit(tx: Prisma.TransactionClient, order: Row, sign: 1 | -1) {
    if (!order.purchaseRequestId) return;
    const request = await tx.purchaseRequest.findUnique({ where: { id: String(order.purchaseRequestId) }, select: { department: true } });
    if (!request) return;
    await tx.procurementBudget.updateMany({
      where: { department: request.department, status: "APPROVED" },
      data: { committedBdt: { increment: decimal(sign * money(order.amountBdt)) } },
    });
  }

  /** Posts a stock receipt for a delivery and advances the order once fully received. */
  private async receive(tx: Prisma.TransactionClient, delivery: Row, userId: string) {
    const order = await tx.purchaseOrder.findUniqueOrThrow({ where: { id: String(delivery.purchaseOrderId) } });
    const quantity = Number(delivery.quantity);
    if (quantity > order.quantity - order.receivedQty) fail(`Only ${order.quantity - order.receivedQty} units are still due on ${order.reference}`);
    const movement = await tx.stockMovement.create({
      data: {
        reference: await this.references.next("MOV", tx),
        status: "POSTED",
        kind: "RECEIPT",
        itemId: order.itemId,
        warehouseId: order.warehouseId,
        quantity,
        reason: `Delivery ${delivery.reference} for ${order.reference}`,
        sourceType: "delivery",
        sourceId: delivery.id,
        postedAt: new Date(),
        createdById: userId,
      },
    });
    await this.stock.apply(tx, { kind: "RECEIPT", itemId: order.itemId, warehouseId: order.warehouseId, quantity, reference: movement.reference });
    const received = order.receivedQty + quantity;
    await tx.purchaseOrder.update({ where: { id: order.id }, data: { receivedQty: received } });
    if (received >= order.quantity) await moveLinked(tx, "purchaseOrder", order.id, "RECEIVED");
  }
}
