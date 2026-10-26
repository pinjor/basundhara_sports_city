import { Injectable, type OnModuleInit } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { LEAVE_ENTITLEMENT } from "@bsc/shared";
import { startOfToday } from "../common/report";
import { ReferenceService } from "../common/reference.service";
import { assertEditable, fail } from "../common/resource/guards";
import { ResourceHookRegistry } from "../common/resource/resource-hooks";
import { decimal, money, type Data, type Row } from "../common/resource/resource-mapper";
import { JournalService } from "../finance/journal.service";
import { LEDGER, round2 } from "../finance/ledger";
import { payslipFor } from "./payroll";

const DAY_MS = 86_400_000;
const ONBOARDING_CHECKLIST: [string, number][] = [
  ["Contract and ID documents", 3],
  ["Access badge and system accounts", 5],
  ["Induction and safety briefing", 7],
];

const merge = (data: Data, existing?: Row) => ({ ...existing, ...data }) as Data;

/** Inclusive calendar days between two dates. */
export function leaveDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1;
}

/** Minutes since midnight; an end at or before the start runs past midnight. */
export function shiftWindow(startsAt: string, endsAt: string): [number, number] {
  const toMinutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
  const start = toMinutes(startsAt);
  let end = toMinutes(endsAt);
  if (end <= start) end += 24 * 60;
  return [start, end];
}

interface Counter {
  count(args: object): Promise<number>;
}

/** Friendly duplicate check ahead of a unique index. */
async function assertNoDuplicate(tx: Prisma.TransactionClient, model: string, where: Data, existing: Row | undefined, message: string) {
  const delegate = (tx as unknown as Record<string, Counter>)[model]!;
  const clash = await delegate.count({ where: { ...where, ...(existing ? { id: { not: existing.id } } : {}) } });
  if (clash) fail(message);
}

/** People, time, leave, pay and training rules. */
@Injectable()
export class HrmHooks implements OnModuleInit {
  constructor(
    private readonly hooks: ResourceHookRegistry,
    private readonly references: ReferenceService,
    private readonly journal: JournalService,
  ) {}

  onModuleInit() {
    this.hooks.register("employee", {
      prepare: async (data, { tx }, existing) => {
        const merged = merge(data, existing);
        if (typeof merged.positionId === "string") {
          const position = await tx.position.findUnique({ where: { id: merged.positionId } });
          if (position && position.departmentId !== merged.departmentId) fail(`${position.title} belongs to a different department`);
        }
        return data;
      },
    });

    this.hooks.register("position", {
      prepare: (data, _ctx, existing) => {
        if (Number(merge(data, existing).openings) < 0) fail("Openings cannot be negative");
        return data;
      },
    });

    this.hooks.register("candidate", {
      prepare: (data, _ctx, existing) => (assertEditable(existing, ["APPLIED", "INTERVIEW", "OFFER"]), data),
      beforeTransition: async (row, to, { tx }) => {
        if (to !== "HIRED") return;
        const position = await tx.position.findUniqueOrThrow({ where: { id: String(row.positionId) } });
        if (position.openings < 1) fail(`${position.title} has no open seats`);
      },
      afterTransition: async (row, _from, ctx) => {
        if (row.status === "HIRED") await this.hire(ctx.tx, row, ctx.user.id);
      },
    });

    this.hooks.register("attendanceRecord", {
      prepare: async (data, { tx }, existing) => {
        assertEditable(existing, ["EXPECTED", "CHECKED_IN"]);
        const merged = merge(data, existing);
        await assertNoDuplicate(tx, "attendanceRecord", { employeeId: merged.employeeId, workDate: merged.workDate }, existing, "This person already has attendance for that date");
        return data;
      },
      beforeTransition: (_row, to) => {
        if (to === "CHECKED_IN") return { checkInAt: new Date() };
        if (to === "CHECKED_OUT") return { checkOutAt: new Date() };
      },
    });

    this.hooks.register("leaveRequest", {
      prepare: (data, _ctx, existing) => {
        assertEditable(existing, ["PENDING"]);
        const merged = merge(data, existing);
        const from = merged.fromOn as Date;
        const to = merged.toOn as Date;
        if (to < from) fail("Leave cannot end before it starts");
        return { ...data, days: leaveDays(from, to) };
      },
      beforeTransition: async (row, to, { tx, user }) => {
        if (to === "APPROVED") await this.assertAllowance(tx, row);
        return { decidedBy: user.name, decidedAt: new Date() };
      },
    });

    this.hooks.register("payrollRun", {
      prepare: async (data, { tx }, existing) => {
        assertEditable(existing, ["DRAFT"]);
        const period = String(merge(data, existing).period);
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) fail("Period must look like 2026-10");
        await assertNoDuplicate(tx, "payrollRun", { period }, existing, `A payroll run for ${period} already exists`);
        return data;
      },
      beforeTransition: async (row, to, ctx) => {
        if (to === "PROCESSED") return this.process(ctx.tx, row, ctx.user.id);
        if (to === "DRAFT") {
          await ctx.tx.payslip.deleteMany({ where: { payrollRunId: row.id } });
          return { headcount: 0, grossBdt: decimal(0), deductionsBdt: decimal(0), netBdt: decimal(0) };
        }
        if (to === "POSTED") return { postedAt: new Date() };
      },
      afterTransition: async (row, _from, { tx }) => {
        if (row.status !== "POSTED") return;
        await this.journal.post(tx, {
          date: row.payDate as Date,
          memo: `Payroll ${row.period} · ${row.headcount} staff`,
          sourceType: "payrollRun",
          sourceId: row.id,
          lines: [
            { account: { code: LEDGER.SALARIES }, debit: money(row.grossBdt) },
            { account: { code: LEDGER.CASH }, credit: money(row.netBdt) },
            { account: { code: LEDGER.PAYABLE }, credit: money(row.deductionsBdt) },
          ],
        });
      },
    });

