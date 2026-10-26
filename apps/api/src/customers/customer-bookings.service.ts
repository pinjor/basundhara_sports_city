import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { BookingStatus, BookingType, ClosureStatus, FacilityStatus, Role } from "@bsc/shared";
import { PrismaService } from "../prisma/prisma.service";
import { BookingsService } from "../bookings/bookings.service";
import { NotificationService } from "../common/notification.service";
import { coversDay, dayWindow, findClash, minutes, overlaps } from "../bookings/booking-time";
import { adjustedPrice, applicableRules } from "../booking-ops/pricing";
import type { RequestCustomer } from "../auth/customer-jwt.strategy";
import type { CustomerBookingDto } from "./dto/customer.dto";

/** Staff record that customer-app actions are attributed to in the audit log. It can never sign in. */
export const CUSTOMER_APP_USER_ID = "customer-app";

/** Asia/Dhaka is UTC+6 all year; slot times are local. */
const DHAKA_OFFSET_MS = 6 * 3_600_000;
const BOOKING_WINDOW_DAYS = 90;
const SLOT_TAKEN = "That slot is no longer available. Choose another time.";

@Injectable()
export class CustomerBookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookings: BookingsService,
    private readonly notifications: NotificationService,
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
    const [slots, rules, taken] = await Promise.all([
      this.prisma.slot.findMany({ where: { facilityId, status: "ACTIVE" }, orderBy: { timeSlotStart: "asc" } }),
      this.prisma.pricingRule.findMany({ where: { status: "ACTIVE" } }),
      this.prisma.booking.findMany({
        where: { facilityId, date: dayWindow(date), status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] } },
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

  /** Creates a Pending request; the bookings team confirms it like any other booking. */
  async request(customer: RequestCustomer, dto: CustomerBookingDto) {
    const date = this.playDate(dto.date);
    const slot = await this.prisma.slot.findUnique({ where: { id: dto.slotId } });
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
          customerName: customer.name,
          type: BookingType.PUBLIC,
          date: day,
          timeSlotStart: slot.timeSlotStart,
          timeSlotEnd: slot.timeSlotEnd,
          amount: adjustedPrice(Number(slot.priceBdt), applicableRules(rules, slot.facilityId, date, slot.timeSlotStart)),
          detail: [`Customer app · ${customer.mobile}`, dto.note?.trim()].filter(Boolean).join(" · "),
        },
        CUSTOMER_APP_USER_ID,
        customer.id,
      );
    } catch (error) {
      if (error instanceof ConflictException) throw new ConflictException(SLOT_TAKEN);
      throw error;
    }
    await this.notifications.notify({
      title: "New booking request",
      body: `${customer.name} asked for ${facility.name} on ${day}, ${slot.timeSlotStart}-${slot.timeSlotEnd}.`,
      href: `/bookings?status=${encodeURIComponent(BookingStatus.PENDING)}`,
      role: Role.BOOKINGS_OFFICER,
    });
    return this.present(booking);
  }

  async list(customerId: string) {
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
    return this.present(await this.bookings.setStatus(id, BookingStatus.CANCELLED, CUSTOMER_APP_USER_ID));
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
    const today = new Date(Date.now() + DHAKA_OFFSET_MS);
    today.setUTCHours(0, 0, 0, 0);
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
