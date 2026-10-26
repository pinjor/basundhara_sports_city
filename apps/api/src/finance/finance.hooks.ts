import { Injectable, type OnModuleInit } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { assertEditable, fail } from "../common/resource/guards";
import { ResourceHookRegistry } from "../common/resource/resource-hooks";
import { decimal, money, type Data, type Row } from "../common/resource/resource-mapper";
import { JournalService, type PostingLine } from "./journal.service";
import { EXPENSE_ACCOUNT, LEDGER, round2, STREAM_ACCOUNT } from "./ledger";

const account = (id: unknown, fallbackCode: string): PostingLine["account"] => (typeof id === "string" && id ? { id } : { code: fallbackCode });

/** Posting and settlement rules for finance documents. */
@Injectable()
export class FinanceHooks implements OnModuleInit {
  constructor(
    private readonly hooks: ResourceHookRegistry,
    private readonly journal: JournalService,
  ) {}

  onModuleInit() {
    this.hooks.register("account", {
      prepare: (data, _ctx, existing) => {
        if (existing && data.parentId === existing.id) fail("An account cannot be its own parent");
        return data;
      },
    });

    this.hooks.register("budget", { prepare: (data, _ctx, existing) => (assertEditable(existing, ["DRAFT"]), data) });

    this.hooks.register("approvalRequest", {
      prepare: (data, _ctx, existing) => (assertEditable(existing, ["PENDING"]), data),
      beforeTransition: (_row, _to, ctx) => ({ decidedBy: ctx.user.name, decidedAt: new Date() }),
    });

    this.hooks.register("revenueEntry", {
      prepare: (data, _ctx, existing) => (assertEditable(existing, ["DRAFT"]), data),
      afterTransition: async (row, _from, { tx }) => {
        if (row.status === "POSTED") {
          const amount = money(row.amountBdt);
          await this.journal.post(tx, {
            date: row.receivedOn as Date,
            memo: `Revenue ${row.reference} · ${row.source}`,
            sourceType: "revenueEntry",
            sourceId: row.id,
            lines: [
              { account: { code: LEDGER.CASH }, debit: amount },
              { account: { code: STREAM_ACCOUNT[String(row.stream)] ?? LEDGER.OTHER_INCOME }, credit: amount },
            ],
          });
        }
        if (row.status === "REVERSED") await this.journal.reverse(tx, "revenueEntry", row.id, `Revenue ${row.reference} reversed`);
      },
    });

    this.hooks.register("expense", {
      prepare: (data, _ctx, existing) => (assertEditable(existing, ["DRAFT"]), data),
      afterTransition: async (row, _from, { tx }) => {
        if (row.status !== "PAID") return;
        const amount = money(row.amountBdt);
        const target = account(row.accountId, EXPENSE_ACCOUNT[String(row.category)] ?? LEDGER.OTHER_EXPENSE);
        await this.journal.post(tx, {
          date: row.spentOn as Date,
          memo: `Expense ${row.reference} · ${row.payee}`,
          sourceType: "expense",
          sourceId: row.id,
          lines: [
            { account: target, debit: amount },
            { account: { code: LEDGER.CASH }, credit: amount },
          ],
        });
        await this.chargeBudgets(tx, target, amount);
      },
    });

    this.hooks.register("invoice", {
      prepare: async (data, { tx }, existing) => {
        assertEditable(existing, ["DRAFT"]);
        const merged = { ...existing, ...data } as Data;
        const issuedOn = merged.issuedOn as Date | undefined;
        const dueOn = merged.dueOn as Date | undefined;
        if (issuedOn && dueOn && dueOn < issuedOn) fail("Due date cannot be before the issue date");
        const taxRate = typeof merged.taxRateId === "string" ? await tx.taxRate.findUnique({ where: { id: merged.taxRateId } }) : null;
        const subtotal = money(merged.subtotalBdt);
        const tax = round2((subtotal * money(taxRate?.ratePercent)) / 100);
        return { ...data, taxBdt: decimal(tax), totalBdt: decimal(subtotal + tax) };
      },
      beforeTransition: (row, to) => {
        const paid = money(row.paidBdt);
        if (to === "VOID" && paid > 0) fail("Reverse the payments on this invoice before voiding it");
        if (to === "PAID" && paid < money(row.totalBdt)) fail("Record payments until the balance is zero");
      },
      afterTransition: async (row, from, { tx }) => {
        if (row.status === "ISSUED") await this.postInvoice(tx, row);
        if (row.status === "VOID" && from === "ISSUED") await this.journal.reverse(tx, "invoice", row.id, `Invoice ${row.reference} voided`);
      },
    });

    this.hooks.register("payment", {
      prepare: async (data, { tx }, existing) => {
        assertEditable(existing, ["PENDING"]);
        const invoiceId = (data.invoiceId ?? existing?.invoiceId) as string;
        const invoice = await this.openInvoice(tx, invoiceId, money(data.amountBdt ?? existing?.amountBdt));
        return { ...data, party: invoice.party, direction: invoice.kind === "RECEIVABLE" ? "IN" : "OUT" };
      },
      beforeTransition: async (row, to, { tx }) => {
        if (to === "CLEARED") await this.openInvoice(tx, row.invoiceId as string, money(row.amountBdt));
      },
      afterTransition: async (row, _from, { tx }) => {
        if (row.status === "CLEARED") await this.settle(tx, row, 1);
        if (row.status === "REVERSED") await this.settle(tx, row, -1);
      },
    });
  }

