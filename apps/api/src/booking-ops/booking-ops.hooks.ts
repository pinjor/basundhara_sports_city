import { ConflictException, Injectable, type OnModuleInit } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { BookingStatus, EquipmentStatus, PaymentStatus } from "@bsc/shared";
import { assertEditable, fail } from "../common/resource/guards";
import { ResourceHookRegistry } from "../common/resource/resource-hooks";
import { decimal, money, type Data, type Row } from "../common/resource/resource-mapper";
import { assertNoClash, dayWindow, findClash, minutes, occurrences, overlaps } from "../bookings/booking-time";

const MAX_OCCURRENCES = 60;
const merge = (data: Data, existing?: Row) => ({ ...existing, ...data }) as Data;

function assertWindow(start: unknown, end: unknown) {
  if (minutes(String(end)) <= minutes(String(start))) fail("End time must be after the start time");
}

/** Slots, repeats, waitlist, coaches, add-ons, pricing and booking money rules. */
@Injectable()
export class BookingOpsHooks implements OnModuleInit {
  constructor(private readonly hooks: ResourceHookRegistry) {}

  onModuleInit() {
    this.hooks.register("slot", {
      prepare: async (data, { tx }, existing) => {
        const merged = merge(data, existing);
        assertWindow(merged.timeSlotStart, merged.timeSlotEnd);
        if (Number(merged.capacity) <= 0) fail("Capacity must be more than zero");
        const others = await tx.slot.findMany({ where: { facilityId: String(merged.facilityId), status: "ACTIVE", ...(existing ? { id: { not: existing.id } } : {}) } });
        const clash = others.find(
          (slot) =>
            (slot.dayOfWeek === "Daily" || merged.dayOfWeek === "Daily" || slot.dayOfWeek === merged.dayOfWeek) &&
            overlaps(String(merged.timeSlotStart), String(merged.timeSlotEnd), slot.timeSlotStart, slot.timeSlotEnd),
        );
        if (clash) fail(`Overlaps slot ${clash.reference} (${clash.dayOfWeek} ${clash.timeSlotStart}-${clash.timeSlotEnd})`);
        return data;
      },
    });

    this.hooks.register("recurringBookingRule", {
      prepare: (data, _ctx, existing) => {
        if (existing) fail("Repeats are fixed once created. Pause or end this rule and create a new one");
        const merged = merge(data, existing);
        assertWindow(merged.timeSlotStart, merged.timeSlotEnd);
        const dates = occurrences(merged.startsOn as Date, merged.endsOn as Date, String(merged.frequency));
        if (!dates.length) fail("The last date must be on or after the first date");
        if (dates.length > MAX_OCCURRENCES) fail(`That makes ${dates.length} bookings; keep it to ${MAX_OCCURRENCES} or fewer`);
        return data;
      },
      afterCreate: (row, ctx) => this.generate(ctx.tx, row, ctx.user.id),
      afterTransition: async (row, _from, { tx }) => {
        if (row.status !== "ENDED") return;
        const today = dayWindow(new Date()).gte;
        await tx.booking.updateMany({
          where: { featureKey: "recurring-booking", detail: { startsWith: `Rule ${row.reference}` }, status: BookingStatus.PENDING, date: { gte: today } },
          data: { status: BookingStatus.CANCELLED },
        });
      },
    });

    this.hooks.register("waitlistEntry", {
      prepare: (data, _ctx, existing) => {
        assertEditable(existing, ["WAITING", "OFFERED"]);
        const merged = merge(data, existing);
        assertWindow(merged.timeSlotStart, merged.timeSlotEnd);
        return data;
      },
      beforeTransition: async (row, to, { tx, user }) => {
        if (to !== "CONVERTED") return;
        const date = row.preferredDate as Date;
        await assertNoClash(tx, { facilityId: String(row.facilityId), date, start: String(row.timeSlotStart), end: String(row.timeSlotEnd) });
        const booking = await tx.booking.create({
          data: {
            facilityId: String(row.facilityId),
            customerName: String(row.customerName),
            type: "Public",
            date,
            timeSlotStart: String(row.timeSlotStart),
            timeSlotEnd: String(row.timeSlotEnd),
            amount: row.amountBdt as Prisma.Decimal,
            featureKey: "waiting-list",
            detail: `From waiting list ${row.reference} · ${row.phone}`,
            createdById: user.id,
          },
        });
        return { bookingId: booking.id };
      },
    });

    this.hooks.register("coachSession", {
      prepare: async (data, { tx }, existing) => {
        assertEditable(existing, ["REQUESTED", "CONFIRMED"]);
        const merged = merge(data, existing);
        assertWindow(merged.timeSlotStart, merged.timeSlotEnd);
        const coach = await tx.coach.findUniqueOrThrow({ where: { id: String(merged.coachId) } });
        if (coach.status !== "ACTIVE") fail(`${coach.name} is not taking sessions`);
        const sameDay = await tx.coachSession.findMany({
          where: { coachId: coach.id, sessionDate: merged.sessionDate as Date, status: { in: ["REQUESTED", "CONFIRMED"] }, ...(existing ? { id: { not: existing.id } } : {}) },
        });
        const clash = sameDay.find((session) => overlaps(String(merged.timeSlotStart), String(merged.timeSlotEnd), session.timeSlotStart, session.timeSlotEnd));
        if (clash) fail(`${coach.name} already has ${clash.customerName} at ${clash.timeSlotStart}-${clash.timeSlotEnd}`);
        const hours = (minutes(String(merged.timeSlotEnd)) - minutes(String(merged.timeSlotStart))) / 60;
        return { ...data, amountBdt: decimal(money(coach.hourlyRateBdt) * hours) };
      },
    });

    this.hooks.register("bookingAddOn", {
      prepare: async (data, { tx }, existing) => {
        assertEditable(existing, ["REQUESTED"]);
        const merged = merge(data, existing);
        const equipment = await tx.equipment.findUniqueOrThrow({ where: { id: String(merged.equipmentId) } });
        if (Number(merged.quantity) <= 0) fail("Quantity must be more than zero");
        if (Number(merged.quantity) > equipment.quantity) fail(`Only ${equipment.quantity} ${equipment.name} in the register`);
        await this.liveBooking(tx, String(merged.bookingId));
        return data;
      },
      afterTransition: async (row, _from, { tx }) => {
        if (row.status === "ISSUED") await tx.equipment.update({ where: { id: String(row.equipmentId) }, data: { status: EquipmentStatus.DEPLOYED } });
        if (row.status === "RETURNED") {
          const stillOut = await tx.bookingAddOn.count({ where: { equipmentId: String(row.equipmentId), status: "ISSUED" } });
          if (!stillOut) await tx.equipment.update({ where: { id: String(row.equipmentId) }, data: { status: EquipmentStatus.IN_STOCK } });
        }
      },
    });

    this.hooks.register("pricingRule", {
      prepare: (data, _ctx, existing) => {
        const merged = merge(data, existing);
        assertWindow(merged.startsAt, merged.endsAt);
        const percent = Number(merged.adjustPercent);
        if (percent < -90 || percent > 200) fail("Price change must be between -90% and +200%");
        return data;
      },
    });

    this.hooks.register("cancellationPolicy", {
      prepare: (data, _ctx, existing) => {
        const merged = merge(data, existing);
        if (Number(merged.hoursBefore) < 0) fail("Notice cannot be negative");
        const refund = Number(merged.refundPercent);
        if (refund < 0 || refund > 100) fail("Refund must be from 0% to 100%");
        return data;
      },
    });

    this.hooks.register("bookingDeposit", {
      prepare: async (data, { tx }, existing) => {
        assertEditable(existing, ["HELD"]);
        const merged = merge(data, existing);
        const booking = await this.liveBooking(tx, String(merged.bookingId));
        if (money(merged.amountBdt) > money(booking.amount)) fail(`Deposit is more than the booking amount (${money(booking.amount).toLocaleString("en-US")} BDT)`);
        return data;
      },
      afterCreate: async (row, { tx }) => {
        await tx.booking.updateMany({ where: { id: String(row.bookingId), paymentStatus: PaymentStatus.UNPAID }, data: { paymentStatus: PaymentStatus.DEPOSIT_PAID } });
      },
      afterTransition: async (row, _from, { tx }) => {
        if (row.status !== "REFUNDED") return;
        const held = await tx.bookingDeposit.count({ where: { bookingId: String(row.bookingId), status: "HELD" } });
        if (!held) await tx.booking.updateMany({ where: { id: String(row.bookingId), paymentStatus: PaymentStatus.DEPOSIT_PAID }, data: { paymentStatus: PaymentStatus.UNPAID } });
      },
    });

    this.hooks.register("bookingPayment", {
      prepare: async (data, { tx }, existing) => {
        assertEditable(existing, ["INITIATED"]);
        await this.liveBooking(tx, String(merge(data, existing).bookingId));
        if (!existing && !data.gatewayRef) return { ...data, gatewayRef: `SBX-${Date.now().toString(36).toUpperCase()}` };
        return data;
      },
      afterTransition: async (row, _from, { tx }) => {
        if (row.status !== "CAPTURED" && row.status !== "REFUNDED") return;
        const booking = await tx.booking.findUniqueOrThrow({ where: { id: String(row.bookingId) } });
        const { _sum } = await tx.bookingPayment.aggregate({ where: { bookingId: booking.id, status: "CAPTURED" }, _sum: { amountBdt: true } });
        const captured = money(_sum.amountBdt);
        const paymentStatus =
          captured >= money(booking.amount) && captured > 0 ? PaymentStatus.PAID : row.status === "REFUNDED" && captured === 0 ? PaymentStatus.REFUNDED : booking.paymentStatus;
        await tx.booking.update({ where: { id: booking.id }, data: { paymentStatus } });
      },
    });
  }

