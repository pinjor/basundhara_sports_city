import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { randomInt } from "crypto";
import {
  FleetVehicleStatus,
  FleetVehicleType,
  LoungeStatus,
  MemberStatus,
  OrderStatus,
  OutletStatus,
  ParkingZoneType,
  Role,
  ServiceRequestStatus,
  TripStatus,
  VisitorCategory,
  VisitorStatus,
} from "@bsc/shared";
import { PrismaService } from "../prisma/prisma.service";
import { IdempotencyService } from "../common/idempotency.service";
import { NotificationService } from "../common/notification.service";
import { ReferenceService } from "../common/reference.service";
import type { RequestCustomer } from "../auth/customer-jwt.strategy";
import { CustomerInboxService } from "./customer-inbox.service";
import { FREE_PASSES } from "./customer-catalog.service";
import { dhakaToday } from "./sandbox-payment";
import type { FoodOrderDto, GuestInviteDto, LoungeHoldDto, ParkingPassDto, RideRequestDto } from "./dto/customer.dto";

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const FOOD_HISTORY = 20;
const PARKING_RESERVED = "Reserved";
const PARKING_RELEASED = "Cancelled";
const MEMBERS_PARKING = [ParkingZoneType.VIP as string];
const CUSTOMER_PARKING = [ParkingZoneType.PUBLIC, ParkingZoneType.VISITOR, ParkingZoneType.VIP] as string[];
const OPEN_TRIP = [TripStatus.REQUESTED, TripStatus.IN_PROGRESS] as string[];
const TABLE_HOLD = "Table hold";
const OPEN_HOLD = [ServiceRequestStatus.PENDING, ServiceRequestStatus.PREPARING] as string[];
const GUEST_REVOKED = "Cancelled";
const MAX_OPEN_GUESTS = 10;
const GUEST_WINDOW_DAYS = 90;
const PASS_PREFIX = "Free pass · ";
/** Free passes run until 22:00 Dhaka time, which is 16:00 UTC. */
const PASS_CLOSE_UTC_MS = 16 * HOUR_MS;
const GUEST_STATUS: Record<string, string> = {
  [VisitorStatus.EXPECTED]: "Invited",
  [VisitorStatus.CHECKED_IN]: "Inside",
  [VisitorStatus.CHECKED_OUT]: "Visited",
  [GUEST_REVOKED]: "Revoked",
};

