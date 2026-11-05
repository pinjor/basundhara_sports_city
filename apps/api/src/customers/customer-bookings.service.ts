import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { BookingStatus, BookingType, ClosureStatus, FacilityStatus, PaymentStatus, Role } from "@bsc/shared";
import { PrismaService } from "../prisma/prisma.service";
import { BookingsService } from "../bookings/bookings.service";
import { NotificationService } from "../common/notification.service";
import { IdempotencyService } from "../common/idempotency.service";
import { ReferenceService } from "../common/reference.service";
import { coversDay, dayWindow, findClash, holdingSlot, minutes, overlaps } from "../bookings/booking-time";
import { adjustedPrice, applicableRules } from "../booking-ops/pricing";
import type { RequestCustomer } from "../auth/customer-jwt.strategy";
import { CustomerInboxService } from "./customer-inbox.service";
import { assertSandboxPayments, DHAKA_OFFSET_MS, dhakaToday, PaymentDeclinedException, sandboxRef } from "./sandbox-payment";
import type { CustomerBookingDto, CustomerPayDto, GuestBookingDto, GuestPayDto } from "./dto/customer.dto";

/** Staff record that customer-app actions are attributed to in the audit log. It can never sign in. */
export const CUSTOMER_APP_USER_ID = "customer-app";

const BOOKING_WINDOW_DAYS = 90;
/** An unpaid app booking keeps its slot this long. */
export const BOOKING_HOLD_MS = 10 * 60 * 1000;
const SLOT_TAKEN = "That slot is no longer available. Choose another time.";

