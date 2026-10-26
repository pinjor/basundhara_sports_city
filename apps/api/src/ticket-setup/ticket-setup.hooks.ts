import { Injectable, type OnModuleInit } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { assertEditable, fail } from "../common/resource/guards";
import { ResourceHookRegistry } from "../common/resource/resource-hooks";
import { decimal, money, type Data, type Row } from "../common/resource/resource-mapper";

const SETTLED_ORDER = ["CONFIRMED", "CANCEL_REQUESTED"];
const merge = (data: Data, existing?: Row) => ({ ...existing, ...data }) as Data;

/** Seating roll-ups, box office, passes, codes, price changes, transfers and cases. */
@Injectable()
export class TicketSetupHooks implements OnModuleInit {
  constructor(private readonly hooks: ResourceHookRegistry) {}

  onModuleInit() {
    this.hooks.register("seatBlock", {
      prepare: async (data, { tx }, existing) => {
        const merged = merge(data, existing);
        const rows = Number(merged.rows);
        const seatsPerRow = Number(merged.seatsPerRow);
        if (rows <= 0 || seatsPerRow <= 0) fail("Rows and seats per row must be more than zero");
        const capacity = rows * seatsPerRow;
        const self = { id: existing?.id, capacity, active: (existing?.status ?? "ACTIVE") === "ACTIVE" };
        await this.refreshStand(tx, String(merged.standId), self);
        if (existing && existing.standId !== merged.standId) await this.refreshStand(tx, String(existing.standId), { id: existing.id, capacity: 0, active: false });
        return { ...data, capacity };
      },
      afterTransition: (row, _from, { tx }) => this.refreshStand(tx, String(row.standId)),
    });

    this.hooks.register("stand", {
      prepare: async (data, { tx }, existing) => {
        if (existing && data.venueLayoutId && data.venueLayoutId !== existing.venueLayoutId) {
          await this.refreshLayout(tx, String(existing.venueLayoutId), { id: existing.id, capacity: 0 });
          await this.refreshLayout(tx, String(data.venueLayoutId), { id: existing.id, capacity: Number(existing.capacity) });
        }
        return data;
      },
      afterTransition: (row, _from, { tx }) => this.refreshLayout(tx, String(row.venueLayoutId)),
    });

    this.hooks.register("seatRow", {
      prepare: async (data, { tx }, existing) => {
        const merged = merge(data, existing);
        const block = await tx.seatBlock.findUniqueOrThrow({ where: { id: String(merged.seatBlockId) } });
        const seats = Number(merged.seats);
        if (seats <= 0 || seats > block.seatsPerRow) fail(`${block.name} rows hold 1 to ${block.seatsPerRow} seats`);
        if (Number(merged.accessible) < 0 || Number(merged.accessible) > seats) fail("Accessible seats must be between 0 and the row's seats");
        const duplicate = await tx.seatRow.count({ where: { seatBlockId: block.id, label: String(merged.label), ...(existing ? { id: { not: existing.id } } : {}) } });
        if (duplicate) fail(`${block.name} already has row ${merged.label}`);
        if (!existing && (await tx.seatRow.count({ where: { seatBlockId: block.id } })) >= block.rows) fail(`${block.name} already has all ${block.rows} rows`);
        return data;
      },
    });

    this.hooks.register("seatAssignment", {
      prepare: async (data, { tx }, existing) => {
        assertEditable(existing, ["ISSUED"]);
        const merged = merge(data, existing);
        const row = await tx.seatRow.findUniqueOrThrow({ where: { id: String(merged.seatRowId) }, include: { seatBlock: { include: { stand: true } } } });
        const seatNo = Number(merged.seatNo);
        if (seatNo < 1 || seatNo > row.seats) fail(`Row ${row.label} has seats 1 to ${row.seats}`);
        const taken = await tx.seatAssignment.findFirst({
          where: { matchEventId: String(merged.matchEventId), seatRowId: row.id, seatNo, status: { not: "REVOKED" }, ...(existing ? { id: { not: existing.id } } : {}) },
        });
        if (taken) fail(`${taken.seatLabel} is already mapped for this event (${taken.reference})`);
        return { ...data, seatLabel: `${row.seatBlock.name}-${row.label}-${seatNo}`, gate: row.seatBlock.stand.gate };
      },
    });

    this.hooks.register("boxOfficeTicket", {
      prepare: (data, _ctx, existing) => {
        assertEditable(existing, ["ISSUED"]);
        const merged = merge(data, existing);
        const quantity = Number(merged.quantity);
        if (quantity <= 0) fail("Quantity must be more than zero");
        if (merged.channel === "NFC" && !merged.device) fail("Enter the NFC card or wristband number");
        if (merged.kind === "COMPLIMENTARY") {
          if (!merged.approvedBy) fail("Complimentary tickets need an approver");
          return { ...data, priceBdt: decimal(0), totalBdt: decimal(0) };
        }
        return { ...data, totalBdt: decimal(money(merged.priceBdt) * quantity) };
      },
    });

    this.hooks.register("ticketAllocation", {
      prepare: (data, _ctx, existing) => {
        assertEditable(existing, ["REQUESTED", "CONFIRMED"]);
        if (Number(merge(data, existing).quantity) <= 0) fail("Tickets must be more than zero");
        return data;
      },
    });

    this.hooks.register("promoCode", {
      prepare: async (data, { tx }, existing) => {
        const merged = merge(data, existing);
        const code = String(merged.code).trim().toUpperCase();
        if (!/^[A-Z0-9-]{3,20}$/.test(code)) fail("Codes are 3-20 letters, digits or dashes");
        const discount = Number(merged.discountPercent);
        if (discount < 1 || discount > 90) fail("Discount must be from 1% to 90%");
        if (Number(merged.usageLimit) <= 0) fail("Usage limit must be more than zero");
        if (await tx.promoCode.count({ where: { code, ...(existing ? { id: { not: existing.id } } : {}) } })) fail(`${code} already exists`);
        return data.code === undefined ? data : { ...data, code };
      },
    });

    this.hooks.register("priceChange", {
      prepare: (data, _ctx, existing) => (assertEditable(existing, ["DRAFT"]), data),
      beforeTransition: async (row, to, { tx }) => {
        const category = await tx.ticketCategory.findUniqueOrThrow({ where: { id: String(row.ticketCategoryId) } });
        if (to === "POSTED") {
          await tx.ticketCategory.update({ where: { id: category.id }, data: { priceBdt: row.priceBdt as Prisma.Decimal } });
          return { previousBdt: category.priceBdt };
        }
        if (to === "REVERSED" && row.previousBdt !== null) {
          await tx.ticketCategory.update({ where: { id: category.id }, data: { priceBdt: row.previousBdt as Prisma.Decimal } });
        }
      },
    });

    this.hooks.register("ticketTransfer", {
      prepare: async (data, { tx }, existing) => {
        assertEditable(existing, ["REQUESTED"]);
        const order = await this.settledOrder(tx, String(merge(data, existing).ticketOrderId));
        return { ...data, fromHolder: order.buyerName };
      },
      afterTransition: async (row, _from, { tx }) => {
        if (row.status !== "COMPLETED") return;
        await this.settledOrder(tx, String(row.ticketOrderId));
        await tx.ticketOrder.update({ where: { id: String(row.ticketOrderId) }, data: { buyerName: String(row.toHolder), buyerMobile: String(row.toMobile) } });
      },
    });

    this.hooks.register("ticketCase", {
      prepare: async (data, { tx }, existing) => {
        assertEditable(existing, ["OPEN"]);
        const merged = merge(data, existing);
        const order = await this.settledOrder(tx, String(merged.ticketOrderId));
        if (merged.amountBdt !== null && merged.amountBdt !== undefined && money(merged.amountBdt) > money(order.total)) {
          fail(`Refund is more than the order total (${money(order.total).toLocaleString("en-US")} BDT)`);
        }
        return data;
      },
      afterTransition: async (row, _from, { tx }) => {
        if (row.status !== "APPROVED") return;
        const order = await this.settledOrder(tx, String(row.ticketOrderId));
        await tx.ticketOrder.update({ where: { id: order.id }, data: { status: row.kind === "REFUND" ? "REFUNDED" : "CANCELLED" } });
        await tx.issuedTicket.updateMany({ where: { orderId: order.id, status: "VALID" }, data: { status: "REVOKED" } });
      },
    });
  }

