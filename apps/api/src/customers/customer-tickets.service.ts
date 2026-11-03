import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { IdempotencyService } from "../common/idempotency.service";
import { TicketingService } from "../ticketing/ticketing.service";
import type { RequestCustomer } from "../auth/customer-jwt.strategy";
import { CustomerInboxService } from "./customer-inbox.service";
import type { CustomerCancelOrderDto, CustomerPayDto, CustomerTicketOrderDto } from "./dto/customer.dto";

interface SeatPick {
  sectionId: string;
  rowLabel: string;
  seatNumber: number;
}

/** The signed-in customer's ticket orders. Ownership replaces the reference + mobile check of the guest flow. */
@Injectable()
export class CustomerTicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketing: TicketingService,
    private readonly idempotency: IdempotencyService,
    private readonly inbox: CustomerInboxService,
  ) {}

  /** Orders with their issued tickets; the QR token is included because the buyer is signed in. */
  async list(customerId: string) {
    const orders = await this.prisma.ticketOrder.findMany({
      where: { customerId },
      include: {
        event: { select: { id: true, title: true, sport: true, venueName: true, startsAt: true } },
        items: { include: { ticket: true }, orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }] },
      },
      orderBy: { createdAt: "desc" },
    });
    const categoryIds = [...new Set(orders.flatMap((order) => order.items.map((item) => item.categoryId)))];
    const categories = await this.prisma.ticketCategory.findMany({ where: { id: { in: categoryIds } }, include: { section: { select: { name: true } } } });
    return orders.map((order) => ({
      reference: order.reference,
      status: order.status,
      event: order.event,
      seats: order.items.length,
      total: Number(order.total),
      holdExpiresAt: order.holdExpiresAt,
      createdAt: order.createdAt,
      tickets: order.items
        .filter((item) => item.ticket)
        .map((item) => {
          const category = categories.find((row) => row.id === item.categoryId);
          return {
            id: item.ticket!.id,
            status: item.ticket!.status,
            gateName: item.ticket!.gateName,
            token: item.ticket!.tokenPlain,
            categoryName: category?.name ?? "",
            sectionName: category?.section.name ?? "",
            rowLabel: item.rowLabel,
            seatNumber: item.seatNumber,
            unitPrice: Number(item.unitPrice),
          };
        }),
    }));
  }

  /** Exact seats, or `sectionId` + `quantity` for the best seats still free in that section. */
  async create(customer: RequestCustomer, dto: CustomerTicketOrderDto, idempotencyKey: string | undefined) {
    if (dto.seats?.length) return this.place(customer, dto, dto.seats, idempotencyKey);
    if (!dto.sectionId) throw new BadRequestException("Send seats, or sectionId and quantity");
    return this.idempotency.run(`customer-ticket-auto:${customer.id}`, idempotencyKey, dto, async () => {
      const seats = await this.bestAvailable(dto.eventId, dto.sectionId!, dto.quantity ?? 1);
      const result = await this.place(customer, dto, seats, idempotencyKey ? `${idempotencyKey}:seats` : undefined);
      return result.body;
    });
  }

  async get(customerId: string, reference: string) {
    const order = await this.own(customerId, reference);
    return this.ticketing.getOrder(reference, order.buyerMobile, false);
  }

  async pay(customerId: string, reference: string, dto: CustomerPayDto, idempotencyKey: string | undefined) {
    const order = await this.own(customerId, reference);
    const result = await this.ticketing.pay(reference, { buyerMobile: order.buyerMobile, method: dto.method, simulateFailure: dto.simulateFailure }, idempotencyKey);
    const paid = result.body as { status: string; event?: { title: string } };
    if (!result.replayed && paid.status === "CONFIRMED") {
      await this.inbox.notify(customerId, "Event ticket issued", `${paid.event?.title ?? "Event"} · ${reference}`);
    }
    return result;
  }

  async cancel(customerId: string, reference: string, dto: CustomerCancelOrderDto, idempotencyKey: string | undefined) {
    const order = await this.own(customerId, reference);
    return this.ticketing.requestCancel(reference, { buyerMobile: order.buyerMobile, reason: dto.reason }, idempotencyKey);
  }

  private place(customer: RequestCustomer, dto: CustomerTicketOrderDto, seats: SeatPick[], key: string | undefined) {
    return this.ticketing.createOrder(
      { eventId: dto.eventId, buyerName: customer.name, buyerMobile: customer.mobile, buyerEmail: customer.email, termsAccepted: dto.termsAccepted, seats },
      key,
      customer.id,
    );
  }

  /** Seats side by side in the frontmost row that has room, otherwise the first free seats. */
  private async bestAvailable(eventId: string, sectionId: string, quantity: number): Promise<SeatPick[]> {
    const map = await this.ticketing.seatMap(eventId);
    const section = map.sections.find((row) => row.id === sectionId);
    if (!section || !section.category) throw new NotFoundException("Ticket category not found");
    const free = section.rows.map((row) => ({ label: row.label, seats: row.seats.filter((seat) => seat.state === "available").map((seat) => seat.number) }));
    for (const row of free) {
      for (let index = 0; index + quantity <= row.seats.length; index++) {
        const run = row.seats.slice(index, index + quantity);
        if (run[run.length - 1]! - run[0]! === quantity - 1) return run.map((seatNumber) => ({ sectionId, rowLabel: row.label, seatNumber }));
      }
    }
    const any = free.flatMap((row) => row.seats.map((seatNumber) => ({ sectionId, rowLabel: row.label, seatNumber }))).slice(0, quantity);
    if (any.length < quantity) throw new ConflictException(`Only ${any.length} seat${any.length === 1 ? "" : "s"} left in ${section.name}`);
    return any;
  }

  private async own(customerId: string, reference: string) {
    const order = await this.prisma.ticketOrder.findUnique({ where: { reference }, select: { customerId: true, buyerMobile: true } });
    if (!order || order.customerId !== customerId) throw new NotFoundException("Order not found");
    return order;
  }
}