/** Things a signed-in customer does in the app: food, parking, buggies, lounges, guests and free passes. */
@Injectable()
export class CustomerServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
    private readonly references: ReferenceService,
    private readonly notifications: NotificationService,
    private readonly inbox: CustomerInboxService,
  ) {}

  // ---------------------------------------------------------------- food

  /** Requires an `Idempotency-Key`. Prices come from the menu, never from the app. Paid at pickup. */
  placeFoodOrder(customer: RequestCustomer, dto: FoodOrderDto, key: string | undefined) {
    return this.idempotency.run(`food-order:${customer.id}`, key, dto, async () => {
      const outlet = await this.prisma.outlet.findUnique({ where: { id: dto.outletId }, include: { menuItems: true } });
      if (!outlet) throw new NotFoundException("Outlet not found");
      if (outlet.status !== OutletStatus.OPEN) throw new ConflictException(`${outlet.name} is closed right now`);
      const quantities = new Map<string, number>();
      for (const line of dto.lines) quantities.set(line.menuItemId, (quantities.get(line.menuItemId) ?? 0) + line.qty);
      const lines = [...quantities].map(([menuItemId, qty]) => {
        const item = outlet.menuItems.find((row) => row.id === menuItemId);
        if (!item || !item.available) throw new BadRequestException("An item in your basket is no longer on the menu");
        return { menuItemId, name: item.name, qty, unitPrice: Number(item.priceBdt), prepMinutes: item.prepMinutes };
      });
      const amount = lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
      const prep = Math.max(...lines.map((line) => line.prepMinutes));
      const order = await this.prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            outletId: outlet.id,
            items: lines.map(({ prepMinutes: _prep, ...line }) => line),
            amount,
            status: OrderStatus.ORDER_RECEIVED,
            customerId: customer.id,
            reference: await this.references.next("FO", tx),
            readyAt: new Date(Date.now() + prep * 60_000),
          },
          include: { outlet: { select: { id: true, name: true } } },
        });
        await this.notifications.notify(
          { title: "New app food order", body: `${created.reference} for ${customer.name} at ${outlet.name}.`, href: "/hospitality", role: Role.HOSPITALITY_LEAD },
          tx,
        );
        await this.inbox.notify(customer.id, "Order placed", `${created.reference} · pick up at ${outlet.name}`, tx);
        return created;
      });
      return presentFood(order, dto.note);
    });
  }

  async foodOrders(customerId: string) {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      include: { outlet: { select: { id: true, name: true } } },
      orderBy: { placedAt: "desc" },
      take: FOOD_HISTORY,
    });
    return orders.map((order) => presentFood(order));
  }

  // ---------------------------------------------------------------- parking

  async parkingPass(customerId: string) {
    const pass = await this.prisma.parkingReservation.findFirst({
      where: { customerId, status: PARKING_RESERVED },
      include: { parkingZone: true },
      orderBy: { createdAt: "desc" },
    });
    return { pass: pass ? presentParking(pass) : null };
  }

  /** One bay per customer: reserving another zone releases the old one. */
  async reserveParking(customer: RequestCustomer, dto: ParkingPassDto) {
    const zone = await this.prisma.parkingZone.findUnique({ where: { id: dto.parkingZoneId } });
    if (!zone || !CUSTOMER_PARKING.includes(zone.type)) throw new NotFoundException("Car park not found");
    if (MEMBERS_PARKING.includes(zone.type) && !(await this.activeMember(customer.id))) {
      throw new ForbiddenException("Members parking needs an active membership");
    }
    const pass = await this.prisma.$transaction(async (tx) => {
      const current = await tx.parkingReservation.findFirst({ where: { customerId: customer.id, status: PARKING_RESERVED } });
      if (current?.parkingZoneId === zone.id) return tx.parkingReservation.findUniqueOrThrow({ where: { id: current.id }, include: { parkingZone: true } });
      const held = await tx.parkingReservation.count({ where: { parkingZoneId: zone.id, status: PARKING_RESERVED } });
      if (zone.occupied + held >= zone.capacity) throw new ConflictException(`${zone.name} is full`);
      if (current) await tx.parkingReservation.update({ where: { id: current.id }, data: { status: PARKING_RELEASED } });
      return tx.parkingReservation.create({
        data: { parkingZoneId: zone.id, customerId: customer.id, plateNumber: dto.plateNumber?.trim(), status: PARKING_RESERVED },
        include: { parkingZone: true },
      });
    });
    return { pass: presentParking(pass) };
  }

  async releaseParking(customerId: string) {
    const { count } = await this.prisma.parkingReservation.updateMany({
      where: { customerId, status: PARKING_RESERVED },
      data: { status: PARKING_RELEASED },
    });
    return { released: count };
  }

  // ---------------------------------------------------------------- buggy rides

  async currentRide(customerId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { customerId, status: { in: OPEN_TRIP } },
      include: { vehicle: true },
      orderBy: { requestedAt: "desc" },
    });
    return { ride: trip ? presentRide(trip) : null };
  }

  /** Dispatches the longest-idle free buggy. */
  async requestRide(customer: RequestCustomer, dto: RideRequestDto) {
    if (dto.from.trim().toLowerCase() === dto.to.trim().toLowerCase()) throw new BadRequestException("Pick-up and drop-off must differ");
    const open = await this.prisma.trip.findFirst({ where: { customerId: customer.id, status: { in: OPEN_TRIP } } });
    if (open) throw new ConflictException("You already have a buggy on the way");
    const trip = await this.prisma.$transaction(async (tx) => {
      const free = await tx.fleetVehicle.findMany({
        where: { type: FleetVehicleType.BUGGY, status: FleetVehicleStatus.AVAILABLE },
        orderBy: { updatedAt: "asc" },
        take: 3,
      });
      for (const vehicle of free) {
        const claimed = await tx.fleetVehicle.updateMany({
          where: { id: vehicle.id, status: FleetVehicleStatus.AVAILABLE },
          data: { status: FleetVehicleStatus.ON_TRIP },
        });
        if (claimed.count === 0) continue;
        const created = await tx.trip.create({
          data: {
            vehicleId: vehicle.id,
            passengerRef: customer.name,
            fromLocation: dto.from.trim(),
            toLocation: dto.to.trim(),
            status: TripStatus.REQUESTED,
            customerId: customer.id,
            riders: dto.riders,
            boardingCode: String(randomInt(1000, 10000)),
          },
          include: { vehicle: true },
        });
        await this.notifications.notify(
          {
            title: "Buggy requested",
            body: `${customer.name} (${dto.riders}) from ${created.fromLocation} to ${created.toLocation}.`,
            href: "/fleet",
            role: Role.FLEET_DISPATCHER,
          },
          tx,
        );
        return created;
      }
      throw new ConflictException("No buggy is free right now. Try again in a few minutes.");
    });
    return { ride: presentRide(trip) };
  }

  async boardRide(customerId: string, id: string) {
    const trip = await this.ownTrip(customerId, id);
    if (trip.status === TripStatus.IN_PROGRESS) return { ride: presentRide(trip) };
    if (trip.status !== TripStatus.REQUESTED) throw new ConflictException("This ride has finished");
    const updated = await this.prisma.trip.update({ where: { id }, data: { status: TripStatus.IN_PROGRESS }, include: { vehicle: true } });
    return { ride: presentRide(updated) };
  }

  async completeRide(customerId: string, id: string) {
    const trip = await this.ownTrip(customerId, id);
    if (trip.status === TripStatus.COMPLETED) return { ride: presentRide(trip) };
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.fleetVehicle.update({ where: { id: trip.vehicleId }, data: { status: FleetVehicleStatus.AVAILABLE } });
      return tx.trip.update({ where: { id }, data: { status: TripStatus.COMPLETED, completedAt: new Date() }, include: { vehicle: true } });
    });
    return { ride: presentRide(updated) };
  }

  /** Only before boarding. The buggy goes back to the free pool. */
  async cancelRide(customerId: string, id: string) {
    const trip = await this.ownTrip(customerId, id);
    if (trip.status !== TripStatus.REQUESTED) throw new ConflictException("A ride can only be cancelled before you board");
    await this.prisma.$transaction([
      this.prisma.trip.delete({ where: { id } }),
      this.prisma.fleetVehicle.update({ where: { id: trip.vehicleId }, data: { status: FleetVehicleStatus.AVAILABLE } }),
    ]);
    return { ride: null };
  }

  // ---------------------------------------------------------------- lounge holds

  async loungeHold(customerId: string) {
    const hold = await this.prisma.serviceRequest.findFirst({
      where: { customerId, status: { in: OPEN_HOLD }, item: { startsWith: TABLE_HOLD } },
      include: { lounge: { select: { id: true, name: true } } },
      orderBy: { requestedAt: "desc" },
    });
    return { hold: hold ? presentHold(hold) : null };
  }

  /** One table hold at a time; a new one replaces a hold the lounge has not started on. */
  async holdLounge(customer: RequestCustomer, dto: LoungeHoldDto) {
    const lounge = await this.prisma.lounge.findUnique({ where: { id: dto.loungeId } });
    if (!lounge || !lounge.customerBookable) throw new NotFoundException("Lounge not found");
    if (lounge.status !== LoungeStatus.OPEN) throw new ConflictException(`${lounge.name} is ${lounge.status.toLowerCase()}`);
    const hold = await this.prisma.$transaction(async (tx) => {
      const preparing = await tx.serviceRequest.findFirst({
        where: { customerId: customer.id, status: ServiceRequestStatus.PREPARING, item: { startsWith: TABLE_HOLD } },
      });
      if (preparing) throw new ConflictException("The lounge team is already preparing your table");
      await tx.serviceRequest.deleteMany({ where: { customerId: customer.id, status: ServiceRequestStatus.PENDING, item: { startsWith: TABLE_HOLD } } });
      const created = await tx.serviceRequest.create({
        data: {
          partyRef: customer.name,
          loungeId: lounge.id,
          item: [TABLE_HOLD, dto.extras?.trim()].filter(Boolean).join(" · "),
          status: ServiceRequestStatus.PENDING,
          customerId: customer.id,
          arrival: dto.arrival,
          note: dto.note?.trim() || null,
        },
        include: { lounge: { select: { id: true, name: true } } },
      });
      await this.notifications.notify(
        { title: "Lounge table held", body: `${customer.name} · ${lounge.name} · arriving ${dto.arrival}.`, href: "/hospitality", role: Role.HOSPITALITY_LEAD },
        tx,
      );
      return created;
    });
    return { hold: presentHold(hold) };
  }

  async releaseLoungeHold(customerId: string, id: string) {
    const hold = await this.prisma.serviceRequest.findUnique({ where: { id } });
    if (!hold || hold.customerId !== customerId) throw new NotFoundException("Hold not found");
    if (hold.status !== ServiceRequestStatus.PENDING) throw new ConflictException("The lounge team is already preparing your table");
    await this.prisma.serviceRequest.delete({ where: { id } });
    return { hold: null };
  }

  // ---------------------------------------------------------------- guests

  async guests(customerId: string) {
    const guests = await this.prisma.visitor.findMany({ where: { customerId }, orderBy: { createdAt: "desc" }, take: 50 });
    return guests.map(presentGuest);
  }

  async inviteGuest(customer: RequestCustomer, dto: GuestInviteDto) {
    const today = dhakaToday();
    const visitDate = dto.visitDate ? new Date(`${dto.visitDate.slice(0, 10)}T00:00:00.000Z`) : today;
    const days = Math.round((visitDate.getTime() - today.getTime()) / DAY_MS);
    if (days < 0 || days > GUEST_WINDOW_DAYS) throw new BadRequestException(`Visit date must be within the next ${GUEST_WINDOW_DAYS} days`);
    const open = await this.prisma.visitor.count({ where: { customerId: customer.id, status: VisitorStatus.EXPECTED } });
    if (open >= MAX_OPEN_GUESTS) throw new ConflictException(`You can have up to ${MAX_OPEN_GUESTS} guest passes waiting`);
    const guest = await this.prisma.$transaction(async (tx) => {
      const created = await tx.visitor.create({
        data: {
          name: dto.name.trim(),
          host: customer.name,
          purpose: dto.purpose?.trim() || "Day visit",
          category: VisitorCategory.GUEST,
          status: VisitorStatus.EXPECTED,
          customerId: customer.id,
          visitDate,
        },
      });
      await this.inbox.notify(customer.id, "Guest pass sent", `${created.name} · ${visitDate.toISOString().slice(0, 10)}`, tx);
      return created;
    });
    return presentGuest(guest);
  }

  async revokeGuest(customerId: string, id: string) {
    const guest = await this.prisma.visitor.findUnique({ where: { id } });
    if (!guest || guest.customerId !== customerId) throw new NotFoundException("Guest not found");
    if (guest.status !== VisitorStatus.EXPECTED) throw new ConflictException("Only a pass that has not been used can be revoked");
    return presentGuest(await this.prisma.visitor.update({ where: { id }, data: { status: GUEST_REVOKED } }));
  }

  // ---------------------------------------------------------------- free passes

  async passes(customerId: string) {
    const rows = await this.prisma.credential.findMany({
      where: { customerId, type: { startsWith: PASS_PREFIX } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return rows.map(presentPass);
  }

  /** Valid until 22:00 today; after that, for tomorrow. Asking again returns the pass already issued. */
  async issuePass(customer: RequestCustomer, name: string) {
    const entry = FREE_PASSES.find((pass) => pass.name === name);
    if (!entry) throw new NotFoundException("Pass not found");
    const type = `${PASS_PREFIX}${entry.name}`;
    const now = new Date();
    const existing = await this.prisma.credential.findFirst({ where: { customerId: customer.id, type, status: "Active", validTo: { gt: now } } });
    if (existing) return presentPass(existing);
    const today = dhakaToday(now.getTime());
    let validTo = new Date(today.getTime() + PASS_CLOSE_UTC_MS);
    let validFrom = now;
    if (validTo <= now) {
      validFrom = new Date(today.getTime() + DAY_MS - 6 * HOUR_MS);
      validTo = new Date(validTo.getTime() + DAY_MS);
    }
    const pass = await this.prisma.credential.create({
      data: { holderRef: customer.name, type, status: "Active", customerId: customer.id, validFrom, validTo },
    });
    await this.inbox.notify(customer.id, "Free pass issued", `${entry.name} · until ${validTo.toISOString().slice(0, 10)} 22:00`);
    return presentPass(pass);
  }

  // ---------------------------------------------------------------- helpers

  private async activeMember(customerId: string) {
    const member = await this.prisma.member.findUnique({ where: { customerId } });
    return !!member && member.status === MemberStatus.ACTIVE && member.expiryDate.getTime() > Date.now();
  }

  private async ownTrip(customerId: string, id: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id }, include: { vehicle: true } });
    if (!trip || trip.customerId !== customerId) throw new NotFoundException("Ride not found");
    return trip;
  }
}