    this.hooks.register("payslip", {
      prepare: () => fail("Payslips are produced by processing a payroll run"),
    });

    this.hooks.register("workforcePlan", {
      prepare: (data, _ctx, existing) => {
        const merged = merge(data, existing);
        if (Number(merged.headcount) <= 0) fail("Headcount must be more than zero");
        if (merged.scope === "EVENT" && !merged.eventPackId) fail("Choose the event this plan is for");
        if (merged.scope === "PERIOD" && !merged.period) fail("Choose the period this plan covers");
        return data;
      },
    });

    this.hooks.register("shift", {
      prepare: async (data, { tx }, existing) => {
        assertEditable(existing, ["SCHEDULED"]);
        const merged = merge(data, existing);
        if (merged.startsAt === merged.endsAt) fail("A shift needs different start and end times");
        const [start, end] = shiftWindow(String(merged.startsAt), String(merged.endsAt));
        const sameDay = await tx.shift.findMany({
          where: { employeeId: String(merged.employeeId), workDate: merged.workDate as Date, status: "SCHEDULED", ...(existing ? { id: { not: existing.id } } : {}) },
        });
        const clash = sameDay.find((other) => {
          const [otherStart, otherEnd] = shiftWindow(other.startsAt, other.endsAt);
          return start < otherEnd && otherStart < end;
        });
        if (clash) fail(`Overlaps ${clash.reference} (${clash.name}, ${clash.startsAt}-${clash.endsAt})`);
        return data;
      },
    });

    this.hooks.register("staffAssignment", { prepare: (data, _ctx, existing) => (assertEditable(existing, ["PLANNED", "IN_PROGRESS"]), data) });

    this.hooks.register("trainingSession", {
      prepare: (data, _ctx, existing) => {
        const seats = Number(merge(data, existing).seats);
        if (seats <= 0) fail("Seats must be more than zero");
        if (existing && seats < Number(existing.enrolled)) fail(`${existing.enrolled} people are already enrolled`);
        return data;
      },
    });

    this.hooks.register("trainingEnrollment", {
      prepare: async (data, { tx }, existing) => {
        assertEditable(existing, ["SCHEDULED"]);
        if (existing && data.trainingSessionId && data.trainingSessionId !== existing.trainingSessionId) fail("Cancel this enrollment and enroll in the other session instead");
        const merged = merge(data, existing);
        await assertNoDuplicate(tx, "trainingEnrollment", { trainingSessionId: merged.trainingSessionId, employeeId: merged.employeeId }, existing, "Already enrolled in this session");
        if (!existing) {
          const session = await tx.trainingSession.findUniqueOrThrow({ where: { id: String(merged.trainingSessionId) } });
          if (session.status === "COMPLETED" || session.status === "CANCELLED") fail(`${session.course} is ${session.status.toLowerCase()}`);
          if (session.enrolled >= session.seats) fail(`${session.course} is full (${session.seats} seats)`);
        }
        return data;
      },
      afterCreate: async (row, { tx }) => {
        await tx.trainingSession.update({ where: { id: String(row.trainingSessionId) }, data: { enrolled: { increment: 1 } } });
      },
      afterTransition: async (row, _from, { tx }) => {
        if (row.status === "CANCELLED") await tx.trainingSession.update({ where: { id: String(row.trainingSessionId) }, data: { enrolled: { decrement: 1 } } });
      },
    });

