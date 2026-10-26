import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { RequestUser } from "../auth/current-user.decorator";
import { NotificationService } from "../common/notification.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
  ) {}

  /** Chairman sign-off on an event pack that is waiting for approval. */
  async decide(id: string, decision: "Approved" | "Rejected", user: RequestUser) {
    const pack = await this.prisma.eventPack.findUnique({ where: { id } });
    if (!pack) throw new NotFoundException("Event pack not found");
    if (pack.approvalStatus !== "Pending") throw new BadRequestException(`${pack.title} is already ${pack.approvalStatus.toLowerCase()}`);
    const updated = await this.prisma.eventPack.update({
      where: { id },
      data: { approvalStatus: decision, approvedById: user.id, approvedAt: new Date() },
      select: { id: true, title: true, approvalStatus: true, approvedAt: true },
    });
    await this.audit.record({ entityType: "EventPack", entityId: id, action: `approval:${decision}`, userId: user.id, before: { approvalStatus: pack.approvalStatus }, after: { approvalStatus: decision } });
    await this.notifications.notify({ title: `Event ${decision.toLowerCase()}`, body: `${pack.title} was ${decision.toLowerCase()} by ${user.name}.`, href: `/?event=${id}` });
    return updated;
  }

  list() {
    return this.prisma.eventPack.findMany({
      include: {
        booking: {
          include: {
            facility: {
              select: {
                id: true,
                name: true,
                type: true,
                zoneId: true,
                zone: { select: { id: true, name: true, type: true } },
              },
            },
          },
        },
        _count: {
          select: {
            visitors: true,
            vipGuests: true,
            trips: true,
            orders: true,
            serviceRequests: true,
            tasks: true,
            incidents: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getBoard(id: string) {
    const pack = await this.prisma.eventPack.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            facility: {
              include: { zone: { select: { id: true, name: true, type: true, liveOccupancy: true, capacity: true } } },
            },
          },
        },
        visitors: { orderBy: { createdAt: "desc" } },
        vipGuests: { orderBy: { arrivalDatetime: "asc" } },
        serviceRequests: {
          include: { lounge: { select: { id: true, name: true, status: true } } },
          orderBy: { requestedAt: "desc" },
        },
        orders: {
          include: { outlet: { select: { id: true, name: true, type: true, status: true } } },
          orderBy: { placedAt: "desc" },
        },
        trips: {
          include: { vehicle: { select: { id: true, type: true, driverName: true, status: true } } },
          orderBy: { requestedAt: "desc" },
        },
        tasks: { orderBy: { createdAt: "asc" } },
        incidents: { orderBy: { createdAt: "desc" } },
        credentials: { orderBy: { createdAt: "desc" } },
        parkingReservations: {
          include: { parkingZone: { select: { id: true, name: true, type: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!pack) throw new NotFoundException("Event pack not found");

    const facilityId = pack.booking.facilityId;
    const zoneId = pack.booking.facility.zoneId;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [surfaces, equipment, gates, accessEvents, lounges, outlets, parking, vehicleLogs, member] = await Promise.all([
      this.prisma.surface.findMany({
        where: { facilityId },
        include: { facility: { select: { id: true, name: true, type: true } } },
      }),
      this.prisma.equipment.findMany({ orderBy: { name: "asc" }, take: 20 }),
      this.prisma.gate.findMany({
        where: { zoneId },
        include: { zone: { select: { id: true, name: true, type: true } } },
      }),
      this.prisma.accessLogEntry.findMany({
        where: { timestamp: { gte: startOfToday }, gate: { zoneId } },
        include: { gate: { select: { id: true, name: true, type: true } } },
        orderBy: { timestamp: "desc" },
        take: 20,
      }),
      this.prisma.lounge.findMany({
        where: { zoneId },
        include: { zone: { select: { id: true, name: true, type: true } } },
      }),
      this.prisma.outlet.findMany({
        where: { zoneId },
        include: { zone: { select: { id: true, name: true, type: true } } },
      }),
      this.prisma.parkingZone.findMany({
        where: { zoneId },
        include: { zone: { select: { id: true, name: true, type: true } } },
      }),
      this.prisma.vehicleLogEntry.findMany({
        where: { parkingZone: { zoneId }, entryTime: { gte: startOfToday } },
        include: { parkingZone: { select: { id: true, name: true, type: true } } },
        orderBy: { entryTime: "desc" },
        take: 20,
      }),
      pack.booking.memberId
        ? this.prisma.member.findUnique({ where: { id: pack.booking.memberId } })
        : Promise.resolve(null),
    ]);

    const closedSurfaces = surfaces.filter((s) => s.closureStatus !== "Open");
    const openRequests = pack.serviceRequests.filter((r) => r.status !== "Delivered");
    const activeTrips = pack.trips.filter((t) => t.status !== "Completed" && t.status !== "Cancelled");
    const onsiteVisitors = pack.visitors.filter((v) => v.status === "Checked In");
    const liveVips = pack.vipGuests.filter((v) => v.status === "Arrived");
    const parkingOccupied = parking.reduce((sum, z) => sum + z.occupied, 0);
    const parkingCapacity = parking.reduce((sum, z) => sum + z.capacity, 0);
    const openTasks = pack.tasks.filter((t) => t.status !== "Done");
    const openIncidents = pack.incidents.filter((i) => i.status === "Open");

    return {
      pack: {
        id: pack.id,
        title: pack.title,
        status: pack.status,
        expectedCount: pack.expectedCount,
        createdAt: pack.createdAt,
        updatedAt: pack.updatedAt,
      },
      booking: pack.booking,
      member,
      surfaces,
      equipment,
      gates,
      accessEvents,
      visitors: pack.visitors,
      vipGuests: pack.vipGuests,
      lounges,
      serviceRequests: pack.serviceRequests,
      outlets,
      orders: pack.orders,
      parking,
      vehicleLogs,
      trips: pack.trips,
      tasks: pack.tasks,
      incidents: pack.incidents,
      credentials: pack.credentials,
      parkingReservations: pack.parkingReservations,
      readiness: {
        surfaceReady: closedSurfaces.length === 0 && openIncidents.filter((i) => i.relatedType === "Surface").length === 0,
        venueReady: pack.booking.facility.status === "Available" || pack.booking.facility.status === "Reserved" || pack.booking.facility.status === "In Use",
        accessOnline: gates.some((g) => g.status === "Online"),
        hospitalityReady: lounges.some((l) => l.status === "Open"),
        fnbReady: outlets.some((o) => o.status === "Open"),
        transportReady: pack.trips.length > 0,
      },
      counts: {
        visitors: pack.visitors.length,
        visitorsOnsite: onsiteVisitors.length,
        vips: pack.vipGuests.length,
        vipsArrived: liveVips.length,
        openServiceRequests: openRequests.length,
        orders: pack.orders.length,
        trips: pack.trips.length,
        activeTrips: activeTrips.length,
        gates: gates.length,
        parkingOccupied,
        parkingCapacity,
        closedSurfaces: closedSurfaces.length,
        openTasks: openTasks.length,
        openIncidents: openIncidents.length,
        credentials: pack.credentials.length,
        parkingReservations: pack.parkingReservations.length,
      },
    };
  }

  /** Idempotent: confirmed booking becomes surface, people, access, hospitality, parking and transport work. */
  async provisionOperationalChain(packId: string) {
    const pack = await this.prisma.eventPack.findUnique({
      where: { id: packId },
      include: {
        booking: { include: { facility: { include: { zone: true } } } },
        tasks: true,
        visitors: true,
        trips: true,
        serviceRequests: true,
        credentials: true,
        parkingReservations: true,
      },
    });
    if (!pack) return null;

    const zoneId = pack.booking.facility.zoneId;
    const dueAt = new Date(pack.booking.date);
    dueAt.setUTCHours(8, 0, 0, 0);

    if (pack.tasks.length === 0) {
      await this.prisma.opsTask.createMany({
        data: [
          { eventPackId: packId, title: "Pre-event surface inspection", area: "Surface", priority: "High", dueAt },
          { eventPackId: packId, title: "Issue access credentials", area: "Access", dueAt },
          { eventPackId: packId, title: "Hospitality readiness", area: "Hospitality", dueAt },
          { eventPackId: packId, title: "Allocate parking permits", area: "Parking", dueAt },
          { eventPackId: packId, title: "Dispatch event transport", area: "Transport", dueAt },
          { eventPackId: packId, title: "Post-event settlement", area: "Finance", priority: "High" },
        ],
      });
    }

    if (pack.visitors.length === 0) {
      await this.prisma.visitor.create({
        data: {
          name: pack.booking.customerName,
          host: "Event operations",
          purpose: `${pack.booking.type} booking`,
          category: "Guest",
          eventPackId: packId,
        },
      });
    }

    if (pack.serviceRequests.length === 0) {
      const lounge = await this.prisma.lounge.findFirst({ where: { zoneId } });
      if (lounge) {
        await this.prisma.serviceRequest.create({
          data: {
            loungeId: lounge.id,
            partyRef: pack.booking.customerName,
            item: "Event refreshment plan",
            eventPackId: packId,
          },
        });
      }
    }

    if (pack.trips.length === 0) {
      const vehicle = await this.prisma.fleetVehicle.findFirst({ where: { status: "Available" } });
      if (vehicle) {
        await this.prisma.trip.create({
          data: {
            vehicleId: vehicle.id,
            passengerRef: pack.booking.customerName,
            fromLocation: "Main Gate North",
            toLocation: pack.booking.facility.name,
            status: "Requested",
            eventPackId: packId,
          },
        });
      }
    }

    if (pack.parkingReservations.length === 0) {
      const bay = await this.prisma.parkingZone.findFirst({ where: { zoneId } })
        ?? await this.prisma.parkingZone.findFirst();
      if (bay) {
        await this.prisma.parkingReservation.create({
          data: {
            eventPackId: packId,
            parkingZoneId: bay.id,
            plateNumber: `EVT-${pack.booking.customerName.slice(0, 3).toUpperCase()}`,
            status: "Reserved",
          },
        });
      }
    }

    if (pack.credentials.length === 0) {
      const visitor = await this.prisma.visitor.findFirst({
        where: { eventPackId: packId, name: pack.booking.customerName },
      });
      await this.prisma.credential.create({
        data: {
          holderRef: pack.booking.customerName,
          type: pack.booking.memberId ? "Member" : "Visitor",
          eventPackId: packId,
          memberId: pack.booking.memberId ?? undefined,
          visitorId: visitor?.id,
          validTo: new Date(new Date(pack.booking.date).getTime() + 86400000),
        },
      });
    }

    await this.prisma.notification.create({
      data: {
        title: "Event pack opened",
        body: `${pack.title} is now operational across venue, access, hospitality, parking and transport.`,
        href: `/?event=${packId}`,
      },
    });

    return this.getBoard(packId);
  }
}
