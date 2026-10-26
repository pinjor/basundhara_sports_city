import type { PrismaClient } from "@prisma/client";
import { Role } from "@bsc/shared";
import { IncidentsService } from "../../src/security/incidents.service";
import type { Seeder } from "./app";
import { daysFromToday } from "./util";

const iso = (offset: number) => daysFromToday(offset).toISOString().slice(0, 10);

const CAMERAS = [
  { name: "Main Entrance", zone: "Entrances & Exits", location: "North Gate", imageUrl: "/dash/cam-entrance.jpg", mapX: 14, mapY: 22 },
  { name: "North Fence", zone: "Perimeter", location: "North boundary", imageUrl: "/dash/cam-food.jpg", mapX: 36, mapY: 12 },
  { name: "Futsal Court", zone: "Sports Zone", location: "Futsal Court", imageUrl: "/dash/cam-futsal.jpg", mapX: 62, mapY: 16 },
  { name: "East Fence", zone: "Perimeter", location: "East Zone", imageUrl: "/dash/cam-food.jpg", mapX: 80, mapY: 22 },
  { name: "Parking Area", zone: "Parking Zone", location: "Parking A", imageUrl: "/dash/cam-parking.jpg", mapX: 22, mapY: 46 },
  { name: "Football Stadium", zone: "Stadium Zone", location: "Main bowl", imageUrl: "/dash/cam-stadium.jpg", mapX: 46, mapY: 40 },
  { name: "Stand East", zone: "Stadium Zone", location: "East Stand", imageUrl: "/dash/cam-stadium.jpg", mapX: 58, mapY: 54 },
  { name: "Retail Zone", zone: "Retail Zone", location: "Retail Strip", imageUrl: "/dash/cam-retail.jpg", mapX: 82, mapY: 48 },
  { name: "Food Court", zone: "F&B Zone", location: "Food Court", imageUrl: "/dash/cam-food.jpg", mapX: 30, mapY: 70 },
  { name: "Parking B", zone: "Parking Zone", location: "Parking B", imageUrl: "/dash/cam-parking.jpg", mapX: 52, mapY: 76 },
  { name: "Cricket Nets", zone: "Sports Zone", location: "Cricket Nets", imageUrl: "/dash/cam-futsal.jpg", mapX: 74, mapY: 72 },
  { name: "Entry Gate", zone: "Entrances & Exits", location: "South Gate", imageUrl: "/dash/cam-retail.jpg", mapX: 88, mapY: 84 },
];

/** Security, projects, event sign-off and inbox messages. */
export async function seedPlatform(seeder: Seeder): Promise<void> {
  const { prisma } = seeder;
  if ((await prisma.notification.count()) === 0) await seedNotifications(prisma);
  if (await seeder.empty("camera")) await seedSecurity(seeder);
  if (await seeder.empty("project")) await seedProjects(seeder);
  await seedEventApprovals(prisma);
}

async function seedNotifications(prisma: PrismaClient) {
  await prisma.notification.createMany({
    data: [
      { title: "Monthly payroll processed", body: "Payslips are ready for review before posting.", href: "/hrm?feature=payroll-management", role: Role.HR_MANAGER },
      { title: "Leave requests waiting", body: "Several leave requests need a decision today.", href: "/hrm?feature=leave-management", role: Role.HR_MANAGER },
      { title: "Vendor bill ready", body: "A matched purchase order created a payable invoice.", href: "/finance?feature=invoice-management", role: Role.FINANCE_CONTROLLER },
      { title: "Budget check", body: "Operations has committed most of its quarterly budget.", href: "/finance?feature=budget-management", role: Role.FINANCE_CONTROLLER },
      { title: "Waiting list offer", body: "A slot opened for a customer on the waiting list.", href: "/bookings?feature=waiting-list", role: Role.BOOKINGS_OFFICER },
      { title: "Match tickets selling", body: "Online sales opened for the next home fixture.", href: "/ticketing", role: Role.BOOKINGS_OFFICER },
      { title: "Events awaiting approval", body: "Upcoming events need the chairman's sign-off.", href: "/chairman", role: Role.CHAIRMAN },
      { title: "Welcome to Sports City", body: "Live figures now come straight from the operations database.", href: null, role: null },
    ],
  });
}

