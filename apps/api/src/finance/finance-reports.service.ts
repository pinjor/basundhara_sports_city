import { BadRequestException, Injectable } from "@nestjs/common";
import type { ReportResult } from "@bsc/shared";
import { col, daysBetween, monthKey, percent, queryRange, report, startOfToday, sum, type ReportRow } from "../common/report";
import { isoDay, money } from "../common/resource/resource-mapper";
import { PrismaService } from "../prisma/prisma.service";
import { STREAM_ACCOUNT } from "./ledger";

interface Balance {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
}

const AGING_BUCKETS = ["Current", "1-30 days", "31-60 days", "61-90 days", "90+ days"] as const;

function bucketOf(daysOverdue: number): (typeof AGING_BUCKETS)[number] {
  if (daysOverdue <= 0) return "Current";
  if (daysOverdue <= 30) return "1-30 days";
  if (daysOverdue <= 60) return "31-60 days";
  if (daysOverdue <= 90) return "61-90 days";
  return "90+ days";
}

/** Natural balance: debit-normal for assets and expenses, credit-normal otherwise. */
const natural = (balance: Balance) => (balance.type === "Asset" || balance.type === "Expense" ? balance.debit - balance.credit : balance.credit - balance.debit);

@Injectable()
export class FinanceReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private async balances(query: Record<string, unknown>): Promise<Balance[]> {
    const range = queryRange(query);
    const grouped = await this.prisma.journalLine.groupBy({
      by: ["accountId"],
      where: range ? { entry: { date: range } } : undefined,
      _sum: { debitBdt: true, creditBdt: true },
    });
    const accounts = await this.prisma.account.findMany({ orderBy: { code: "asc" } });
    const sums = new Map(grouped.map((group) => [group.accountId, group._sum]));
    return accounts.map((account) => ({
      code: account.code,
      name: account.name,
      type: account.type,
      debit: money(sums.get(account.id)?.debitBdt),
      credit: money(sums.get(account.id)?.creditBdt),
    }));
  }

  async statements(query: Record<string, unknown>): Promise<ReportResult> {
    const type = typeof query.type === "string" ? query.type : "trial-balance";
    if (type === "journal") return this.journal(query);
    const balances = (await this.balances(query)).filter((balance) => balance.debit || balance.credit);
    if (type === "trial-balance") {
      return report(
        "Trial balance",
        [col("code", "Code"), col("account", "Account"), col("type", "Type"), col("debit", "Debit", "money"), col("credit", "Credit", "money")],
        balances.map((balance) => ({ code: balance.code, account: balance.name, type: balance.type, debit: balance.debit, credit: balance.credit })),
        [
          { label: "Total debit", value: sum(balances, (balance) => balance.debit), kind: "money" },
          { label: "Total credit", value: sum(balances, (balance) => balance.credit), kind: "money" },
        ],
      );
    }
    const income = balances.filter((balance) => balance.type === "Income");
    const expense = balances.filter((balance) => balance.type === "Expense");
    const surplus = sum(income, natural) - sum(expense, natural);
    const line = (section: string) => (balance: Balance) => ({ section, code: balance.code, account: balance.name, amount: natural(balance) });
    const columns = [col("section", "Section"), col("code", "Code"), col("account", "Account"), col("amount", "Amount", "money")];
    if (type === "profit-loss") {
      return report("Profit and loss", columns, [...income.map(line("Income")), ...expense.map(line("Expense"))], [
        { label: "Income", value: sum(income, natural), kind: "money" },
        { label: "Expenses", value: sum(expense, natural), kind: "money" },
        { label: "Net surplus", value: surplus, kind: "money" },
      ]);
    }
    if (type === "balance-sheet") {
      const assets = balances.filter((balance) => balance.type === "Asset");
      const liabilities = balances.filter((balance) => balance.type === "Liability");
      const equity = balances.filter((balance) => balance.type === "Equity");
      const rows: ReportRow[] = [
        ...assets.map(line("Assets")),
        ...liabilities.map(line("Liabilities")),
        ...equity.map(line("Equity")),
        { section: "Equity", code: "", account: "Current period surplus", amount: surplus },
      ];
      return report("Balance sheet", columns, rows, [
        { label: "Assets", value: sum(assets, natural), kind: "money" },
        { label: "Liabilities + equity", value: sum(liabilities, natural) + sum(equity, natural) + surplus, kind: "money" },
      ]);
    }
    throw new BadRequestException(`Unknown statement "${type}"`);
  }

  private async journal(query: Record<string, unknown>): Promise<ReportResult> {
    const range = queryRange(query);
    const lines = await this.prisma.journalLine.findMany({
      where: range ? { entry: { date: range } } : undefined,
      include: { entry: true, account: true },
      orderBy: [{ entry: { date: "desc" } }, { entry: { reference: "desc" } }],
      take: 300,
    });
    return report(
      "Journal",
      [col("date", "Date", "date"), col("entry", "Entry"), col("memo", "Memo"), col("account", "Account"), col("debit", "Debit", "money"), col("credit", "Credit", "money")],
      lines.map((line) => ({
        date: isoDay(line.entry.date),
        entry: line.entry.reference,
        memo: line.entry.memo,
        account: `${line.account.code} ${line.account.name}`,
        debit: money(line.debitBdt),
        credit: money(line.creditBdt),
      })),
    );
  }

  async aging(kind: "RECEIVABLE" | "PAYABLE"): Promise<ReportResult> {
    const today = startOfToday();
    const invoices = await this.prisma.invoice.findMany({ where: { kind, status: "ISSUED" }, orderBy: { dueOn: "asc" } });
    const rows = invoices.map((invoice) => {
      const overdue = daysBetween(invoice.dueOn, today);
      return {
        reference: invoice.reference,
        party: invoice.party,
        dueOn: isoDay(invoice.dueOn),
        daysOverdue: Math.max(0, overdue),
        bucket: bucketOf(overdue),
        outstanding: money(invoice.totalBdt) - money(invoice.paidBdt),
      };
    });
    return report(
      kind === "RECEIVABLE" ? "Receivable aging" : "Payable aging",
      [
        col("reference", "Invoice"),
        col("party", kind === "RECEIVABLE" ? "Customer" : "Vendor"),
        col("dueOn", "Due", "date"),
        col("daysOverdue", "Days overdue", "number"),
        col("bucket", "Bucket"),
        col("outstanding", "Outstanding", "money"),
      ],
      rows,
      [
        ...AGING_BUCKETS.map((bucket) => ({ label: bucket, value: sum(rows.filter((row) => row.bucket === bucket), (row) => row.outstanding), kind: "money" as const })),
        { label: "Total outstanding", value: sum(rows, (row) => row.outstanding), kind: "money" },
      ],
    );
  }

  async taxSummary(query: Record<string, unknown>): Promise<ReportResult> {
    const range = queryRange(query);
    const [rates, invoices] = await Promise.all([
      this.prisma.taxRate.findMany({ orderBy: { name: "asc" } }),
      this.prisma.invoice.findMany({ where: { status: { in: ["ISSUED", "PAID"] }, taxRateId: { not: null }, ...(range ? { issuedOn: range } : {}) } }),
    ]);
    const rows = rates.map((rate) => {
      const mine = invoices.filter((invoice) => invoice.taxRateId === rate.id);
      const sales = mine.filter((invoice) => invoice.kind === "RECEIVABLE");
      const purchases = mine.filter((invoice) => invoice.kind === "PAYABLE");
      const output = sum(sales, (invoice) => money(invoice.taxBdt));
      const input = sum(purchases, (invoice) => money(invoice.taxBdt));
      return {
        tax: rate.name,
        rate: money(rate.ratePercent),
        sales: sum(sales, (invoice) => money(invoice.subtotalBdt)),
        output,
        purchases: sum(purchases, (invoice) => money(invoice.subtotalBdt)),
        input,
        net: output - input,
      };
    });
    return report(
      "Tax summary",
      [
        col("tax", "Tax"),
        col("rate", "Rate", "percent"),
        col("sales", "Taxable sales", "money"),
        col("output", "Output tax", "money"),
        col("purchases", "Taxable purchases", "money"),
        col("input", "Input tax", "money"),
        col("net", "Net payable", "money"),
      ],
      rows,
      [
        { label: "Output tax", value: sum(rows, (row) => row.output), kind: "money" },
        { label: "Input tax", value: sum(rows, (row) => row.input), kind: "money" },
        { label: "Net payable", value: sum(rows, (row) => row.net), kind: "money" },
      ],
    );
  }

  async profitability(query: Record<string, unknown>): Promise<ReportResult> {
    const by = query.by === "month" ? "month" : "stream";
    const range = queryRange(query);
    const lines = await this.prisma.journalLine.findMany({
      where: { account: { type: { in: ["Income", "Expense"] } }, ...(range ? { entry: { date: range } } : {}) },
      include: { account: true, entry: { select: { date: true } } },
    });
    const isIncome = (line: (typeof lines)[number]) => line.account.type === "Income";
    const amount = (line: (typeof lines)[number]) => (isIncome(line) ? money(line.creditBdt) - money(line.debitBdt) : money(line.debitBdt) - money(line.creditBdt));
    const revenue = sum(lines.filter(isIncome), amount);
    const cost = sum(
      lines.filter((line) => !isIncome(line)),
      amount,
    );

    if (by === "month") {
      const months = [...new Set(lines.map((line) => monthKey(line.entry.date)))].sort();
      const rows = months.map((month) => {
        const mine = lines.filter((line) => monthKey(line.entry.date) === month);
        const monthRevenue = sum(mine.filter(isIncome), amount);
        const monthCost = sum(
          mine.filter((line) => !isIncome(line)),
          amount,
        );
        return { month, revenue: monthRevenue, cost: monthCost, surplus: monthRevenue - monthCost, margin: percent(monthRevenue - monthCost, monthRevenue) };
      });
      return report(
        "Profitability by month",
        [col("month", "Month"), col("revenue", "Revenue", "money"), col("cost", "Cost", "money"), col("surplus", "Surplus", "money"), col("margin", "Margin", "percent")],
        rows,
        [
          { label: "Revenue", value: revenue, kind: "money" },
          { label: "Cost", value: cost, kind: "money" },
          { label: "Margin", value: percent(revenue - cost, revenue), kind: "percent" },
        ],
      );
    }

    const streams = Object.entries(STREAM_ACCOUNT);
    const rows = streams.map(([stream, code]) => {
      const streamRevenue = sum(
        lines.filter((line) => line.account.code === code),
        amount,
      );
      const allocated = revenue ? Math.round(cost * (streamRevenue / revenue) * 100) / 100 : 0;
      return {
        stream,
        revenue: streamRevenue,
        share: percent(streamRevenue, revenue),
        cost: allocated,
        surplus: streamRevenue - allocated,
        margin: percent(streamRevenue - allocated, streamRevenue),
      };
    });
    return report(
      "Profitability by stream",
      [
        col("stream", "Stream"),
        col("revenue", "Revenue", "money"),
        col("share", "Share", "percent"),
        col("cost", "Allocated cost", "money"),
        col("surplus", "Surplus", "money"),
        col("margin", "Margin", "percent"),
      ],
      rows,
      [
        { label: "Revenue", value: revenue, kind: "money" },
        { label: "Cost", value: cost, kind: "money" },
        { label: "Surplus", value: revenue - cost, kind: "money" },
      ],
    );
  }
}
