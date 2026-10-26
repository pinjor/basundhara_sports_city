import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createHash, randomBytes, randomInt } from "crypto";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  CancelTicketOrderDto,
  CreateMatchEventDto,
  CreateTicketOrderDto,
  PayTicketOrderDto,
  VerifyAccessDto,
} from "./dto/ticketing.dto";

const OCCUPYING = ["AWAITING_PAYMENT", "PAYMENT_FAILED_RETRY_HOLD", "CONFIRMED", "CANCEL_REQUESTED"];
const HOLD_MS = 10 * 60 * 1000;
const CEILING_MS = 30 * 60 * 1000;
const MAX_SEATS = 6;

type Tx = Prisma.TransactionClient | PrismaService;

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

function rowLabel(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    n -= 1;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

function isUnique(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class TicketingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  sandboxEnabled(): boolean {
    return process.env.TICKETING_SANDBOX_PAYMENTS === "true";
  }

  private async releaseExpired(tx: Tx = this.prisma) {
    const now = new Date();
    const expired = await tx.ticketOrder.findMany({
      where: {
        status: { in: ["AWAITING_PAYMENT", "PAYMENT_FAILED_RETRY_HOLD", "HOLD"] },
        holdExpiresAt: { lt: now },
      },
      select: { id: true },
    });
    if (expired.length === 0) return;
    const ids = expired.map((row) => row.id);
    await tx.seatHold.deleteMany({ where: { orderId: { in: ids } } });
    await tx.ticketOrder.updateMany({ where: { id: { in: ids } }, data: { status: "EXPIRED" } });
  }

  private async withIdempotency<T>(
    scope: string,
    key: string | undefined,
    payload: unknown,
    run: () => Promise<T>,
  ): Promise<{ body: T; replayed: boolean }> {
    if (!key?.trim()) {
      throw new BadRequestException("Idempotency-Key header is required");
    }
    const requestHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    const existing = await this.prisma.idempotencyRecord.findUnique({ where: { key } });
    if (existing) {
      if (existing.scope !== scope || existing.requestHash !== requestHash) {
        throw new ConflictException("IDEMPOTENCY_CONFLICT");
      }
      return { body: existing.body as T, replayed: true };
    }
    const body = await run();
    try {
      await this.prisma.idempotencyRecord.create({
        data: { key, scope, requestHash, statusCode: 200, body: JSON.parse(JSON.stringify(body)) },
      });
    } catch (error) {
      if (!isUnique(error)) throw error;
      const raced = await this.prisma.idempotencyRecord.findUnique({ where: { key } });
      if (raced && raced.requestHash === requestHash) return { body: raced.body as T, replayed: true };
      throw new ConflictException("IDEMPOTENCY_CONFLICT");
    }
    return { body, replayed: false };
  }

  async listEvents(scope: "public" | "staff") {
    await this.releaseExpired();
    const now = new Date();
    const events = await this.prisma.matchEvent.findMany({
      where: scope === "public" ? { startsAt: { gt: new Date(now.getTime() - 6 * 60 * 60 * 1000) } } : undefined,
      include: { sections: { orderBy: { sortOrder: "asc" } }, categories: true, orders: { where: { status: { in: OCCUPYING } }, include: { items: true } } },
      orderBy: { startsAt: "asc" },
    });
    return events.map((event) => this.toEventCard(event));
  }

  private toEventCard(event: {
    id: string;
    title: string;
    sport: string;
    venueName: string;
    venueNote: string | null;
    startsAt: Date;
    doorsAt: Date;
    salesStatus: string;
    vatRateBps: number;
    sections: { id: string; name: string; rows: number; seatsPerRow: number; sortOrder: number }[];
    categories: { id: string; sectionId: string; name: string; priceBdt: Prisma.Decimal; gateName: string }[];
    orders: { items: { sectionId: string }[] }[];
  }) {
    const soldBySection = new Map<string, number>();
    for (const order of event.orders) {
      for (const item of order.items) soldBySection.set(item.sectionId, (soldBySection.get(item.sectionId) ?? 0) + 1);
    }
    const sections = event.sections.map((section) => {
      const capacity = section.rows * section.seatsPerRow;
      const sold = soldBySection.get(section.id) ?? 0;
      const category = event.categories.find((cat) => cat.sectionId === section.id);
      return {
        id: section.id,
        name: section.name,
        rows: section.rows,
        seatsPerRow: section.seatsPerRow,
        capacity,
        sold,
        remaining: Math.max(0, capacity - sold),
        category: category
          ? { id: category.id, name: category.name, priceBdt: Number(category.priceBdt), gateName: category.gateName }
          : null,
      };
    });
    const capacity = sections.reduce((sum, section) => sum + section.capacity, 0);
    const sold = sections.reduce((sum, section) => sum + section.sold, 0);
    const fromPrice = sections.reduce<number | null>((min, section) => {
      if (!section.category) return min;
      return min === null ? section.category.priceBdt : Math.min(min, section.category.priceBdt);
    }, null);
    return {
      id: event.id,
      title: event.title,
      sport: event.sport,
      venueName: event.venueName,
      venueNote: event.venueNote,
      startsAt: event.startsAt,
      doorsAt: event.doorsAt,
      salesStatus: sold >= capacity && capacity > 0 ? "SOLD_OUT" : event.salesStatus,
      vatRateBps: event.vatRateBps,
      capacity,
      sold,
      remaining: Math.max(0, capacity - sold),
      fromPriceBdt: fromPrice,
      sections,
      imageNote: "Placeholder imagery. Licensed Bashundhara Sports City photography is not yet available (OD-08).",
    };
  }

  async getEvent(id: string) {
    await this.releaseExpired();
    const event = await this.prisma.matchEvent.findUnique({
      where: { id },
      include: {
        sections: { orderBy: { sortOrder: "asc" } },
        categories: true,
        orders: { where: { status: { in: OCCUPYING } }, include: { items: true } },
      },
    });
    if (!event) throw new NotFoundException("Event not found");
    return this.toEventCard(event);
  }

  async seatMap(eventId: string) {
    await this.releaseExpired();
    const event = await this.prisma.matchEvent.findUnique({
      where: { id: eventId },
      include: { sections: { orderBy: { sortOrder: "asc" }, include: { categories: true } } },
    });
    if (!event) throw new NotFoundException("Event not found");
    const [items, holds] = await Promise.all([
      this.prisma.ticketOrderItem.findMany({
        where: { order: { eventId, status: { in: OCCUPYING } } },
        select: { sectionId: true, rowLabel: true, seatNumber: true, order: { select: { status: true } } },
      }),
      this.prisma.seatHold.findMany({
        where: { eventId, expiresAt: { gt: new Date() } },
        select: { sectionId: true, rowLabel: true, seatNumber: true },
      }),
    ]);
    const sold = new Set(items.map((item) => `${item.sectionId}:${item.rowLabel}:${item.seatNumber}`));
    const held = new Set(holds.map((hold) => `${hold.sectionId}:${hold.rowLabel}:${hold.seatNumber}`));
    return {
      eventId,
      salesStatus: event.salesStatus,
      sections: event.sections.map((section) => ({
        id: section.id,
        name: section.name,
        category: section.categories[0]
          ? { id: section.categories[0].id, name: section.categories[0].name, priceBdt: Number(section.categories[0].priceBdt), gateName: section.categories[0].gateName }
          : null,
        rows: Array.from({ length: section.rows }, (_, rowIndex) => {
          const label = rowLabel(rowIndex);
          return {
            label,
            seats: Array.from({ length: section.seatsPerRow }, (__, seatIndex) => {
              const number = seatIndex + 1;
              const key = `${section.id}:${label}:${number}`;
              const state = sold.has(key) ? "sold" : held.has(key) ? "held" : "available";
              return { number, state };
            }),
          };
        }),
      })),
    };
  }

  async createOrder(dto: CreateTicketOrderDto, idempotencyKey: string | undefined, customerId?: string) {
    const payload = customerId ? { ...dto, customerId } : dto;
    return this.withIdempotency("ticket-order", idempotencyKey, payload, () => this.createOrderInner(dto, customerId));
  }

  private async createOrderInner(dto: CreateTicketOrderDto, customerId?: string) {
    const unique = new Set(dto.seats.map((seat) => `${seat.sectionId}:${seat.rowLabel}:${seat.seatNumber}`));
    if (unique.size !== dto.seats.length) throw new BadRequestException("Duplicate seats in the request");
    if (dto.seats.length > MAX_SEATS) throw new BadRequestException(`At most ${MAX_SEATS} seats per order`);

    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.releaseExpired(tx);
        const event = await tx.matchEvent.findUnique({
          where: { id: dto.eventId },
          include: { sections: true, categories: true },
        });
        if (!event) throw new NotFoundException("Event not found");
        if (event.salesStatus !== "ON_SALE") throw new ConflictException("Sales are closed for this event");
        if (event.startsAt.getTime() <= Date.now()) throw new ConflictException("This event has already started");

        const now = new Date();
        let subtotal = 0;
        const resolved: { sectionId: string; categoryId: string; rowLabel: string; seatNumber: number; unitPrice: number }[] = [];
        for (const seat of dto.seats) {
          const section = event.sections.find((item) => item.id === seat.sectionId);
          const category = event.categories.find((item) => item.sectionId === seat.sectionId);
          if (!section || !category) throw new BadRequestException("Unknown section");
          const rowIndex = this.rowIndex(seat.rowLabel);
          if (rowIndex < 0 || rowIndex >= section.rows || seat.seatNumber > section.seatsPerRow) {
            throw new BadRequestException("Seat is outside this section");
          }
          const taken = await tx.ticketOrderItem.findFirst({
            where: {
              sectionId: seat.sectionId,
              rowLabel: seat.rowLabel,
              seatNumber: seat.seatNumber,
              order: { eventId: event.id, status: { in: OCCUPYING } },
            },
          });
          if (taken) throw new ConflictException("That seat was just taken. Choose another.");
          const price = Number(category.priceBdt);
          subtotal += price;
          resolved.push({ sectionId: section.id, categoryId: category.id, rowLabel: seat.rowLabel, seatNumber: seat.seatNumber, unitPrice: price });
        }

        const vat = money((subtotal * event.vatRateBps) / 10000);
        const order = await tx.ticketOrder.create({
          data: {
            reference: `BSC-${randomInt(10000000, 99999999).toString(36).toUpperCase()}${randomInt(100, 999)}`,
            eventId: event.id,
            buyerName: dto.buyerName.trim(),
            buyerMobile: dto.buyerMobile,
            buyerEmail: dto.buyerEmail.trim().toLowerCase(),
            status: "AWAITING_PAYMENT",
            holdExpiresAt: new Date(now.getTime() + HOLD_MS),
            holdCeilingAt: new Date(now.getTime() + CEILING_MS),
            subtotal: money(subtotal),
            vat,
            total: money(subtotal + vat),
            termsAccepted: true,
            customerId,
            items: { create: resolved },
          },
        });
        for (const seat of resolved) {
          await tx.seatHold.create({
            data: {
              eventId: event.id,
              sectionId: seat.sectionId,
              rowLabel: seat.rowLabel,
              seatNumber: seat.seatNumber,
              orderId: order.id,
              expiresAt: order.holdExpiresAt,
            },
          });
        }
        return this.presentOrder(order.id, tx, false);
      });
    } catch (error) {
      if (isUnique(error)) throw new ConflictException("That seat was just taken. Choose another.");
      throw error;
    }
  }

  private rowIndex(label: string): number {
    let n = 0;
    for (const char of label) n = n * 26 + (char.charCodeAt(0) - 64);
    return n - 1;
  }

  async getOrder(reference: string, mobile: string | undefined, staff: boolean) {
    await this.releaseExpired();
    const order = await this.prisma.ticketOrder.findUnique({ where: { reference } });
    if (!order || (!staff && order.buyerMobile !== mobile)) throw new NotFoundException("Order not found");
    return this.presentOrder(order.id, this.prisma, staff || order.buyerMobile === mobile);
  }

  private async presentOrder(id: string, tx: Tx, includeTokens: boolean) {
    const order = await tx.ticketOrder.findUnique({
      where: { id },
      include: {
        event: { select: { id: true, title: true, sport: true, venueName: true, startsAt: true, doorsAt: true, vatRateBps: true } },
        items: { include: { ticket: true } },
        payment: true,
        refunds: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!order) throw new NotFoundException("Order not found");
    const sections = await tx.eventSection.findMany({ where: { eventId: order.eventId } });
    const categories = await tx.ticketCategory.findMany({ where: { eventId: order.eventId } });
    return {
      reference: order.reference,
      status: order.status,
      holdExpiresAt: order.holdExpiresAt,
      holdCeilingAt: order.holdCeilingAt,
      subtotal: Number(order.subtotal),
      vat: Number(order.vat),
      total: Number(order.total),
      vatRateBps: order.event.vatRateBps,
      vatNote: "VAT rate is stored per event and is pending Finance and Legal confirmation.",
      buyerName: order.buyerName,
      buyerMobile: order.buyerMobile,
      buyerEmail: order.buyerEmail,
      event: order.event,
      sandboxPayments: this.sandboxEnabled(),
      items: order.items.map((item) => ({
        id: item.id,
        sectionId: item.sectionId,
        sectionName: sections.find((section) => section.id === item.sectionId)?.name ?? "",
        categoryName: categories.find((category) => category.id === item.categoryId)?.name ?? "",
        gateName: categories.find((category) => category.id === item.categoryId)?.gateName ?? "",
        rowLabel: item.rowLabel,
        seatNumber: item.seatNumber,
        unitPrice: Number(item.unitPrice),
        ticket: item.ticket
          ? {
              id: item.ticket.id,
              status: item.ticket.status,
              gateName: item.ticket.gateName,
              token: includeTokens ? item.ticket.tokenPlain : undefined,
            }
          : null,
      })),
      payment: order.payment
        ? {
            method: order.payment.method,
            status: order.payment.status,
            sandbox: order.payment.sandbox,
            providerRef: order.payment.providerRef,
            failureReason: order.payment.failureReason,
          }
        : null,
      refund: order.refunds[0]
        ? { id: order.refunds[0].id, status: order.refunds[0].status, reason: order.refunds[0].reason }
        : null,
    };
  }

  async pay(reference: string, dto: PayTicketOrderDto, idempotencyKey: string | undefined) {
    if (!this.sandboxEnabled()) {
      throw new ServiceUnavailableException(
        "Live payment providers are not connected. Sandbox payments are switched off (OD-02).",
      );
    }
    return this.withIdempotency(`ticket-pay:${reference}`, idempotencyKey, dto, () => this.payInner(reference, dto));
  }

  private async payInner(reference: string, dto: PayTicketOrderDto) {
    const existing = await this.prisma.ticketOrder.findUnique({ where: { reference } });
    if (!existing || existing.buyerMobile !== dto.buyerMobile) throw new NotFoundException("Order not found");
    if (existing.status === "CONFIRMED") return this.presentOrder(existing.id, this.prisma, true);
    if (!["AWAITING_PAYMENT", "PAYMENT_FAILED_RETRY_HOLD"].includes(existing.status)) {
      throw new ConflictException(`This order is ${existing.status} and cannot be paid`);
    }

    await this.releaseExpired();
    const fresh = await this.prisma.ticketOrder.findUnique({ where: { id: existing.id } });
    if (!fresh || fresh.status === "EXPIRED" || fresh.holdExpiresAt.getTime() <= Date.now()) {
      throw new ConflictException("The seat hold has expired. Start the booking again.");
    }

    const providerRef = `SANDBOX-${randomBytes(4).toString("hex")}`;
    if (dto.simulateFailure) {
      const now = new Date();
      const retryEnd = new Date(Math.min(now.getTime() + HOLD_MS, fresh.holdCeilingAt.getTime()));
      const expired = retryEnd.getTime() <= now.getTime();
      await this.prisma.ticketPayment.upsert({
        where: { orderId: fresh.id },
        create: { orderId: fresh.id, method: dto.method, status: "FAILED", sandbox: true, providerRef, failureReason: "Sandbox decline" },
        update: { method: dto.method, status: "FAILED", sandbox: true, providerRef, failureReason: "Sandbox decline" },
      });
      if (expired) {
        await this.prisma.seatHold.deleteMany({ where: { orderId: fresh.id } });
        await this.prisma.ticketOrder.update({ where: { id: fresh.id }, data: { status: "EXPIRED" } });
      } else {
        await this.prisma.seatHold.updateMany({ where: { orderId: fresh.id }, data: { expiresAt: retryEnd } });
        await this.prisma.ticketOrder.update({
          where: { id: fresh.id },
          data: { status: "PAYMENT_FAILED_RETRY_HOLD", holdExpiresAt: retryEnd },
        });
      }
      return this.presentOrder(fresh.id, this.prisma, true);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.ticketPayment.upsert({
        where: { orderId: fresh.id },
        create: { orderId: fresh.id, method: dto.method, status: "CAPTURED", sandbox: true, providerRef },
        update: { method: dto.method, status: "CAPTURED", sandbox: true, providerRef, failureReason: null },
      });
      await tx.ticketOrder.update({ where: { id: fresh.id }, data: { status: "CONFIRMED" } });
      await tx.seatHold.deleteMany({ where: { orderId: fresh.id } });
      const items = await tx.ticketOrderItem.findMany({ where: { orderId: fresh.id } });
      const categories = await tx.ticketCategory.findMany({ where: { eventId: fresh.eventId } });
      for (const item of items) {
        const existingTicket = await tx.issuedTicket.findUnique({ where: { itemId: item.id } });
        if (existingTicket) continue;
        const token = randomBytes(24).toString("base64url");
        const gateName = categories.find((category) => category.id === item.categoryId)?.gateName ?? "Main Gate";
        await tx.issuedTicket.create({
          data: { orderId: fresh.id, itemId: item.id, tokenHash: hashToken(token), tokenPlain: token, gateName, status: "VALID" },
        });
      }
    });
    return this.presentOrder(fresh.id, this.prisma, true);
  }

  async requestCancel(reference: string, dto: CancelTicketOrderDto, idempotencyKey: string | undefined) {
    return this.withIdempotency(`ticket-cancel:${reference}`, idempotencyKey, dto, async () => {
      const order = await this.prisma.ticketOrder.findUnique({ where: { reference }, include: { event: true, refunds: true } });
      if (!order || order.buyerMobile !== dto.buyerMobile) throw new NotFoundException("Order not found");
      if (order.status !== "CONFIRMED") throw new ConflictException("Only a confirmed order can be cancelled");
      if (order.event.startsAt.getTime() <= Date.now()) throw new ConflictException("This event has started. Cancellation is closed.");
      if (order.refunds.some((refund) => refund.status === "REQUESTED" || refund.status === "APPROVED")) {
        throw new ConflictException("A cancellation request is already open");
      }
      await this.prisma.refundRequest.create({ data: { orderId: order.id, reason: dto.reason.trim(), status: "REQUESTED" } });
      await this.prisma.ticketOrder.update({ where: { id: order.id }, data: { status: "CANCEL_REQUESTED" } });
      return this.presentOrder(order.id, this.prisma, true);
    });
  }

  async createEvent(dto: CreateMatchEventDto, userId: string, idempotencyKey: string | undefined) {
    return this.withIdempotency("ticket-event", idempotencyKey, dto, async () => {
      const startsAt = new Date(dto.startsAt);
      const doorsAt = new Date(dto.doorsAt);
      if (Number.isNaN(startsAt.getTime()) || Number.isNaN(doorsAt.getTime())) throw new BadRequestException("Invalid date");
      if (doorsAt.getTime() >= startsAt.getTime()) throw new BadRequestException("Doors must open before the event starts");
      const event = await this.prisma.matchEvent.create({
        data: {
          title: dto.title.trim(),
          sport: dto.sport.trim(),
          venueName: dto.venueName.trim(),
          venueNote: dto.venueNote?.trim(),
          startsAt,
          doorsAt,
          vatRateBps: dto.vatRateBps ?? 1500,
          salesStatus: "ON_SALE",
        },
      });
      for (const [index, section] of dto.sections.entries()) {
        const created = await this.prisma.eventSection.create({
          data: { eventId: event.id, name: section.name.trim(), rows: section.rows, seatsPerRow: section.seatsPerRow, sortOrder: index },
        });
        await this.prisma.ticketCategory.create({
          data: {
            eventId: event.id,
            sectionId: created.id,
            name: section.name.trim(),
            priceBdt: money(section.priceBdt),
            gateName: section.gateName.trim(),
          },
        });
      }
      await this.audit.record({
        entityType: "MatchEvent",
        entityId: event.id,
        action: "CREATE_WITH_PRICES",
        userId,
        after: { title: event.title, vatRateBps: event.vatRateBps, sections: dto.sections },
      });
      return this.getEvent(event.id);
    });
  }

  async setSalesStatus(id: string, salesStatus: string, userId: string) {
    const before = await this.prisma.matchEvent.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Event not found");
    const updated = await this.prisma.matchEvent.update({ where: { id }, data: { salesStatus } });
    await this.audit.record({
      entityType: "MatchEvent",
      entityId: id,
      action: "SET_SALES_STATUS",
      userId,
      before: { salesStatus: before.salesStatus },
      after: { salesStatus },
    });
    return { id: updated.id, salesStatus: updated.salesStatus };
  }

  async listOrders(search?: string, status?: string) {
    await this.releaseExpired();
    const orders = await this.prisma.ticketOrder.findMany({
      where: {
        status: status || undefined,
        OR: search
          ? [
              { reference: { contains: search, mode: "insensitive" } },
              { buyerName: { contains: search, mode: "insensitive" } },
              { buyerMobile: { contains: search } },
            ]
          : undefined,
      },
      include: { event: { select: { title: true, startsAt: true } }, payment: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return orders.map((order) => ({
      reference: order.reference,
      status: order.status,
      buyerName: order.buyerName,
      buyerMobile: order.buyerMobile,
      total: Number(order.total),
      seats: order.items.length,
      eventTitle: order.event.title,
      startsAt: order.event.startsAt,
      paymentStatus: order.payment?.status ?? null,
      paymentMethod: order.payment?.method ?? null,
      sandbox: order.payment?.sandbox ?? null,
      createdAt: order.createdAt,
      holdExpiresAt: order.holdExpiresAt,
    }));
  }

  async listRefunds() {
    return this.prisma.refundRequest.findMany({
      include: { order: { select: { reference: true, total: true, buyerName: true, status: true, event: { select: { title: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async decideRefund(id: string, decision: string, userId: string, idempotencyKey: string | undefined) {
    return this.withIdempotency(`refund:${id}`, idempotencyKey, { decision }, async () => {
      const refund = await this.prisma.refundRequest.findUnique({ where: { id }, include: { order: { include: { payment: true } } } });
      if (!refund) throw new NotFoundException("Refund request not found");
      if (refund.status !== "REQUESTED") throw new ConflictException("This request is already decided");
      if (decision === "APPROVED") {
        await this.prisma.$transaction([
          this.prisma.refundRequest.update({ where: { id }, data: { status: "APPROVED", decidedById: userId, decidedAt: new Date() } }),
          this.prisma.ticketOrder.update({ where: { id: refund.orderId }, data: { status: "REFUNDED" } }),
          this.prisma.issuedTicket.updateMany({ where: { orderId: refund.orderId }, data: { status: "REVOKED" } }),
          this.prisma.ticketPayment.updateMany({ where: { orderId: refund.orderId }, data: { status: "REFUNDED" } }),
          this.prisma.seatHold.deleteMany({ where: { orderId: refund.orderId } }),
        ]);
      } else {
        await this.prisma.$transaction([
          this.prisma.refundRequest.update({ where: { id }, data: { status: "REJECTED", decidedById: userId, decidedAt: new Date() } }),
          this.prisma.ticketOrder.update({ where: { id: refund.orderId }, data: { status: "CONFIRMED" } }),
        ]);
      }
      await this.audit.record({
        entityType: "RefundRequest",
        entityId: id,
        action: decision === "APPROVED" ? "APPROVE_REFUND" : "REJECT_REFUND",
        userId,
        before: { status: "REQUESTED", orderStatus: refund.order.status },
        after: { status: decision, sandbox: true },
      });
      return { id, status: decision };
    });
  }

  async verify(dto: VerifyAccessDto, idempotencyKey: string | undefined) {
    return this.withIdempotency(`access:${dto.deviceId}:${dto.scanId}`, idempotencyKey, dto, () => this.verifyInner(dto));
  }

  private async verifyInner(dto: VerifyAccessDto) {
    const prior = await this.prisma.accessVerification.findUnique({
      where: { deviceId_scanId: { deviceId: dto.deviceId, scanId: dto.scanId } },
    });
    if (prior) {
      return { decision: prior.decision === "ALLOW" ? "ALLOW" : "DENY", reason: prior.reason, replayedScan: true };
    }
    const ticket = await this.prisma.issuedTicket.findUnique({
      where: { tokenHash: hashToken(dto.credentialToken.trim()) },
      include: { order: { include: { event: true } }, item: true },
    });
    let decision = "DENY";
    let reason = "CREDENTIAL_INVALID";
    let detail: Record<string, string | number> | undefined;
    if (ticket) {
      const event = ticket.order.event;
      const windowEnd = event.startsAt.getTime() + 4 * 60 * 60 * 1000;
      const gate = dto.gateId ? await this.prisma.gate.findUnique({ where: { id: dto.gateId } }) : null;
      const wrongGate = Boolean(gate && gate.name.toLowerCase() !== ticket.gateName.toLowerCase());
      if (wrongGate) reason = "WRONG_GATE";
      else if (ticket.status === "REVOKED") reason = "CREDENTIAL_REVOKED";
      else if (Date.now() > windowEnd) reason = "EXPIRED";
      else if (Date.now() < event.doorsAt.getTime()) reason = "NOT_YET_VALID";
      else if (dto.direction === "IN" && ticket.status === "USED") reason = "ALREADY_USED";
      else if (dto.direction === "OUT" && ticket.status !== "USED") reason = "NOT_ENTERED";
      else {
        decision = "ALLOW";
        reason = "OK";
        if (dto.direction === "IN" && ticket.status === "VALID") {
          await this.prisma.issuedTicket.update({ where: { id: ticket.id }, data: { status: "USED", usedAt: new Date() } });
        }
      }
      if (decision === "ALLOW" || ["ALREADY_USED", "WRONG_GATE", "EXPIRED", "NOT_YET_VALID"].includes(reason)) {
        detail = {
          eventTitle: event.title,
          row: ticket.item.rowLabel,
          seat: ticket.item.seatNumber,
          gateName: ticket.gateName,
          firstName: ticket.order.buyerName.split(" ")[0] ?? "",
        };
      }
    }
    await this.prisma.accessVerification.create({
      data: { deviceId: dto.deviceId, scanId: dto.scanId, direction: dto.direction, decision, reason, ticketId: ticket?.id, gateId: dto.gateId },
    });
    return { decision, reason, detail: decision === "ALLOW" || reason === "ALREADY_USED" || reason === "WRONG_GATE" || reason === "EXPIRED" || reason === "NOT_YET_VALID" ? detail : undefined };
  }

  async analytics() {
    await this.releaseExpired();
    const orders = await this.prisma.ticketOrder.findMany({
      include: { items: true, payment: true, tickets: true, event: { select: { id: true, title: true, startsAt: true } } },
    });
    const dayKey = (value: Date) => value.toISOString().slice(0, 10);
    const byDay = new Map<string, { tickets: number; revenue: number }>();
    const byCategoryCount = new Map<string, number>();
    let captured = 0;
    let failed = 0;
    let refunded = 0;
    let revenue = 0;
    for (const order of orders) {
      if (order.payment?.status === "FAILED") failed += 1;
      if (order.payment?.status === "REFUNDED" || order.status === "REFUNDED") refunded += 1;
      if (order.status === "CONFIRMED" || order.status === "CANCEL_REQUESTED") {
        captured += 1;
        revenue += Number(order.total);
        const key = dayKey(order.createdAt);
        const bucket = byDay.get(key) ?? { tickets: 0, revenue: 0 };
        bucket.tickets += order.items.length;
        bucket.revenue += Number(order.total);
        byDay.set(key, bucket);
      }
    }
    const categories = await this.prisma.ticketCategory.findMany({ include: { section: true } });
    const soldItems = await this.prisma.ticketOrderItem.findMany({
      where: { order: { status: { in: ["CONFIRMED", "CANCEL_REQUESTED"] } } },
      select: { categoryId: true },
    });
    for (const item of soldItems) byCategoryCount.set(item.categoryId, (byCategoryCount.get(item.categoryId) ?? 0) + 1);

    const scans = await this.prisma.accessVerification.findMany({ orderBy: { createdAt: "asc" }, take: 2000 });
    const scansByHour = new Map<string, number>();
    let admits = 0;
    let denies = 0;
    for (const scan of scans) {
      const hour = scan.createdAt.toISOString().slice(0, 13) + ":00";
      scansByHour.set(hour, (scansByHour.get(hour) ?? 0) + 1);
      if (scan.decision === "ALLOW") admits += 1;
      else denies += 1;
    }
    const used = await this.prisma.issuedTicket.count({ where: { status: "USED" } });
    const valid = await this.prisma.issuedTicket.count({ where: { status: "VALID" } });
    const events = await this.listEvents("staff");
    return {
      currency: "BDT",
      timezone: "Asia/Dhaka",
      generatedAt: new Date().toISOString(),
      ordersTotal: orders.length,
      ticketsSold: soldItems.length,
      revenueConfirmed: money(revenue),
      payments: { captured, failed, refunded },
      salesByDay: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, ...value, revenue: money(value.revenue) })),
      byCategory: categories.map((category) => ({
        name: `${category.name}`,
        eventId: category.eventId,
        sold: byCategoryCount.get(category.id) ?? 0,
        capacity: category.section.rows * category.section.seatsPerRow,
      })),
      byChannel: [{ channel: "Web", count: orders.filter((order) => order.status === "CONFIRMED" || order.status === "CANCEL_REQUESTED").length }],
      checkIn: { admitted: used, notYetAdmitted: valid, scanAllows: admits, scanDenies: denies },
      scansByHour: [...scansByHour.entries()].map(([hour, count]) => ({ hour, count })),
      events: events.map((event) => ({ id: event.id, title: event.title, sold: event.sold, capacity: event.capacity, remaining: event.remaining })),
      recentOrders: orders.slice(0, 8).map((order) => ({
        reference: order.reference,
        status: order.status,
        total: Number(order.total),
        eventTitle: order.event.title,
        createdAt: order.createdAt,
      })),
    };
  }
}
