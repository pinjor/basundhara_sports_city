import { Injectable } from "@nestjs/common";
import { ClosureStatus, FacilityStatus, FleetVehicleType, GateType, LoungeStatus, OutletStatus, ParkingZoneType, ZoneStatus, ZoneType } from "@bsc/shared";
import { PrismaService } from "../prisma/prisma.service";

/** Back-of-house spaces that never appear in the customer app. */
const HIDDEN_FACILITY_TYPES = ["Storage", "Changing Room", "Media Room"];
const MAP_LAYER: Record<string, string> = {
  [ZoneType.STADIUM]: "venues",
  [ZoneType.FACILITY]: "venues",
  [ZoneType.PARKING]: "parking",
  [ZoneType.COMMERCIAL]: "food",
  [ZoneType.HOSPITALITY]: "lounge",
};
/** Parking zones open to the public; VIP courts are for members. */
const CUSTOMER_PARKING: Record<string, "Public" | "Members"> = {
  [ParkingZoneType.PUBLIC]: "Public",
  [ParkingZoneType.VISITOR]: "Public",
  [ParkingZoneType.VIP]: "Members",
};
const ACTIVE_PARKING = ["Reserved"];
const HOME_SUGGESTIONS = 6;

/** Free passes a signed-in customer can issue for themselves. Valid until 22:00 on the day. */
export const FREE_PASSES = [
  { name: "Tourist Pass", zones: "Plaza, gallery walk and viewing terraces" },
  { name: "Gallery Access", zones: "Hall of fame and heritage gallery" },
  { name: "Restaurant Access", zones: "Boulevard dining and food court" },
  { name: "Shopping Access", zones: "Retail boulevard and fan store" },
];

/** Public, read-only data for the customer app. No sign-in needed. */
@Injectable()
export class CustomerCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async venues() {
    const facilities = await this.prisma.facility.findMany({
      where: { type: { notIn: HIDDEN_FACILITY_TYPES } },
      include: {
        zone: { select: { id: true, name: true, capacity: true, liveOccupancy: true } },
        surfaces: { select: { condition: true, closureStatus: true, moisturePercent: true } },
        _count: { select: { slots: { where: { status: "ACTIVE" } } } },
      },
      orderBy: { name: "asc" },
    });
    return facilities.map((facility) => {
      const closed = facility.status === FacilityStatus.MAINTENANCE || facility.surfaces.some((surface) => surface.closureStatus !== ClosureStatus.OPEN);
      const surface = facility.surfaces[0];
      return {
        id: facility.id,
        name: facility.name,
        type: facility.type,
        capacity: facility.capacity,
        status: facility.status,
        hours: `${facility.operatingHoursStart} – ${facility.operatingHoursEnd}`,
        lastInspection: facility.lastInspectionDate,
        surfaceCondition: surface?.condition ?? null,
        moisturePercent: surface?.moisturePercent ?? null,
        occupancy: facility.zone.capacity > 0 ? Math.min(1, facility.zone.liveOccupancy / facility.zone.capacity) : 0,
        zone: { id: facility.zone.id, name: facility.zone.name },
        imageUrl: facility.imageUrl,
        summary: facility.summary,
        bookable: !closed && facility._count.slots > 0,
      };
    });
  }

  /** Complex map: public zones with their position (0-1) and the public and VIP gates. */
  async map() {
    const [zones, gates] = await Promise.all([
      this.prisma.zone.findMany({
        where: { type: { not: ZoneType.RESTRICTED }, status: { not: ZoneStatus.RESTRICTED }, mapX: { not: null }, mapY: { not: null } },
        orderBy: { name: "asc" },
      }),
      this.prisma.gate.findMany({ where: { type: { in: [GateType.MAIN, GateType.VIP] } }, orderBy: { name: "asc" } }),
    ]);
    return {
      zones: zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        layer: MAP_LAYER[zone.type] ?? "venues",
        status: zone.status,
        capacity: zone.capacity,
        occupancy: zone.capacity > 0 ? Math.min(1, zone.liveOccupancy / zone.capacity) : 0,
        x: zone.mapX,
        y: zone.mapY,
      })),
      gates: gates.map((gate) => ({
        id: gate.id,
        name: gate.name,
        kind: gate.type === GateType.VIP ? "VIP" : "Public",
        status: gate.status,
        entriesToday: gate.entriesToday,
      })),
    };
  }

  /** Home screen: the next event, bookable venues to suggest and what is on soon. */
  async home() {
    const [events, venues] = await Promise.all([
      this.prisma.matchEvent.findMany({
        where: { startsAt: { gt: new Date() }, salesStatus: "ON_SALE" },
        orderBy: { startsAt: "asc" },
        take: 4,
        select: { id: true, title: true, sport: true, venueName: true, startsAt: true },
      }),
      this.venues(),
    ]);
    return {
      next: events[0] ?? null,
      upcoming: events,
      suggestions: venues.filter((venue) => venue.bookable).slice(0, HOME_SUGGESTIONS),
    };
  }

  async lounges() {
    const lounges = await this.prisma.lounge.findMany({
      where: { customerBookable: true, status: { not: LoungeStatus.CLOSED } },
      include: { zone: { select: { name: true, floor: true } } },
      orderBy: { name: "asc" },
    });
    return lounges.map((lounge) => ({
      id: lounge.id,
      name: lounge.name,
      level: lounge.zone.floor ? `${lounge.zone.name} · ${lounge.zone.floor}` : lounge.zone.name,
      covers: lounge.capacity,
      status: lounge.status,
      available: lounge.status === LoungeStatus.OPEN,
      summary: lounge.summary,
      imageUrl: lounge.imageUrl,
    }));
  }

  /** Open outlets that take app orders, each with its menu. */
  async menu() {
    const outlets = await this.prisma.outlet.findMany({
      where: { status: OutletStatus.OPEN, menuItems: { some: { available: true } } },
      include: { menuItems: { where: { available: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
      orderBy: { name: "asc" },
    });
    return outlets.map((outlet) => ({
      id: outlet.id,
      name: outlet.name,
      type: outlet.type,
      items: outlet.menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: Number(item.priceBdt),
        station: item.station,
        prepMinutes: item.prepMinutes,
        imageUrl: item.imageUrl,
      })),
    }));
  }

  async parkingZones() {
    const zones = await this.prisma.parkingZone.findMany({
      where: { type: { in: Object.keys(CUSTOMER_PARKING) } },
      include: { _count: { select: { reservations: { where: { status: { in: ACTIVE_PARKING } } } } } },
      orderBy: { name: "asc" },
    });
    return zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      area: CUSTOMER_PARKING[zone.type]!,
      capacity: zone.capacity,
      occupied: Math.min(zone.capacity, zone.occupied + zone._count.reservations),
      access: "QR",
    }));
  }

  /** Buggy pickup and drop-off points on the campus map. */
  async stops() {
    const rows = await this.prisma.shuttleStop.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
    return rows.map((stop) => ({ id: stop.code, name: stop.name, zone: stop.zone, x: stop.x, y: stop.y, icon: stop.icon }));
  }

  async fleet() {
    const vehicles = await this.prisma.fleetVehicle.findMany({
      where: { type: { in: [FleetVehicleType.BUGGY, FleetVehicleType.SHUTTLE] } },
      orderBy: [{ type: "asc" }, { createdAt: "asc" }],
    });
    return vehicles.map((vehicle) => ({
      id: vehicle.id,
      kind: vehicle.type,
      driver: vehicle.driverName,
      status: vehicle.status,
      location: vehicle.currentLocation,
    }));
  }

  passCatalog() {
    return FREE_PASSES;
  }
}
