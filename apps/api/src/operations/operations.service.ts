import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService) {}

  listTasks(params: { status?: string; eventPackId?: string }) {
    return this.prisma.opsTask.findMany({
      where: { status: params.status, eventPackId: params.eventPackId },
      include: { eventPack: { select: { id: true, title: true, status: true } } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
  }

  async setTaskStatus(id: string, status: string) {
    const task = await this.prisma.opsTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException("Task not found");
    return this.prisma.opsTask.update({ where: { id }, data: { status } });
  }

  listIncidents(params: { status?: string }) {
    return this.prisma.opsIncident.findMany({
      where: { status: params.status },
      include: { eventPack: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async search(q: string) {
    const query = q.trim();
    if (query.length < 2) return { facilities: [], bookings: [], members: [], visitors: [], vips: [], equipment: [], vehicles: [] };

    const [facilities, bookings, members, visitors, vips, equipment, vehicles] = await Promise.all([
      this.prisma.facility.findMany({
        where: { name: { contains: query, mode: "insensitive" } },
        take: 6,
        select: { id: true, name: true, type: true, status: true },
      }),
      this.prisma.booking.findMany({
        where: { customerName: { contains: query, mode: "insensitive" } },
        take: 6,
        include: { eventPack: { select: { id: true, title: true } }, facility: { select: { name: true } } },
      }),
      this.prisma.member.findMany({
        where: { OR: [{ name: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }] },
        take: 6,
        select: { id: true, name: true, status: true, tier: true },
      }),
      this.prisma.visitor.findMany({
        where: { name: { contains: query, mode: "insensitive" } },
        take: 6,
        select: { id: true, name: true, status: true, eventPackId: true },
      }),
      this.prisma.vIPGuest.findMany({
        where: { name: { contains: query, mode: "insensitive" } },
        take: 6,
        select: { id: true, name: true, status: true, classification: true },
      }),
      this.prisma.equipment.findMany({
        where: { name: { contains: query, mode: "insensitive" } },
        take: 6,
        select: { id: true, name: true, status: true },
      }),
      this.prisma.fleetVehicle.findMany({
        where: { OR: [{ type: { contains: query, mode: "insensitive" } }, { driverName: { contains: query, mode: "insensitive" } }] },
        take: 6,
        select: { id: true, type: true, driverName: true, status: true },
      }),
    ]);

    return { facilities, bookings, members, visitors, vips, equipment, vehicles };
  }
}