async function seedSecurity(seeder: Seeder) {
  const security = await seeder.actor("security@bsc.com.bd");
  const rec = (key: string, input: Record<string, unknown>, moves: string[] = []) => seeder.record(key, security, input, moves);

  const cameras: Awaited<ReturnType<typeof rec>>[] = [];
  for (const camera of CAMERAS) cameras.push(await rec("camera", camera));
  await seeder.move("camera", cameras[10]!.id, "MAINTENANCE", security);

  const camera = (name: string) => cameras.find((row) => row.name === name)!.id;
  await rec("securityAlert", { kind: "Unauthorized Access", severity: "Critical", cameraId: camera("Main Entrance"), location: "Main Gate" });
  await rec("securityAlert", { kind: "Suspicious Activity", severity: "High", cameraId: camera("Parking B"), location: "Parking Area" });
  await rec("securityAlert", { kind: "Crowd Density High", severity: "Medium", cameraId: camera("Football Stadium"), location: "Stadium" });
  await rec("securityAlert", { kind: "Vehicle Without Pass", severity: "High", cameraId: camera("Entry Gate"), location: "Entry Gate", subject: "Plate DHA-3321" });
  await rec("securityAlert", { kind: "Perimeter Breach", severity: "Critical", cameraId: camera("East Fence"), location: "East Zone" });
  await rec("securityAlert", { kind: "Camera Offline", severity: "Low", cameraId: camera("Cricket Nets"), location: "Cricket Nets" }, ["ACKNOWLEDGED"]);
  await rec("securityAlert", { kind: "Suspicious Activity", severity: "Medium", cameraId: camera("Food Court"), location: "Food Court", notes: "Unattended bag; owner found" }, ["RESOLVED"]);
  await rec("lockdownEvent", { reason: "Quarterly evacuation drill", scope: "All gates", drill: true }, ["ENDED"]);

  const incidents = seeder.service(IncidentsService);
  const logged = [];
  for (const incident of [
    { title: "Turnstile jam at Gate 3", severity: "Medium", notes: "Crowd rerouted to Gate 2" },
    { title: "Medical assist in North Stand", severity: "High", notes: "Spectator treated on site" },
    { title: "Fence damage on east perimeter", severity: "Critical", notes: "Temporary barrier placed" },
    { title: "Lost child reunited at Food Court", severity: "Low" },
  ]) {
    logged.push(await incidents.create(incident, security));
  }
  await incidents.setStatus(logged[0]!.id, "Investigating", security);
  await incidents.setStatus(logged[3]!.id, "Resolved", security);
}

async function seedProjects(seeder: Seeder) {
  const admin = await seeder.actor("admin@bsc.com.bd");
  for (const [name, owner, budgetBdt, progress, dueOn] of [
    ["East Stand Extension", "Civil Works", 640_000_000, 78, iso(75)],
    ["Indoor Arena Renovation", "Facilities", 220_000_000, 65, iso(45)],
    ["Aquatic Complex Phase 2", "Projects Office", 380_000_000, 42, iso(165)],
    ["Additional Parking Zone", "Infrastructure", 120_000_000, 55, iso(75)],
    ["Elite Training Center", "Sports Science", 460_000_000, 28, iso(240)],
  ] as const) {
    await seeder.record("project", admin, { name, owner, budgetBdt, progress, dueOn }, ["IN_PROGRESS"]);
  }
}

/** Upcoming event packs start out waiting for the chairman, unless someone has already decided one. */
async function seedEventApprovals(prisma: PrismaClient) {
  const decided = await prisma.eventPack.count({ where: { OR: [{ approvedAt: { not: null } }, { approvalStatus: "Pending" }] } });
  if (decided) return;
  await prisma.eventPack.updateMany({ where: { status: "Planning", booking: { date: { gte: daysFromToday(0) } } }, data: { approvalStatus: "Pending" } });
}
