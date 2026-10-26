import { Injectable } from "@nestjs/common";
import { AccessResult } from "@bsc/shared";
import { PrismaService } from "../prisma/prisma.service";
import { addDays, bucketSum, delta, num, pct, startOfDay, type Bucket, type RangeKey } from "./range";

const FIRST_HOUR = 6;
const LAST_HOUR = 22;
const RECENT = 8;
const HOUR = 3_600_000;
/** Asia/Dhaka is UTC+6 all year. */
const DHAKA_OFFSET = 6 * HOUR;

/** Start of the Dhaka calendar day containing `now`, as a UTC instant, shifted by `days`. */
function dhakaDay(now: Date, days: number): Date {
  return new Date(addDays(startOfDay(new Date(now.getTime() + DHAKA_OFFSET)), days).getTime() - DHAKA_OFFSET);
}

/** Hourly buckets from 06:00 to 22:00 Dhaka time on the day starting at `day`. */
function hourBuckets(day: Date): Bucket[] {
  return Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => {
    const from = new Date(day.getTime() + (FIRST_HOUR + i) * HOUR);
    const hour = FIRST_HOUR + i;
    return { label: `${hour % 12 || 12}${hour < 12 ? "AM" : "PM"}`, from, to: new Date(from.getTime() + HOUR) };
  });
}

/** Cameras, alerts, incidents, access and vehicle movement for the security dashboard. */
@Injectable()
export class SecurityDashboard {
  constructor(private readonly prisma: PrismaService) {}

