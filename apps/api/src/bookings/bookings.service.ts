import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { BOOKING_STATUS_TRANSITIONS, BookingStatus, ClosureStatus } from "@bsc/shared";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { EventsService } from "../events/events.service";
import { assertNoClash } from "./booking-time";
import { CreateBookingDto } from "./dto/create-booking.dto";

const BOOKING_INCLUDE = {
  facility: { select: { id: true, name: true, type: true, zoneId: true, capacity: true } },
  eventPack: { select: { id: true, title: true, status: true, expectedCount: true } },
} as const;

/** Whole-day UTC range for a "YYYY-MM-DD" string — dates are compared by day, never by exact instant. */
function dayRange(dateStr: string): { gte: Date; lt: Date } {
  const gte = new Date(dateStr);
  const lt = new Date(gte);
  lt.setUTCDate(lt.getUTCDate() + 1);
  return { gte, lt };
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
  ) {}

  list(params: { facilityId?: string; status?: string; date?: string; search?: string }) {
    return this.prisma.booking.findMany({
      where: {
        facilityId: params.facilityId,
        status: params.status,
        date: params.date ? dayRange(params.date) : undefined,
        customerName: params.search ? { contains: params.search, mode: "insensitive" } : undefined,
      },
      include: BOOKING_INCLUDE,
      orderBy: { date: "desc" },
    });
  }

  async getOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: BOOKING_INCLUDE,
    });
    if (!booking) throw new NotFoundException("Booking not found");
    return booking;
  }

  /** A closed or recovering surface must block new and confirmed bookings. */
  private async assertSurfaceOpen(facilityId: string) {
    const closed = await this.prisma.surface.findFirst({
      where: { facilityId, closureStatus: { not: ClosureStatus.OPEN } },
    });
    if (closed) {
      throw new BadRequestException(
        `Cannot book this facility: ${closed.surfaceType} is ${closed.closureStatus}`,
      );
    }
  }

  private packStatusFor(booking: { status: string; date: Date }) {
    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.NO_SHOW
    ) {
      return "Closed";
    }
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const day = new Date(booking.date);
    day.setUTCHours(0, 0, 0, 0);
    if (booking.status === BookingStatus.CONFIRMED && day.getTime() <= today.getTime()) return "Live";
    return "Planning";
  }

  private async ensureEventPack(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { facility: { select: { name: true, capacity: true } } },
    });
    if (!booking) return null;
    if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.COMPLETED) {
      const existing = await this.prisma.eventPack.findUnique({ where: { bookingId } });
      if (existing) {
        return this.prisma.eventPack.update({
          where: { id: existing.id },
          data: { status: this.packStatusFor(booking) },
        });
      }
      return null;
    }
    const title = `${booking.customerName} · ${booking.facility.name}`;
    const status = this.packStatusFor(booking);
    return this.prisma.eventPack.upsert({
      where: { bookingId },
      create: {
        bookingId,
        title,
        status,
        expectedCount: booking.facility.capacity,
      },
      update: { title, status, expectedCount: booking.facility.capacity },
    });
  }

  /** Conflict detection (Section 4.4) with the facility's setup buffer on both sides. */
  private assertNoConflict(facilityId: string, date: string, start: string, end: string, excludeId?: string) {
    return assertNoClash(this.prisma, { facilityId, date: new Date(date), start, end, excludeId });
  }

  async create(dto: CreateBookingDto, userId: string, customerId?: string) {
    await this.assertSurfaceOpen(dto.facilityId);
    await this.assertNoConflict(dto.facilityId, dto.date, dto.timeSlotStart, dto.timeSlotEnd);
    const booking = await this.prisma.booking.create({
      data: {
        facilityId: dto.facilityId,
        customerName: dto.customerName,
        memberId: dto.memberId,
        type: dto.type,
        date: new Date(dto.date),
        timeSlotStart: dto.timeSlotStart,
        timeSlotEnd: dto.timeSlotEnd,
        amount: dto.amount,
        featureKey: dto.featureKey ?? "",
        detail: dto.detail?.trim() ?? "",
        createdById: userId,
        customerId,
      },
    });
    await this.audit.record({ entityType: "Booking", entityId: booking.id, action: "CREATE", userId, after: booking });
    return this.getOne(booking.id);
  }

  async setStatus(id: string, status: string, userId: string) {
    const before = await this.getOne(id);
    const allowed = BOOKING_STATUS_TRANSITIONS[before.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Cannot move a ${before.status} booking to ${status}`);
    }
    if (status === BookingStatus.CONFIRMED) {
      await this.assertSurfaceOpen(before.facilityId);
      await this.assertNoConflict(before.facilityId, before.date.toISOString().slice(0, 10), before.timeSlotStart, before.timeSlotEnd, id);
    }
    const booking = await this.prisma.booking.update({ where: { id }, data: { status } });
    const pack = await this.ensureEventPack(id);
    if (status === BookingStatus.CONFIRMED && pack) {
      await this.events.provisionOperationalChain(pack.id);
    }
    await this.audit.record({
      entityType: "Booking",
      entityId: id,
      action: `STATUS_CHANGE:${status}`,
      userId,
      before,
      after: booking,
    });
    return this.getOne(id);
  }

  async setPaymentStatus(id: string, paymentStatus: string, userId: string) {
    const before = await this.getOne(id);
    const booking = await this.prisma.booking.update({ where: { id }, data: { paymentStatus } });
    await this.audit.record({
      entityType: "Booking",
      entityId: id,
      action: `PAYMENT_STATUS_CHANGE:${paymentStatus}`,
      userId,
      before,
      after: booking,
    });
    return this.getOne(id);
  }

  auditTrail(id: string) {
    return this.audit.listForEntity("Booking", id);
  }
}