function presentFood(
  order: { reference: string | null; outlet: { id: string; name: string }; items: Prisma.JsonValue; amount: unknown; status: string; placedAt: Date; readyAt: Date | null },
  note?: string,
) {
  return {
    reference: order.reference,
    outlet: order.outlet,
    lines: Array.isArray(order.items) ? order.items : [],
    total: Number(order.amount),
    status: order.status,
    placedAt: order.placedAt,
    readyAt: order.readyAt,
    ...(note ? { note } : {}),
  };
}

function presentParking(pass: {
  id: string;
  code: string;
  plateNumber: string | null;
  createdAt: Date;
  parkingZone: { id: string; name: string; type: string };
}) {
  return {
    id: pass.id,
    code: pass.code,
    zoneId: pass.parkingZone.id,
    zoneName: pass.parkingZone.name,
    area: MEMBERS_PARKING.includes(pass.parkingZone.type) ? "Members" : "Public",
    access: "QR",
    plateNumber: pass.plateNumber,
    createdAt: pass.createdAt,
  };
}

function presentRide(trip: {
  id: string;
  status: string;
  fromLocation: string;
  toLocation: string;
  riders: number;
  boardingCode: string | null;
  requestedAt: Date;
  completedAt: Date | null;
  vehicle: { id: string; type: string; driverName: string | null; currentLocation: string | null };
}) {
  return {
    id: trip.id,
    status: trip.status,
    from: trip.fromLocation,
    to: trip.toLocation,
    riders: trip.riders,
    boardingCode: trip.boardingCode,
    requestedAt: trip.requestedAt,
    completedAt: trip.completedAt,
    vehicle: { id: trip.vehicle.id, kind: trip.vehicle.type, driver: trip.vehicle.driverName, location: trip.vehicle.currentLocation },
  };
}

