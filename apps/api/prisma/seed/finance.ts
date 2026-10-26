import { CHART_OF_ACCOUNTS } from "../../src/finance/ledger";
import type { Seeder } from "./app";
import { daysFromToday } from "./util";

const iso = (date: Date) => date.toISOString().slice(0, 10);
const CRORE = 10_000_000;

/** Monthly revenue profile (crore BDT) by calendar month, Jan..Dec. */
const MONTHLY_REVENUE = [3.1, 3.4, 3.8, 4.2, 4.9, 4.4, 5.0, 5.3, 4.6, 4.4, 5.1, 6.8];
/** Year-to-date targets the executive dashboards open on. */
const YTD_REVENUE = 42.8 * CRORE;
const YTD_COST = 18.6 * CRORE;

const STREAM_SPLIT = [
  { stream: "EVENT", share: 0.34, source: "Tournament and event bookings" },
  { stream: "MEMBERSHIP", share: 0.2, source: "Member dues and training programmes" },
  { stream: "RENTAL", share: 0.16, source: "Facility and retail space rental" },
  { stream: "SPONSORSHIP", share: 0.14, source: "Partner sponsorship instalments" },
  { stream: "TICKET", share: 0.1, source: "Box office settlements" },
  { stream: "OTHER", share: 0.06, source: "Food, beverage and merchandise" },
];

const COST_SPLIT = [
  { category: "Salaries", code: "5100", share: 0.5, payee: "Staff payroll" },
  { category: "Utilities", code: "5200", share: 0.14, payee: "DESCO and WASA" },
  { category: "Maintenance", code: "5300", share: 0.14, payee: "Green Turf Solutions" },
  { category: "Security", code: "5600", share: 0.1, payee: "SecureForce BD" },
  { category: "Marketing", code: "5500", share: 0.06, payee: "Adcomm Dhaka" },
  { category: "Procurement", code: "5400", share: 0.06, payee: "Dhaka Sports Supplies" },
];

interface Month {
  year: number;
  month: number;
  /** Posting day: the 25th, or earlier in the running month. */
  day: Date;
  currentYear: boolean;
}

function lastTwelveMonths(): Month[] {
  const today = daysFromToday(0);
  const months: Month[] = [];
  for (let back = 11; back >= 0; back--) {
    const first = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - back, 1));
    const day = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 25));
    months.push({
      year: first.getUTCFullYear(),
      month: first.getUTCMonth(),
      day: day > today ? new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), Math.max(1, today.getUTCDate() - 3))) : day,
      currentYear: first.getUTCFullYear() === today.getUTCFullYear(),
    });
  }
  return months;
}

const period = (month: Month) => `${month.year}-Q${Math.floor(month.month / 3) + 1}`;
const roundTo = (value: number, step = 1000) => Math.round(value / step) * step;

const RECEIVABLES = [
  { party: "ABC Events Ltd.", subtotal: 5_000_000, issued: -40, due: -25, code: "4100", paid: "full" },
  { party: "Fitness World", subtotal: 2_800_000, issued: -30, due: -15, code: "4500", paid: "partial" },
  { party: "Premier Sports", subtotal: 1_200_000, issued: -25, due: -10, code: "4300", paid: "full" },
  { party: "Urban Bites", subtotal: 950_000, issued: -45, due: -30, code: "4500", paid: "none" },
  { party: "Champions FC", subtotal: 3_500_000, issued: -12, due: 3, code: "4500", paid: "full" },
  { party: "Meghna Group", subtotal: 4_200_000, issued: -8, due: 22, code: "4400", paid: "none" },
] as const;

const PAYABLES = [
  { party: "Green Turf Solutions", subtotal: 1_850_000, issued: -35, due: -20, code: "5300", paid: true, status: "ISSUED" },
  { party: "PowerGrid Utilities", subtotal: 620_000, issued: -50, due: -35, code: "5200", paid: false, status: "ISSUED" },
  { party: "SecureForce BD", subtotal: 1_100_000, issued: -10, due: 20, code: "5600", paid: false, status: "ISSUED" },
  { party: "Dhaka Sports Supplies", subtotal: 480_000, issued: -2, due: 28, code: "5400", paid: false, status: "DRAFT" },
] as const;

