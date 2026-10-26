import { Injectable } from "@nestjs/common";
import { HRM_ENTITIES, LEAVE_ENTITLEMENT } from "@bsc/shared";
import { isoDay } from "../common/resource/resource-mapper";
import { PrismaService } from "../prisma/prisma.service";
import { addDays, delta, pct, startOfDay, windowFor, type RangeKey } from "./range";

const UPCOMING_DAYS = 30;
const LIST_SIZE = 6;
const HR_KEYS = HRM_ENTITIES.map((entity) => entity.key);
const LABELS = new Map(HRM_ENTITIES.map((entity) => [entity.key, entity.label]));

/** Days from `today` to the next yearly recurrence of `date` (0 = today). */
export function daysUntilAnniversary(date: Date, today: Date): number {
  const next = new Date(Date.UTC(today.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  if (next < today) next.setUTCFullYear(today.getUTCFullYear() + 1);
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}

/** Headcount, attendance, leave and people events for the HR dashboard. */
@Injectable()
export class HrDashboard {
  constructor(private readonly prisma: PrismaService) {}

  async get(range: RangeKey) {
    const today = startOfDay(new Date());
    const w = windowFor(range);
    const month = windowFor("month");
    const yearStart = windowFor("year").from;
    const active = { status: { not: "EXITED" } };

    const [employees, departments, attendance, onLeave, hires, prevHires, leaveTaken, types, audit, joinedBefore] = await Promise.all([
      this.prisma.employee.findMany({ where: active, select: { name: true, joinedOn: true, birthDate: true, department: { select: { name: true } } } }),
      this.prisma.department.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      this.prisma.attendanceRecord.groupBy({ by: ["status"], where: { workDate: today }, _count: { _all: true } }),
      this.prisma.leaveRequest.count({ where: { status: "APPROVED", fromOn: { lte: today }, toOn: { gte: today } } }),
      this.prisma.employee.count({ where: { joinedOn: { gte: month.from, lt: month.to } } }),
      this.prisma.employee.count({ where: { joinedOn: { gte: month.prevFrom, lt: month.prevTo } } }),
      this.prisma.leaveRequest.groupBy({ by: ["leaveType"], where: { status: "APPROVED", fromOn: { gte: yearStart } }, _sum: { days: true }, _count: { _all: true } }),
      this.prisma.employee.groupBy({ by: ["employmentType"], where: active, _count: { _all: true } }),
      this.prisma.auditLog.findMany({ where: { entityType: { in: HR_KEYS } }, orderBy: { createdAt: "desc" }, take: LIST_SIZE, include: { user: { select: { name: true } } } }),
      this.prisma.employee.count({ where: { ...active, joinedOn: { lt: w.from } } }),
    ]);

    const headcount = await this.prisma.employee.groupBy({ by: ["departmentId"], where: { ...active, joinedOn: { lt: w.to } }, _count: { _all: true } });
    const countByDept = new Map(headcount.map((row) => [row.departmentId, row._count._all]));
    const total = employees.length;
    const status = (key: string) => attendance.find((row) => row.status === key)?._count._all ?? 0;
    const present = status("CHECKED_IN") + status("CHECKED_OUT");
    const absent = status("ABSENT");
    const takenTotal = leaveTaken.reduce((sum, row) => sum + (row._sum.days ?? 0), 0);

    const upcoming = (pick: (e: (typeof employees)[number]) => Date | null, withYears: boolean) =>
      employees
        .flatMap((employee) => {
          const date = pick(employee);
          if (!date) return [];
          const inDays = daysUntilAnniversary(date, today);
          const on = addDays(today, inDays);
          const years = on.getUTCFullYear() - date.getUTCFullYear();
          if (inDays > UPCOMING_DAYS || (withYears && years < 1)) return [];
          return [{ name: employee.name, department: employee.department.name, date: isoDay(on), inDays, years: withYears ? years : undefined }];
        })
        .sort((a, b) => a.inDays - b.inDays)
        .slice(0, LIST_SIZE);

    return {
      range,
      kpis: {
        employees: total,
        employeesDelta: delta(total, joinedBefore),
        present,
        presentPct: pct(present, total),
        onLeave,
        onLeavePct: pct(onLeave, total),
        newHires: hires,
        newHiresDelta: delta(hires, prevHires),
        newHiresChange: hires - prevHires,
      },
      headcount: departments.map((dept) => ({ department: dept.name, count: countByDept.get(dept.id) ?? 0 })).sort((a, b) => b.count - a.count),
      attendance: { present, onLeave, absent, expected: status("EXPECTED"), total },
      leave: Object.entries(LEAVE_ENTITLEMENT).map(([type, perYear]) => {
        const row = leaveTaken.find((item) => item.leaveType === type);
        const days = row?._sum.days ?? 0;
        return { type, days, requests: row?._count._all ?? 0, share: pct(days, takenTotal), entitlement: perYear };
      }),
      distribution: types.map((row) => ({ type: row.employmentType, count: row._count._all, pct: pct(row._count._all, total) })).sort((a, b) => b.count - a.count),
      activities: audit.map((entry) => ({
        id: entry.id,
        title: `${LABELS.get(entry.entityType) ?? entry.entityType} ${actionLabel(entry.action)}`,
        detail: `${describe(entry.after) ?? "Record"} · by ${entry.user.name}`,
        at: entry.createdAt.toISOString(),
      })),
      birthdays: upcoming((employee) => employee.birthDate, false),
      anniversaries: upcoming((employee) => employee.joinedOn, true),
    };
  }
}

function actionLabel(action: string): string {
  if (action === "CREATE") return "added";
  if (action === "UPDATE") return "updated";
  return action.replace(/^STATUS_/, "").replace(/_/g, " ").toLowerCase();
}

function describe(after: unknown): string | null {
  if (!after || typeof after !== "object") return null;
  const row = after as Record<string, unknown>;
  const name = row.name ?? row.title ?? row.employeeName ?? row.reference;
  return typeof name === "string" ? name : null;
}