@Injectable()
export class CustomerBookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookings: BookingsService,
    private readonly notifications: NotificationService,
    private readonly idempotency: IdempotencyService,
    private readonly references: ReferenceService,
    private readonly inbox: CustomerInboxService,
  ) {}

  async facilities() {
    const facilities = await this.prisma.facility.findMany({
      where: { slots: { some: { status: "ACTIVE" } } },
      include: { zone: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });
    return facilities.map((facility) => ({
      id: facility.id,
      name: facility.name,
      type: facility.type,
      capacity: facility.capacity,
      zone: facility.zone,
      operatingHours: { start: facility.operatingHoursStart, end: facility.operatingHoursEnd },
      bookable: facility.status !== FacilityStatus.MAINTENANCE,
    }));
  }

  /** Bookable slots for one day with today's price and whether each is still free. */
  async slots(facilityId: string, rawDate: string) {
    const date = this.playDate(rawDate);
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
      include: { surfaces: { where: { closureStatus: { not: ClosureStatus.OPEN } }, select: { id: true } } },
    });
    if (!facility) throw new NotFoundException("Facility not found");
    await this.releaseExpiredHolds();
    const [slots, rules, taken] = await Promise.all([
      this.prisma.slot.findMany({ where: { facilityId, status: "ACTIVE" }, orderBy: { timeSlotStart: "asc" } }),
      this.prisma.pricingRule.findMany({ where: { status: "ACTIVE" } }),
      this.prisma.booking.findMany({
        where: { facilityId, date: dayWindow(date), ...holdingSlot() },
        select: { timeSlotStart: true, timeSlotEnd: true },
      }),
    ]);
    const closed = facility.status === FacilityStatus.MAINTENANCE || facility.surfaces.length > 0;
    return slots
      .filter((slot) => coversDay(slot.dayOfWeek, date))
      .map((slot) => ({
        id: slot.id,
        timeSlotStart: slot.timeSlotStart,
        timeSlotEnd: slot.timeSlotEnd,
        capacity: slot.capacity,
        price: adjustedPrice(Number(slot.priceBdt), applicableRules(rules, facilityId, date, slot.timeSlotStart)),
        available:
          !closed &&
          !this.started(date, slot.timeSlotStart) &&
          !taken.some((booking) => overlaps(slot.timeSlotStart, slot.timeSlotEnd, booking.timeSlotStart, booking.timeSlotEnd, facility.bufferMinutes)),
      }));
  }

  /**
   * Holds the slot for 10 minutes as a Pending, unpaid booking. Paying confirms it; an unpaid hold
   * lapses and the slot opens again.
   */
  request(customer: RequestCustomer, dto: CustomerBookingDto) {
    return this.holdSlot({
      slotId: dto.slotId,
      date: dto.date,
      customerName: customer.name,
      customerId: customer.id,
      detail: [`Customer app · ${customer.mobile}`, dto.note?.trim()].filter(Boolean).join(" · "),
    });
  }

  guestHold(dto: GuestBookingDto) {
    return this.holdSlot({
      slotId: dto.slotId,
      date: dto.date,
      customerName: dto.buyerName.trim(),
      detail: `${this.guestTag(dto.buyerMobile)}${dto.buyerEmail}`,
    });
  }

  async guestGet(id: string, mobile: string) {
    return this.present(await this.ownGuest(id, mobile));
  }

  guestPay(id: string, dto: GuestPayDto, key: string | undefined) {
    return this.settlePay(id, dto, key, async () => this.ownGuest(id, dto.buyerMobile));
  }

  /** Requires an `Idempotency-Key`. Sandbox payment that confirms a held booking. */
  pay(customer: RequestCustomer, id: string, dto: CustomerPayDto, key: string | undefined) {
    return this.settlePay(id, dto, key, async () => this.own(customer.id, id), customer.id);
  }

  async list(customerId: string) {
    await this.releaseExpiredHolds();
    const rows = await this.prisma.booking.findMany({
      where: { customerId },
      include: { facility: { select: { id: true, name: true } } },
      orderBy: [{ date: "desc" }, { timeSlotStart: "desc" }],
    });
    return rows.map((row) => this.present(row));
  }

  async get(customerId: string, id: string) {
    return this.present(await this.own(customerId, id));
  }

  async cancel(customerId: string, id: string) {
    const booking = await this.own(customerId, id);
    if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.CONFIRMED) {
      throw new ConflictException(`A ${booking.status.toLowerCase()} booking cannot be cancelled`);
    }
    if (this.started(booking.date, booking.timeSlotStart)) throw new ConflictException("This booking has already started");
    await this.ensureAppUser();
    const cancelled = await this.bookings.setStatus(id, BookingStatus.CANCELLED, CUSTOMER_APP_USER_ID);
    if (booking.paymentStatus === PaymentStatus.PAID) {
      await this.notifications.notify({
        title: "Paid booking cancelled",
        body: `${booking.customerName} cancelled ${booking.facility.name} on ${booking.date.toISOString().slice(0, 10)}. A refund decision is due.`,
        href: `/bookings?status=${encodeURIComponent(BookingStatus.CANCELLED)}`,
        role: Role.BOOKINGS_OFFICER,
      });
    }
    return this.present(cancelled);
  }

  /** Unpaid app bookings whose hold ran out are cancelled so they stop showing as pending. */
  private async releaseExpiredHolds() {
    const expired = await this.prisma.booking.findMany({
      where: { status: BookingStatus.PENDING, holdExpiresAt: { lt: new Date() } },
      select: { id: true },
    });
    if (expired.length === 0) return;
    await this.ensureAppUser();
    const ids = expired.map((row) => row.id);
    await this.prisma.$transaction([
      this.prisma.booking.updateMany({ where: { id: { in: ids }, status: BookingStatus.PENDING }, data: { status: BookingStatus.CANCELLED } }),
      this.prisma.auditLog.createMany({
        data: ids.map((entityId) => ({ entityType: "Booking", entityId, action: "HOLD_EXPIRED", userId: CUSTOMER_APP_USER_ID })),
      }),
    ]);
  }

  private guestTag(mobile: string) {
    return `guest:${mobile}|`;
  }

  private async holdSlot(input: { slotId: string; date: string; customerName: string; customerId?: string; detail: string }) {
    await this.releaseExpiredHolds();
    const date = this.playDate(input.date);
    const slot = await this.prisma.slot.findUnique({ where: { id: input.slotId } });
    if (!slot || slot.status !== "ACTIVE" || !coversDay(slot.dayOfWeek, date)) throw new BadRequestException("That slot is not offered on this day");
    if (this.started(date, slot.timeSlotStart)) throw new BadRequestException("That slot has already started");
    const facility = await this.prisma.facility.findUniqueOrThrow({ where: { id: slot.facilityId } });
    if (facility.status === FacilityStatus.MAINTENANCE) throw new ConflictException("This facility is closed for maintenance");
    const day = date.toISOString().slice(0, 10);
    if (await findClash(this.prisma, { facilityId: slot.facilityId, date, start: slot.timeSlotStart, end: slot.timeSlotEnd })) {
      throw new ConflictException(SLOT_TAKEN);
    }
    const rules = await this.prisma.pricingRule.findMany({ where: { status: "ACTIVE" } });
    await this.ensureAppUser();
    let booking: Awaited<ReturnType<BookingsService["create"]>>;
    try {
      booking = await this.bookings.create(
        {
          facilityId: slot.facilityId,
          customerName: input.customerName,
          type: BookingType.PUBLIC,
          date: day,
          timeSlotStart: slot.timeSlotStart,
          timeSlotEnd: slot.timeSlotEnd,
          amount: adjustedPrice(Number(slot.priceBdt), applicableRules(rules, slot.facilityId, date, slot.timeSlotStart)),
          detail: input.detail,
        },
        CUSTOMER_APP_USER_ID,
        input.customerId,
      );
    } catch (error) {
      if (error instanceof ConflictException) throw new ConflictException(SLOT_TAKEN);
      throw error;
    }
    const held = await this.prisma.booking.update({
      where: { id: booking.id },
      data: { holdExpiresAt: new Date(Date.now() + BOOKING_HOLD_MS) },
      include: { facility: { select: { id: true, name: true } } },
    });
    return this.present(held);
  }

  private settlePay(
    id: string,
    dto: CustomerPayDto | GuestPayDto,
    key: string | undefined,
    load: () => Promise<{
      id: string;
      status: string;
      paymentStatus: string;
      holdExpiresAt: Date | null;
      amount: unknown;
      customerName: string;
      timeSlotStart: string;
      timeSlotEnd: string;
      date: Date;
      facility: { id: string; name: string };
      customerId: string | null;
    }>,
    inboxCustomerId?: string,
  ) {
    assertSandboxPayments();
    return this.idempotency.run(`booking-pay:${id}`, key, dto, async () => {
      const booking = await load();
      if (booking.status === BookingStatus.CONFIRMED && booking.paymentStatus === PaymentStatus.PAID) return this.present(booking as never);
      if (booking.status !== BookingStatus.PENDING) throw new ConflictException(`A ${booking.status.toLowerCase()} booking cannot be paid`);
      if (booking.holdExpiresAt && booking.holdExpiresAt.getTime() <= Date.now()) {
        throw new ConflictException("The hold on this slot has expired. Choose the slot again.");
      }
      if (dto.simulateFailure) throw new PaymentDeclinedException();
      await this.ensureAppUser();
      await this.bookings.setStatus(id, BookingStatus.CONFIRMED, CUSTOMER_APP_USER_ID);
      await this.prisma.$transaction(async (tx) => {
        await tx.bookingPayment.create({
          data: {
            reference: await this.references.next("BKP", tx),
            status: "CAPTURED",
            bookingId: id,
            amountBdt: Number(booking.amount),
            method: dto.method,
            gatewayRef: sandboxRef(),
            createdById: CUSTOMER_APP_USER_ID,
          },
        });
        await tx.booking.update({ where: { id }, data: { paymentStatus: PaymentStatus.PAID, holdExpiresAt: null } });
        const day = booking.date.toISOString().slice(0, 10);
        await this.notifications.notify(
          {
            title: "New paid booking",
            body: `${booking.customerName} booked ${booking.facility.name} on ${day}, ${booking.timeSlotStart}-${booking.timeSlotEnd}.`,
            href: `/bookings?status=${encodeURIComponent(BookingStatus.CONFIRMED)}`,
            role: Role.BOOKINGS_OFFICER,
          },
          tx,
        );
        if (inboxCustomerId) {
          await this.inbox.notify(inboxCustomerId, "Booking confirmed", `${booking.facility.name} · ${day} · ${booking.timeSlotStart}`, tx);
        }
      });
      return this.present((await load()) as never);
    });
  }

  private async ownGuest(id: string, mobile: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id }, include: { facility: { select: { id: true, name: true } } } });
    if (!booking?.detail?.startsWith(this.guestTag(mobile))) throw new NotFoundException("Booking not found");
    return booking;
  }

  private async own(customerId: string, id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id }, include: { facility: { select: { id: true, name: true } } } });
    if (!booking || booking.customerId !== customerId) throw new NotFoundException("Booking not found");
    return booking;
  }

  private present(booking: {
    id: string;
    facility: { id: string; name: string };
    date: Date;
    timeSlotStart: string;
    timeSlotEnd: string;
    status: string;
    amount: unknown;
    paymentStatus: string;
    qrConfirmationCode: string;
    holdExpiresAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: booking.id,
      facility: { id: booking.facility.id, name: booking.facility.name },
      date: booking.date.toISOString().slice(0, 10),
      timeSlotStart: booking.timeSlotStart,
      timeSlotEnd: booking.timeSlotEnd,
      status: booking.status,
      amount: Number(booking.amount),
      paymentStatus: booking.paymentStatus,
      /** Pay before this time or the slot is released. Null once paid. */
      holdExpiresAt: booking.status === BookingStatus.PENDING ? booking.holdExpiresAt : null,
      /** Shown at the venue; only issued once the booking is confirmed. */
      qrCode: booking.status === BookingStatus.CONFIRMED ? booking.qrConfirmationCode : null,
      createdAt: booking.createdAt,
    };
  }

  /** YYYY-MM-DD within today (Dhaka) and the booking window. */
  private playDate(raw: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw ?? "")) throw new BadRequestException("date must be YYYY-MM-DD");
    const date = new Date(`${raw}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new BadRequestException("date is not a real day");
    const today = dhakaToday();
    const days = Math.round((date.getTime() - today.getTime()) / 86_400_000);
    if (days < 0) throw new BadRequestException("date is in the past");
    if (days > BOOKING_WINDOW_DAYS) throw new BadRequestException(`Bookings open ${BOOKING_WINDOW_DAYS} days ahead`);
    return date;
  }

  private started(date: Date, start: string): boolean {
    return date.getTime() + minutes(start) * 60_000 - DHAKA_OFFSET_MS <= Date.now();
  }

  private ensureAppUser() {
    return this.prisma.user.upsert({
      where: { id: CUSTOMER_APP_USER_ID },
      update: {},
      create: {
        id: CUSTOMER_APP_USER_ID,
        name: "Customer app",
        email: "customer-app@system.invalid",
        passwordHash: "!",
        role: Role.READ_ONLY_EXECUTIVE,
        active: false,
      },
    });
  }
}
