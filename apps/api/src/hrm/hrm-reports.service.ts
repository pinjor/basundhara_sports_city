import { Injectable } from "@nestjs/common";
import { LEAVE_ENTITLEMENT, SKILL_LEVELS, type ReportResult } from "@bsc/shared";
import { col, monthKey, percent, report, startOfToday, sum } from "../common/report";
import { isoDay } from "../common/resource/resource-mapper";
import { PrismaService } from "../prisma/prisma.service";

const DAY_MS = 86_400_000;
const ATTENDANCE_WINDOW_DAYS = 30;
const ANALYTICS_MONTHS = 6;
const PRESENT = ["CHECKED_IN", "CHECKED_OUT"];

@Injectable()
export class HrmReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async headcount(): Promise<ReportResult> {
    const today = startOfToday();
    const [departments, onLeaveToday] = await Promise.all([
      this.prisma.department.findMany({ orderBy: { name: "asc" }, include: { employees: { select: { id: true, status: true } }, positions: { select: { openings: true, status: true } } } }),
      this.prisma.leaveRequest.findMany({ where: { status: "APPROVED", fromOn: { lte: today }, toOn: { gte: today } }, select: { employeeId: true } }),
    ]);
    const away = new Set(onLeaveToday.map((leave) => leave.employeeId));
    const rows = departments.map((department) => {
      const staff = department.employees.filter((person) => person.status !== "EXITED");
      return {
        department: department.name,
        head: department.head,
        headcount: staff.length,
        onLeave: staff.filter((person) => person.status === "ON_LEAVE" || away.has(person.id)).length,
        openings: sum(department.positions.filter((position) => position.status === "ACTIVE"), (position) => position.openings),
      };
    });
    return report(
      "Headcount by department",
      [col("department", "Department"), col("head", "Head"), col("headcount", "Headcount", "number"), col("onLeave", "On leave today", "number"), col("openings", "Open positions", "number")],
      rows,
      [
        { label: "Headcount", value: sum(rows, (row) => row.headcount), kind: "number" },
        { label: "On leave today", value: sum(rows, (row) => row.onLeave), kind: "number" },
        { label: "Open positions", value: sum(rows, (row) => row.openings), kind: "number" },
      ],
    );
  }

  async analytics(): Promise<ReportResult> {
    const today = startOfToday();
    const since = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (ANALYTICS_MONTHS - 1), 1));
    const [employees, exits, attendance, leave] = await Promise.all([
      this.prisma.employee.findMany({ select: { joinedOn: true, status: true } }),
      this.prisma.auditLog.findMany({ where: { entityType: "employee", action: "STATUS_EXITED", createdAt: { gte: since } }, select: { createdAt: true } }),
      this.prisma.attendanceRecord.findMany({ where: { workDate: { gte: since, lte: today } }, select: { workDate: true, status: true } }),
      this.prisma.leaveRequest.findMany({ where: { status: "APPROVED", fromOn: { gte: since } }, select: { fromOn: true, days: true } }),
    ]);
    const rows = Array.from({ length: ANALYTICS_MONTHS }, (_, index) => {
      const month = monthKey(new Date(Date.UTC(since.getUTCFullYear(), since.getUTCMonth() + index, 1)));
      const marked = attendance.filter((record) => monthKey(record.workDate) === month && record.status !== "EXPECTED");
      return {
        month,
        joiners: employees.filter((person) => monthKey(person.joinedOn) === month).length,
        leavers: exits.filter((exit) => monthKey(exit.createdAt) === month).length,
        attendanceRate: percent(marked.filter((record) => PRESENT.includes(record.status)).length, marked.length),
        leaveDays: sum(
          leave.filter((request) => monthKey(request.fromOn) === month),
          (request) => request.days,
        ),
      };
    });
    const active = employees.filter((person) => person.status !== "EXITED").length;
    return report(
      "Workforce analytics",
      [col("month", "Month"), col("joiners", "Joiners", "number"), col("leavers", "Leavers", "number"), col("attendanceRate", "Attendance", "percent"), col("leaveDays", "Leave days", "number")],
      rows,
      [
        { label: "Active staff", value: active, kind: "number" },
        { label: `Joiners (${ANALYTICS_MONTHS} months)`, value: sum(rows, (row) => row.joiners), kind: "number" },
        { label: `Leavers (${ANALYTICS_MONTHS} months)`, value: sum(rows, (row) => row.leavers), kind: "number" },
      ],
    );
  }

  async onDuty(): Promise<ReportResult> {
    const today = startOfToday();
    const [departments, shifts, attendance] = await Promise.all([
      this.prisma.department.findMany({ orderBy: { name: "asc" }, include: { employees: { where: { status: { not: "EXITED" } }, select: { id: true } } } }),
      this.prisma.shift.findMany({ where: { workDate: today, status: { in: ["SCHEDULED", "COMPLETED"] } }, select: { employeeId: true } }),
      this.prisma.attendanceRecord.findMany({ where: { workDate: today }, select: { employeeId: true, status: true } }),
    ]);
    const rostered = new Set(shifts.map((shift) => shift.employeeId));
    const rows = departments.map((department) => {
      const ids = new Set(department.employees.map((person) => person.id));
      const mine = attendance.filter((record) => ids.has(record.employeeId));
      return {
        department: department.name,
        staff: ids.size,
        rostered: [...ids].filter((id) => rostered.has(id)).length,
        onSite: mine.filter((record) => record.status === "CHECKED_IN").length,
        left: mine.filter((record) => record.status === "CHECKED_OUT").length,
        absent: mine.filter((record) => record.status === "ABSENT").length,
      };
    });
    return report(
      `On duty · ${isoDay(today)}`,
      [
        col("department", "Department"),
        col("staff", "Staff", "number"),
        col("rostered", "Rostered", "number"),
        col("onSite", "On site", "number"),
        col("left", "Checked out", "number"),
        col("absent", "Absent", "number"),
      ],
      rows,
      [
        { label: "On site now", value: sum(rows, (row) => row.onSite), kind: "number" },
        { label: "Rostered today", value: sum(rows, (row) => row.rostered), kind: "number" },
        { label: "Absent", value: sum(rows, (row) => row.absent), kind: "number" },
      ],
    );
  }

  async attendance(): Promise<ReportResult> {
    const today = startOfToday();
    const since = new Date(today.getTime() - (ATTENDANCE_WINDOW_DAYS - 1) * DAY_MS);
    const records = await this.prisma.attendanceRecord.findMany({
      where: { workDate: { gte: since, lte: today } },
      include: { employee: { select: { name: true, department: { select: { name: true } } } } },
    });
    const byPerson = new Map<string, { employee: string; department: string; present: number; absent: number; marked: number }>();
    for (const record of records) {
      const row = byPerson.get(record.employeeId) ?? { employee: record.employee.name, department: record.employee.department.name, present: 0, absent: 0, marked: 0 };
      if (record.status !== "EXPECTED") row.marked += 1;
      if (PRESENT.includes(record.status)) row.present += 1;
      if (record.status === "ABSENT") row.absent += 1;
      byPerson.set(record.employeeId, row);
    }
    const rows = [...byPerson.values()].map((row) => ({ ...row, rate: percent(row.present, row.marked) })).sort((a, b) => a.rate - b.rate);
    return report(
      `Attendance · last ${ATTENDANCE_WINDOW_DAYS} days`,
      [col("employee", "Employee"), col("department", "Department"), col("present", "Present", "number"), col("absent", "Absent", "number"), col("rate", "Attendance", "percent")],
      rows,
      [{ label: "Overall attendance", value: percent(sum(rows, (row) => row.present), sum(rows, (row) => row.marked)), kind: "percent" }],
    );
  }

  async leaveBalances(): Promise<ReportResult> {
    const year = startOfToday().getUTCFullYear();
    const types = Object.keys(LEAVE_ENTITLEMENT);
    const [employees, approved] = await Promise.all([
      this.prisma.employee.findMany({ where: { status: { not: "EXITED" } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
      this.prisma.leaveRequest.groupBy({
        by: ["employeeId", "leaveType"],
        where: { status: "APPROVED", fromOn: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } },
        _sum: { days: true },
      }),
    ]);
    const used = (employeeId: string, type: string) => approved.find((group) => group.employeeId === employeeId && group.leaveType === type)?._sum.days ?? 0;
    const rows = employees.map((person) => ({
      employee: person.name,
      ...Object.fromEntries(types.filter((type) => type !== "Maternity").map((type) => [type.toLowerCase(), LEAVE_ENTITLEMENT[type]! - used(person.id, type)])),
    }));
    return report(
      `Leave left · ${year}`,
      [col("employee", "Employee"), ...types.filter((type) => type !== "Maternity").map((type) => col(type.toLowerCase(), `${type} (of ${LEAVE_ENTITLEMENT[type]})`, "number"))],
      rows,
    );
  }

  async skillMatch(query: Record<string, unknown>): Promise<ReportResult> {
    const search = typeof query.skill === "string" ? query.skill.trim() : "";
    const holdings = await this.prisma.employeeSkill.findMany({
      where: { status: "ACTIVE", employee: { status: "ACTIVE" }, ...(search ? { skill: { name: { contains: search, mode: "insensitive" as const } } } : {}) },
      include: { skill: { select: { name: true } }, employee: { select: { name: true, phone: true, department: { select: { name: true } } } } },
    });
    const rank = (level: string) => SKILL_LEVELS.indexOf(level as (typeof SKILL_LEVELS)[number]);
    const rows = holdings
      .map((holding) => ({ skill: holding.skill.name, employee: holding.employee.name, department: holding.employee.department.name, level: holding.level, phone: holding.employee.phone }))
      .sort((a, b) => a.skill.localeCompare(b.skill) || rank(b.level) - rank(a.level));
    return report(
      search ? `Staff with "${search}"` : "Staff skills",
      [col("skill", "Skill"), col("employee", "Employee"), col("department", "Department"), col("level", "Level"), col("phone", "Phone")],
      rows,
      [{ label: "Matches", value: rows.length, kind: "number" }],
    );
  }
}