  private async openInvoice(tx: Prisma.TransactionClient, invoiceId: string, amount: number) {
    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) fail("Invoice not found");
    if (invoice.status !== "ISSUED") fail(`${invoice.reference} is ${invoice.status}; only issued invoices take payments`);
    const outstanding = round2(money(invoice.totalBdt) - money(invoice.paidBdt));
    if (amount > outstanding) fail(`Payment exceeds the ${outstanding.toLocaleString("en-US")} BDT still due on ${invoice.reference}`);
    return invoice;
  }

  private async postInvoice(tx: Prisma.TransactionClient, row: Row) {
    const subtotal = money(row.subtotalBdt);
    const tax = money(row.taxBdt);
    const total = money(row.totalBdt);
    const receivable = row.kind === "RECEIVABLE";
    await this.journal.post(tx, {
      date: row.issuedOn as Date,
      memo: `${receivable ? "Invoice" : "Bill"} ${row.reference} · ${row.party}`,
      sourceType: "invoice",
      sourceId: row.id,
      lines: receivable
        ? [
            { account: { code: LEDGER.RECEIVABLE }, debit: total },
            { account: account(row.accountId, LEDGER.OTHER_INCOME), credit: subtotal },
            { account: { code: LEDGER.VAT }, credit: tax },
          ]
        : [
            { account: account(row.accountId, LEDGER.PROCUREMENT), debit: subtotal },
            { account: { code: LEDGER.VAT }, debit: tax },
            { account: { code: LEDGER.PAYABLE }, credit: total },
          ],
    });
    if (!receivable) await this.chargeBudgets(tx, account(row.accountId, LEDGER.PROCUREMENT), subtotal);
  }

  /** Applies (sign 1) or unwinds (sign -1) a payment on its invoice and the ledger. */
  private async settle(tx: Prisma.TransactionClient, payment: Row, sign: 1 | -1) {
    const amount = money(payment.amountBdt);
    const incoming = payment.direction === "IN";
    if (sign === 1) {
      await this.journal.post(tx, {
        date: payment.paidOn as Date,
        memo: `Payment ${payment.reference} · ${payment.party}`,
        sourceType: "payment",
        sourceId: payment.id,
        lines: incoming
          ? [
              { account: { code: LEDGER.CASH }, debit: amount },
              { account: { code: LEDGER.RECEIVABLE }, credit: amount },
            ]
          : [
              { account: { code: LEDGER.PAYABLE }, debit: amount },
              { account: { code: LEDGER.CASH }, credit: amount },
            ],
      });
    } else {
      await this.journal.reverse(tx, "payment", payment.id, `Payment ${payment.reference} reversed`);
    }
    const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: payment.invoiceId as string } });
    const paid = round2(money(invoice.paidBdt) + sign * amount);
    const settled = paid >= money(invoice.totalBdt);
    const status = settled ? "PAID" : invoice.status === "PAID" ? "ISSUED" : invoice.status;
    await tx.invoice.update({ where: { id: invoice.id }, data: { paidBdt: decimal(paid), status } });
  }

  /** Adds spend to every approved budget on the charged account. */
  private async chargeBudgets(tx: Prisma.TransactionClient, target: PostingLine["account"], amount: number) {
    const accountId = "id" in target ? target.id : (await tx.account.findUnique({ where: { code: target.code }, select: { id: true } }))?.id;
    if (!accountId) return;
    await tx.budget.updateMany({ where: { accountId, status: "APPROVED" }, data: { spentBdt: { increment: decimal(amount) } } });
  }
}
