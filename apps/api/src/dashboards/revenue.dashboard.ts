import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { RequestUser } from "../auth/current-user.decorator";
import { isoDay } from "../common/resource/resource-mapper";
import { ResourceRegistry } from "../common/resource/resource.registry";
import { PrismaService } from "../prisma/prisma.service";
import { amountOf, bucketSum, delta, millions, monthBuckets, num, pct, startOfDay, trendBuckets, windowFor, type RangeKey } from "./range";

export const STREAM_LABELS: Record<string, string> = {
  RENTAL: "Facility Booking",
  EVENT: "Events & Tournaments",
  MEMBERSHIP: "Membership",
  TICKET: "Ticketing",
  SPONSORSHIP: "Sponsorship",
  OTHER: "Retail & Other",
};

type InvoiceRow = { status: string; dueOn: Date; totalBdt: unknown; paidBdt: unknown };

export function invoiceState(invoice: InvoiceRow, today = startOfDay(new Date())): string {
  if (invoice.status === "PAID") return "Paid";
  if (invoice.status === "DRAFT") return "Draft";
  if (invoice.status === "VOID") return "Void";
  if (invoice.dueOn < today) return "Overdue";
  return num(invoice.paidBdt as never) > 0 ? "Partial" : "Open";
}

/** Revenue, invoicing and collection figures for the finance dashboard. */
@Injectable()
export class RevenueDashboard {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: ResourceRegistry,
  ) {}

  async get(range: RangeKey) {
    const w = windowFor(range);
    const now = new Date();
    const thisYear = windowFor("year", now);
    const months = trendBuckets(w);
    const trendFrom = new Date(Math.min(months[0]!.from.getTime(), w.from.getTime()));
    const [trendRevenue, prevRevenue, invoices, prevInvoices, received, prevReceived, open, issued, lastYear, recent] = await Promise.all([
      this.prisma.revenueEntry.findMany({ where: { status: "POSTED", receivedOn: { gte: trendFrom, lt: w.to } }, select: { stream: true, receivedOn: true, amountBdt: true } }),
      this.prisma.revenueEntry.aggregate({ where: { status: "POSTED", receivedOn: { gte: w.prevFrom, lt: w.prevTo } }, _sum: { amountBdt: true } }),
      this.prisma.invoice.count({ where: { kind: "RECEIVABLE", status: { notIn: ["DRAFT", "VOID"] }, issuedOn: { gte: w.from, lt: w.to } } }),
      this.prisma.invoice.count({ where: { kind: "RECEIVABLE", status: { notIn: ["DRAFT", "VOID"] }, issuedOn: { gte: w.prevFrom, lt: w.prevTo } } }),
      this.prisma.payment.aggregate({ where: { direction: "IN", status: "CLEARED", paidOn: { gte: w.from, lt: w.to } }, _sum: { amountBdt: true } }),
      this.prisma.payment.aggregate({ where: { direction: "IN", status: "CLEARED", paidOn: { gte: w.prevFrom, lt: w.prevTo } }, _sum: { amountBdt: true } }),
      this.prisma.invoice.findMany({ where: { kind: "RECEIVABLE", status: "ISSUED" }, select: { totalBdt: true, paidBdt: true } }),
      this.prisma.invoice.findMany({ where: { kind: "RECEIVABLE", status: { notIn: ["DRAFT", "VOID"] }, issuedOn: { gte: trendFrom, lt: w.to } }, select: { issuedOn: true, totalBdt: true } }),
      this.prisma.revenueEntry.findMany({ where: { status: "POSTED", receivedOn: { gte: thisYear.prevFrom, lt: thisYear.from } }, select: { receivedOn: true, amountBdt: true } }),
      this.prisma.invoice.findMany({ where: { kind: "RECEIVABLE", status: { not: "VOID" } }, orderBy: [{ issuedOn: "desc" }, { createdAt: "desc" }], take: 6 }),
    ]);

    const revenue = trendRevenue.filter((row) => row.receivedOn >= w.from);
    const total = revenue.reduce((sum, row) => sum + num(row.amountBdt), 0);
    const receivedTotal = num(received._sum.amountBdt);
    const outstanding = open.reduce((sum, row) => sum + num(row.totalBdt) - num(row.paidBdt), 0);

    const byStream = new Map<string, number>();
    for (const row of revenue) byStream.set(row.stream, (byStream.get(row.stream) ?? 0) + num(row.amountBdt));
    const sources = [...byStream.entries()]
      .map(([stream, value]) => ({ label: STREAM_LABELS[stream] ?? stream, amount: value, pct: pct(value, total) }))
      .sort((a, b) => b.amount - a.amount);

    const yearMonths = monthBuckets(thisYear.from, new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1)));
    const lastYearMonths = monthBuckets(thisYear.prevFrom, thisYear.from);
    const thisYearRows = await this.prisma.revenueEntry.findMany({ where: { status: "POSTED", receivedOn: { gte: thisYear.from } }, select: { receivedOn: true, amountBdt: true } });

    const kpis = {
      revenue: total,
      revenueDelta: delta(total, num(prevRevenue._sum.amountBdt)),
      invoices,
      invoicesDelta: delta(invoices, prevInvoices),
      received: receivedTotal,
      receivedDelta: delta(receivedTotal, num(prevReceived._sum.amountBdt)),
      outstanding,
    };

    return {
      range,
      kpis,
      trend: {
        labels: months.map((m) => m.label),
        revenue: bucketSum(months, trendRevenue, (row) => row.receivedOn, amountOf).map(millions),
        invoiced: bucketSum(months, issued, (row) => row.issuedOn, (row) => num(row.totalBdt)).map(millions),
      },
      sources,
      comparison: {
        labels: yearMonths.map((m) => m.label),
        current: bucketSum(yearMonths, thisYearRows, (row) => row.receivedOn, amountOf).map(millions),
        previous: bucketSum(lastYearMonths, lastYear, (row) => row.receivedOn, amountOf).map(millions),
        currentYear: now.getUTCFullYear(),
      },
      invoices: recent.map((invoice) => ({
        id: invoice.id,
        reference: invoice.reference,
        party: invoice.party,
        service: invoice.notes || "Customer invoice",
        issuedOn: isoDay(invoice.issuedOn),
        dueOn: isoDay(invoice.dueOn),
        total: num(invoice.totalBdt),
        balance: num(invoice.totalBdt) - num(invoice.paidBdt),
        state: invoiceState(invoice),
        status: invoice.status,
      })),
      insights: this.insights(kpis, sources),
    };
  }

  private insights(kpis: { revenueDelta: number | null; outstanding: number; revenue: number }, sources: { label: string; pct: number }[]) {
    const list: { tone: "green" | "red" | "gold"; title: string; text: string }[] = [];
    if (kpis.revenueDelta !== null) {
      list.push({ tone: kpis.revenueDelta >= 0 ? "green" : "red", title: `Revenue ${kpis.revenueDelta >= 0 ? "up" : "down"} ${Math.abs(kpis.revenueDelta)}%`, text: "compared with the previous period" });
    }
    if (sources[0]) list.push({ tone: "green", title: `${sources[0].label} leads`, text: `${sources[0].pct}% of revenue in this period` });
    if (kpis.outstanding > 0) list.push({ tone: "gold", title: "Outstanding receivables", text: `${pct(kpis.outstanding, kpis.revenue + kpis.outstanding)}% of billed revenue is still to collect` });
    if (sources.length > 1) list.push({ tone: "green", title: `${sources[1]!.label} is second`, text: `${sources[1]!.pct}% of revenue` });
    return list;
  }

  /** Records a cleared payment for the open balance, which marks the invoice paid and posts the receipt. */
  async settle(invoiceId: string, user: RequestUser) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status !== "ISSUED") throw new BadRequestException(`${invoice.reference} is ${invoice.status} and cannot be settled`);
    const balance = Math.round((num(invoice.totalBdt) - num(invoice.paidBdt)) * 100) / 100;
    const payments = this.registry.get("payment");
    const payment = await payments.create({ invoiceId, method: "Bank", paidOn: isoDay(new Date()), amountBdt: balance }, user);
    await payments.transition(String(payment.id), "CLEARED", user);
    const updated = await this.prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    return { id: updated.id, reference: updated.reference, status: updated.status, state: invoiceState(updated), paymentReference: payment.reference };
  }
}