  private async settledOrder(tx: Prisma.TransactionClient, id: string) {
    const order = await tx.ticketOrder.findUnique({ where: { id } });
    if (!order) fail("Order not found");
    if (!SETTLED_ORDER.includes(order.status)) fail(`${order.reference} is ${order.status.replace(/_/g, " ").toLowerCase()}`);
    return order;
  }

  /** Stand capacity = its active blocks. `self` stands in for a block row that is about to change. */
  private async refreshStand(tx: Prisma.TransactionClient, standId: string, self?: { id?: string; capacity: number; active: boolean }) {
    const blocks = await tx.seatBlock.findMany({ where: { standId, status: "ACTIVE", ...(self?.id ? { id: { not: self.id } } : {}) }, select: { capacity: true } });
    const capacity = blocks.reduce((total, block) => total + block.capacity, 0) + (self?.active ? self.capacity : 0);
    const stand = await tx.stand.update({ where: { id: standId }, data: { capacity } });
    await this.refreshLayout(tx, stand.venueLayoutId);
  }

  private async refreshLayout(tx: Prisma.TransactionClient, layoutId: string, self?: { id: string; capacity: number }) {
    const stands = await tx.stand.findMany({ where: { venueLayoutId: layoutId, status: "ACTIVE", ...(self ? { id: { not: self.id } } : {}) }, select: { capacity: true } });
    const capacity = stands.reduce((total, stand) => total + stand.capacity, 0) + (self?.capacity ?? 0);
    await tx.venueLayout.update({ where: { id: layoutId }, data: { capacity } });
  }
}