  private async liveBooking(tx: Prisma.TransactionClient, bookingId: string) {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking) fail("Booking not found");
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.NO_SHOW) fail(`This booking is ${booking.status.toLowerCase()}`);
    return booking;
  }

  /** Books every free occurrence of a new rule and counts the clashes it skipped. */
  private async generate(tx: Prisma.TransactionClient, rule: Row, userId: string) {
    const dates = occurrences(rule.startsOn as Date, rule.endsOn as Date, String(rule.frequency));
    let generated = 0;
    for (const date of dates) {
      const request = { facilityId: String(rule.facilityId), date, start: String(rule.timeSlotStart), end: String(rule.timeSlotEnd) };
      if (await findClash(tx, request)) continue;
      await tx.booking.create({
        data: {
          facilityId: request.facilityId,
          customerName: String(rule.customerName),
          type: String(rule.type),
          date,
          timeSlotStart: request.start,
          timeSlotEnd: request.end,
          amount: rule.amountBdt as Prisma.Decimal,
          featureKey: "recurring-booking",
          detail: `Rule ${rule.reference} · ${rule.frequency}`,
          createdById: userId,
        },
      });
      generated += 1;
    }
    if (!generated) throw new ConflictException("Every date in this rule clashes with an existing booking");
    await tx.recurringBookingRule.update({ where: { id: rule.id }, data: { generated, skipped: dates.length - generated } });
  }
}