  async get(range: RangeKey) {
    const key = range === "yesterday" ? "yesterday" : "today";
    const from = dhakaDay(new Date(), key === "yesterday" ? -1 : 0);
    const w = { key, from, to: addDays(from, 1), prevFrom: addDays(from, -1), prevTo: from };
    const [cameras, alerts, resolvedAlerts, incidents, access, prevAccess, vehicles, prevVehicles, lockdown] = await Promise.all([
      this.prisma.camera.findMany({ orderBy: { reference: "asc" } }),
      this.prisma.securityAlert.findMany({ where: { status: { in: ["OPEN", "ACKNOWLEDGED"] } }, include: { camera: { select: { name: true, imageUrl: true, reference: true } } }, orderBy: { createdAt: "desc" } }),
      this.prisma.securityAlert.findMany({ where: { status: "RESOLVED" }, include: { camera: { select: { name: true, imageUrl: true, reference: true } } }, orderBy: { resolvedAt: "desc" }, take: RECENT }),
      this.prisma.opsIncident.findMany({ where: { status: { not: "Resolved" } }, orderBy: { createdAt: "desc" } }),
      this.prisma.accessLogEntry.findMany({ where: { timestamp: { gte: w.from, lt: w.to } }, select: { timestamp: true, result: true, gate: { select: { zone: { select: { name: true } } } } } }),
      this.prisma.accessLogEntry.count({ where: { timestamp: { gte: w.prevFrom, lt: w.prevTo } } }),
      this.prisma.vehicleLogEntry.findMany({ where: { OR: [{ entryTime: { gte: w.from, lt: w.to } }, { exitTime: { gte: w.from, lt: w.to } }] }, select: { entryTime: true, exitTime: true } }),
      this.prisma.vehicleLogEntry.count({ where: { entryTime: { gte: w.prevFrom, lt: w.prevTo } } }),
      this.prisma.lockdownEvent.findFirst({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" } }),
    ]);
    const zones = await this.prisma.zone.findMany({ where: { capacity: { gt: 0 } }, select: { name: true, capacity: true, liveOccupancy: true }, orderBy: { name: "asc" } });

    const online = cameras.filter((camera) => camera.status === "ONLINE").length;
    const hours = hourBuckets(w.from);
    const granted = access.filter((entry) => entry.result === AccessResult.APPROVED).length;
    const denied = access.filter((entry) => entry.result === AccessResult.DENIED).length;
    const entries = vehicles.filter((v) => v.entryTime >= w.from && v.entryTime < w.to);
    const exits = vehicles.filter((v): v is { entryTime: Date; exitTime: Date } => !!v.exitTime && v.exitTime >= w.from && v.exitTime < w.to);
    const flowPeople = bucketSum(hours, access, (entry) => entry.timestamp);
    const peak = flowPeople.reduce((top, v, i) => (v > (flowPeople[top] ?? 0) ? i : top), 0);
    const byZone = (rows: typeof access) => {
      const counts = new Map<string, number>();
      for (const row of rows) counts.set(row.gate.zone.name, (counts.get(row.gate.zone.name) ?? 0) + 1);
      return zones.map((zone) => ({ zone: zone.name, value: counts.get(zone.name) ?? 0, capacity: zone.capacity }));
    };
    const peakBucket = hours[peak]!;
    const serious = (severity: string) => severity === "Critical" || severity === "High";
    const shapeAlert = (alert: (typeof alerts)[number]) => ({
      id: alert.id,
      reference: alert.reference,
      kind: alert.kind,
      severity: alert.severity,
      status: alert.status,
      location: alert.location,
      subject: alert.subject,
      camera: alert.camera ? { id: alert.cameraId, name: alert.camera.name, reference: alert.camera.reference, imageUrl: alert.camera.imageUrl } : null,
      createdAt: alert.createdAt.toISOString(),
      acknowledgedAt: alert.acknowledgedAt?.toISOString() ?? null,
      resolvedAt: alert.resolvedAt?.toISOString() ?? null,
    });

    return {
      range: w.key,
      kpis: {
        cameras: cameras.length,
        camerasOnline: online,
        activeAlerts: alerts.filter((a) => a.status === "OPEN").length,
        acknowledgedAlerts: alerts.filter((a) => a.status === "ACKNOWLEDGED").length,
        people: access.length,
        peopleDelta: delta(access.length, prevAccess),
        vehicles: entries.length,
        vehiclesDelta: delta(entries.length, prevVehicles),
        uptime: pct(online, cameras.length),
        critical: incidents.filter((i) => serious(i.severity)).length + alerts.filter((a) => a.status === "OPEN" && serious(a.severity)).length,
      },
      cameras: cameras.map((camera) => ({
        id: camera.id,
        reference: camera.reference,
        name: camera.name,
        zone: camera.zone,
        location: camera.location,
        imageUrl: camera.imageUrl,
        status: camera.status,
        mapX: camera.mapX === null ? null : num(camera.mapX),
        mapY: camera.mapY === null ? null : num(camera.mapY),
        alert: alerts.some((alert) => alert.cameraId === camera.id && alert.status === "OPEN"),
      })),
      alerts: alerts.map(shapeAlert),
      events: [...alerts, ...resolvedAlerts].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, RECENT).map(shapeAlert),
      incidents: incidents.map((incident) => ({ id: incident.id, title: incident.title, severity: incident.severity, status: incident.status, notes: incident.notes, createdAt: incident.createdAt.toISOString() })),
      flow: { labels: hours.map((h) => h.label), people: flowPeople },
      crowd: {
        live: zones.map((zone) => ({ zone: zone.name, value: zone.liveOccupancy, capacity: zone.capacity })),
        entries: byZone(access),
        peak: { label: peakBucket.label, zones: byZone(access.filter((entry) => entry.timestamp >= peakBucket.from && entry.timestamp < peakBucket.to)) },
      },
      traffic: { labels: hours.map((h) => h.label), entries: bucketSum(hours, entries, (v) => v.entryTime), exits: bucketSum(hours, exits, (v) => v.exitTime) },
      access: { total: access.length, granted, denied, other: access.length - granted - denied },
      lockdown: lockdown ? { id: lockdown.id, reference: lockdown.reference, reason: lockdown.reason, scope: lockdown.scope, drill: lockdown.drill, startedAt: lockdown.createdAt.toISOString() } : null,
      window: { from: w.from.toISOString(), to: w.to.toISOString() },
    };
  }
}