function presentHold(hold: {
  id: string;
  item: string;
  status: string;
  arrival: string | null;
  note: string | null;
  requestedAt: Date;
  lounge: { id: string; name: string };
}) {
  const extras = hold.item.startsWith(`${TABLE_HOLD} · `) ? hold.item.slice(TABLE_HOLD.length + 3) : null;
  return { id: hold.id, lounge: hold.lounge, arrival: hold.arrival, extras, note: hold.note, status: hold.status, heldAt: hold.requestedAt };
}

function presentGuest(guest: {
  id: string;
  name: string;
  host: string;
  purpose: string;
  status: string;
  visitDate: Date | null;
  qrPassCode: string;
  createdAt: Date;
}) {
  const usable = guest.status === VisitorStatus.EXPECTED || guest.status === VisitorStatus.CHECKED_IN;
  return {
    id: guest.id,
    name: guest.name,
    host: guest.host,
    purpose: guest.purpose,
    status: GUEST_STATUS[guest.status] ?? guest.status,
    visitDate: guest.visitDate ? guest.visitDate.toISOString().slice(0, 10) : null,
    qrCode: usable ? guest.qrPassCode : null,
    createdAt: guest.createdAt,
  };
}

function presentPass(pass: { id: string; type: string; code: string; status: string; validFrom: Date; validTo: Date | null; createdAt: Date }) {
  const name = pass.type.slice(PASS_PREFIX.length);
  const active = pass.status === "Active" && (!pass.validTo || pass.validTo.getTime() > Date.now());
  return {
    id: pass.id,
    name,
    zones: FREE_PASSES.find((entry) => entry.name === name)?.zones ?? "",
    code: active ? pass.code : null,
    status: active ? "Active" : "Expired",
    validFrom: pass.validFrom,
    validTo: pass.validTo,
    createdAt: pass.createdAt,
  };
}