    this.hooks.register("employeeSkill", {
      prepare: async (data, { tx }, existing) => {
        const merged = merge(data, existing);
        await assertNoDuplicate(tx, "employeeSkill", { employeeId: merged.employeeId, skillId: merged.skillId }, existing, "This person already has that skill; edit the level instead");
        return data;
      },
    });

    this.hooks.register("performanceReview", {
      prepare: (data, _ctx, existing) => {
        assertEditable(existing, ["PLANNED", "IN_PROGRESS"]);
        const rating = Number(merge(data, existing).rating);
        if (rating < 1 || rating > 5) fail("Rating must be from 1 to 5");
        return data;
      },
    });

    this.hooks.register("goal", {
      prepare: (data, _ctx, existing) => {
        const score = Number(merge(data, existing).score);
        if (score < 0 || score > 100) fail("Score must be from 0 to 100");
        return data;
      },
    });

    this.hooks.register("announcement", {
      prepare: (data, _ctx, existing) => (assertEditable(existing, ["DRAFT"]), data),
      beforeTransition: (_row, to) => (to === "SENT" ? { sentAt: new Date() } : {}),
    });
  }

  private async assertAllowance(tx: Prisma.TransactionClient, row: Row) {
    const allowance = LEAVE_ENTITLEMENT[String(row.leaveType)];
    if (allowance === undefined) return;
    const from = row.fromOn as Date;
    const yearStart = new Date(Date.UTC(from.getUTCFullYear(), 0, 1));
    const yearEnd = new Date(Date.UTC(from.getUTCFullYear() + 1, 0, 1));
    const { _sum } = await tx.leaveRequest.aggregate({
      where: { employeeId: String(row.employeeId), leaveType: String(row.leaveType), status: "APPROVED", fromOn: { gte: yearStart, lt: yearEnd } },
      _sum: { days: true },
    });
    const used = _sum.days ?? 0;
    if (used + Number(row.days) > allowance) fail(`Only ${allowance - used} of ${allowance} ${String(row.leaveType).toLowerCase()} leave days left this year`);
  }

  private async process(tx: Prisma.TransactionClient, run: Row, userId: string): Promise<Data> {
    const payDate = run.payDate as Date;
    const staff = await tx.employee.findMany({ where: { status: { in: ["ACTIVE", "ON_LEAVE"] }, joinedOn: { lte: payDate } }, orderBy: { name: "asc" } });
    if (!staff.length) fail("No active staff to pay");
    await tx.payslip.deleteMany({ where: { payrollRunId: run.id } });
    const references = await this.references.block("PSL", staff.length, tx);
    const slips = staff.map((person) => ({ person, ...payslipFor(money(person.basicSalaryBdt)) }));
    await tx.payslip.createMany({
      data: slips.map((slip, index) => ({
        reference: references[index]!,
        status: "RECORDED",
        payrollRunId: run.id,
        employeeId: slip.person.id,
        grossBdt: decimal(slip.gross),
        deductionsBdt: decimal(slip.deductions),
        netBdt: decimal(slip.net),
        createdById: userId,
      })),
    });
    const gross = slips.reduce((total, slip) => total + slip.gross, 0);
    const deductions = slips.reduce((total, slip) => total + slip.deductions, 0);
    return { headcount: staff.length, grossBdt: decimal(round2(gross)), deductionsBdt: decimal(round2(deductions)), netBdt: decimal(round2(gross - deductions)) };
  }

  private async hire(tx: Prisma.TransactionClient, candidate: Row, userId: string) {
    const position = await tx.position.findUniqueOrThrow({ where: { id: String(candidate.positionId) } });
    const today = startOfToday();
    const employee = await tx.employee.create({
      data: {
        reference: await this.references.next("EMP", tx),
        status: "ACTIVE",
        name: String(candidate.name),
        departmentId: position.departmentId,
        positionId: position.id,
        phone: String(candidate.phone),
        email: String(candidate.email ?? ""),
        joinedOn: today,
        basicSalaryBdt: decimal(0),
        createdById: userId,
      },
    });
    await tx.position.update({ where: { id: position.id }, data: { openings: { decrement: 1 } } });
    await tx.candidate.update({ where: { id: candidate.id }, data: { employeeId: employee.id } });
    for (const [task, days] of ONBOARDING_CHECKLIST) {
      await tx.onboardingTask.create({
        data: {
          reference: await this.references.next("ONB", tx),
          status: "PLANNED",
          employeeId: employee.id,
          task,
          dueOn: new Date(today.getTime() + days * DAY_MS),
          createdById: userId,
        },
      });
    }
  }
}
