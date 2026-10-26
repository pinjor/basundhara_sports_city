import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TicketingService } from "../ticketing/ticketing.service";
import type { RequestCustomer } from "../auth/customer-jwt.strategy";
import type { CustomerCancelOrderDto, CustomerPayDto, CustomerTicketOrderDto } from "./dto/customer.dto";

/** The signed-in customer's ticket orders. Ownership replaces the reference + mobile check of the guest flow. */
@Injectable()
export class CustomerTicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketing: TicketingService,
  ) {}

  async list(customerId: string) {
    const orders = await this.prisma.ticketOrder.findMany({
      where: { customerId },
      include: {
        event: { select: { id: true, title: true, sport: true, venueName: true, startsAt: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((order) => ({
      reference: order.reference,
      status: order.status,
      event: order.event,
      seats: order._count.items,
      total: Number(order.total),
      holdExpiresAt: order.holdExpiresAt,
      createdAt: order.createdAt,
    }));
  }

  create(customer: RequestCustomer, dto: CustomerTicketOrderDto, idempotencyKey: string | undefined) {
    return this.ticketing.createOrder(
      {
        eventId: dto.eventId,
        buyerName: customer.name,
        buyerMobile: customer.mobile,
        buyerEmail: customer.email,
        termsAccepted: dto.termsAccepted,
        seats: dto.seats,
      },
      idempotencyKey,
      customer.id,
    );
  }

  async get(customerId: string, reference: string) {
    const order = await this.own(customerId, reference);
    return this.ticketing.getOrder(reference, order.buyerMobile, false);
  }

  async pay(customerId: string, reference: string, dto: CustomerPayDto, idempotencyKey: string | undefined) {
    const order = await this.own(customerId, reference);
    return this.ticketing.pay(reference, { buyerMobile: order.buyerMobile, method: dto.method, simulateFailure: dto.simulateFailure }, idempotencyKey);
  }

  async cancel(customerId: string, reference: string, dto: CustomerCancelOrderDto, idempotencyKey: string | undefined) {
    const order = await this.own(customerId, reference);
    return this.ticketing.requestCancel(reference, { buyerMobile: order.buyerMobile, reason: dto.reason }, idempotencyKey);
  }

  private async own(customerId: string, reference: string) {
    const order = await this.prisma.ticketOrder.findUnique({ where: { reference }, select: { customerId: true, buyerMobile: true } });
    if (!order || order.customerId !== customerId) throw new NotFoundException("Order not found");
    return order;
  }
}