export async function seedFinance(seeder: Seeder): Promise<void> {
  const { prisma } = seeder;
  const finance = await seeder.actor("finance@bsc.com.bd");

  if (await seeder.empty("account")) {
    for (const account of CHART_OF_ACCOUNTS) await seeder.record("account", finance, account);
  }
  const accounts = new Map((await prisma.account.findMany()).map((account) => [account.code, account.id]));
  const accountId = (code: string) => accounts.get(code)!;

  if (await seeder.empty("taxRate")) {
    await seeder.record("taxRate", finance, { name: "VAT 15%", ratePercent: 15, appliesTo: "Both" });
    await seeder.record("taxRate", finance, { name: "Reduced VAT 7.5%", ratePercent: 7.5, appliesTo: "Sales" });
    await seeder.record("taxRate", finance, { name: "Advance income tax 5%", ratePercent: 5, appliesTo: "Purchases" }, ["INACTIVE"]);
  }
  const vat = await prisma.taxRate.findFirstOrThrow({ where: { name: "VAT 15%" } });

  if (await seeder.empty("fund")) {
    await seeder.record("fund", finance, { name: "Capital works reserve", source: "Bashundhara Group", period: "FY2026", amountBdt: 120 * CRORE });
    await seeder.record("fund", finance, { name: "Youth development fund", source: "National Sports Council grant", period: "FY2026", amountBdt: 4.5 * CRORE });
    await seeder.record("fund", finance, { name: "Event contingency", source: "Operating surplus", period: "2026-Q4", amountBdt: 1.2 * CRORE }, ["FROZEN"]);
  }

  if (await seeder.empty("approvalRequest")) {
    const approval = (subject: string, requester: string, amountBdt: number, moves: string[] = []) =>
      seeder.record("approvalRequest", finance, { category: "FINANCIAL", subject, requester, approver: "Finance Controller", step: "Finance review", amountBdt }, moves);
    await approval("Floodlight upgrade advance", "Facilities", 3_400_000);
    await approval("Q4 marketing campaign", "Marketing", 1_250_000);
    await approval("Emergency pitch drainage repair", "Operations", 860_000, ["APPROVED"]);
    await approval("Hospitality suite refurbishment", "Hospitality", 5_600_000, ["REJECTED"]);
  }

  const months = lastTwelveMonths();
  const currentYear = months.filter((month) => month.currentYear);
  const priorMonths = months.filter((month) => !month.currentYear);

  if (await seeder.empty("revenueEntry")) {
    const invoiced = RECEIVABLES.reduce((sum, invoice) => sum + invoice.subtotal, 0);
    const profile = currentYear.reduce((sum, month) => sum + MONTHLY_REVENUE[month.month]!, 0);
    const scale = (YTD_REVENUE - invoiced) / (profile * CRORE);
    for (const month of months) {
      const total = MONTHLY_REVENUE[month.month]! * CRORE * (month.currentYear ? scale : 1);
      for (const split of STREAM_SPLIT) {
        await seeder.record(
          "revenueEntry",
          finance,
          { stream: split.stream, source: split.source, description: `${split.source} · ${iso(month.day).slice(0, 7)}`, period: period(month), receivedOn: iso(month.day), amountBdt: roundTo(total * split.share) },
          ["POSTED"],
        );
      }
    }
    await seeder.record("revenueEntry", finance, { stream: "SPONSORSHIP", source: "XYZ Group", description: "Sponsorship deal, first instalment", period: period(months.at(-1)!), receivedOn: iso(daysFromToday(0)), amountBdt: 1_500_000 });
    await seeder.record("revenueEntry", finance, { stream: "EVENT", source: "Corporate cup", description: "Venue hire balance", period: period(months.at(-1)!), receivedOn: iso(daysFromToday(-1)), amountBdt: 640_000 });
  }

  const postCosts = async (list: Month[], scale: number) => {
    for (const month of list) {
      for (const split of COST_SPLIT) {
        await seeder.record(
          "expense",
          finance,
          { payee: split.payee, category: split.category, accountId: accountId(split.code), spentOn: iso(month.day), amountBdt: roundTo((CRORE * 1.86 * scale * split.share)) },
          ["SUBMITTED", "APPROVED", "PAID"],
        );
      }
    }
  };

  if (await seeder.empty("expense")) {
    await postCosts(priorMonths, 1);
    if (await seeder.empty("budget")) {
      const budget = (name: string, department: string, code: string, crore: number) =>
        seeder.record("budget", finance, { name, department, period: "FY2026", accountId: accountId(code), amountBdt: crore * CRORE }, ["APPROVED"]);
      await budget("Payroll", "HR", "5100", 11.5);
      await budget("Utilities", "Facilities", "5200", 3.2);
      await budget("Maintenance", "Operations", "5300", 3.4);
      await budget("Security services", "Security", "5600", 2.4);
      await budget("Marketing", "Marketing", "5500", 1.4);
      await budget("Supplies and equipment", "Operations", "5400", 1.6);
      await seeder.record("budget", finance, { name: "IT systems refresh", department: "IT", period: "FY2027", amountBdt: 2.1 * CRORE });
    }
    const billed = PAYABLES.filter((bill) => bill.status === "ISSUED").reduce((sum, bill) => sum + bill.subtotal, 0);
    await postCosts(currentYear, (YTD_COST - billed) / (CRORE * 1.86 * currentYear.length));
    await seeder.record("expense", finance, { payee: "Rangs Electronics", category: "Maintenance", accountId: accountId("5300"), spentOn: iso(daysFromToday(-2)), amountBdt: 185_000 }, ["SUBMITTED"]);
    await seeder.record("expense", finance, { payee: "Pathao Courier", category: "Other", spentOn: iso(daysFromToday(0)), amountBdt: 12_500 });
  }

  if (await seeder.empty("invoice")) {
    for (const item of RECEIVABLES) {
      const invoice = await seeder.record(
        "invoice",
        finance,
        { kind: "RECEIVABLE", party: item.party, issuedOn: iso(daysFromToday(item.issued)), dueOn: iso(daysFromToday(item.due)), accountId: accountId(item.code), taxRateId: vat.id, subtotalBdt: item.subtotal },
        ["ISSUED"],
      );
      const total = Number(invoice.totalBdt);
      const amount = item.paid === "full" ? total : item.paid === "partial" ? roundTo(total * 0.5) : 0;
      if (amount) await seeder.record("payment", finance, { invoiceId: invoice.id, method: "Bank", paidOn: iso(daysFromToday(Math.min(item.due + 2, 0))), amountBdt: amount }, ["CLEARED"]);
    }
    for (const item of PAYABLES) {
      const bill = await seeder.record(
        "invoice",
        finance,
        { kind: "PAYABLE", party: item.party, issuedOn: iso(daysFromToday(item.issued)), dueOn: iso(daysFromToday(item.due)), accountId: accountId(item.code), taxRateId: vat.id, subtotalBdt: item.subtotal },
        item.status === "ISSUED" ? ["ISSUED"] : [],
      );
      if (item.paid) await seeder.record("payment", finance, { invoiceId: bill.id, method: "Bank", paidOn: iso(daysFromToday(item.due)), amountBdt: Number(bill.totalBdt) }, ["CLEARED"]);
    }
    const pending = await prisma.invoice.findFirstOrThrow({ where: { party: "Meghna Group" } });
    await seeder.record("payment", finance, { invoiceId: pending.id, method: "Bank", paidOn: iso(daysFromToday(0)), amountBdt: 1_000_000 });
  }
}
