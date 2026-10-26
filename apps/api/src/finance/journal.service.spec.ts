import type { Prisma } from "@prisma/client";
import type { ReferenceService } from "../common/reference.service";
import { JournalService } from "./journal.service";

function fakeTx() {
  const created: { data: { lines: { create: { accountId: string; debitBdt: unknown; creditBdt: unknown }[] } } }[] = [];
  const tx = {
    account: { findMany: jest.fn(async () => [{ id: "cash", code: "1000" }, { id: "ar", code: "1100" }]) },
    journalEntry: { create: jest.fn(async (args: (typeof created)[number]) => (created.push(args), { id: "je" })) },
  };
  return { tx: tx as unknown as Prisma.TransactionClient, created };
}

describe("JournalService", () => {
  const references = { next: jest.fn(async () => "JE-2026-0001") } as unknown as ReferenceService;
  const journal = new JournalService(references);
  const base = { date: new Date("2026-01-01"), memo: "test", sourceType: "payment", sourceId: "p1" };

  it("writes balanced entries and drops zero lines", async () => {
    const { tx, created } = fakeTx();
    await journal.post(tx, {
      ...base,
      lines: [
        { account: { code: "1000" }, debit: 100 },
        { account: { code: "1100" }, credit: 100 },
        { account: { id: "vat" }, credit: 0 },
      ],
    });
    expect(created).toHaveLength(1);
    expect(created[0]!.data.lines.create.map((line) => line.accountId)).toEqual(["cash", "ar"]);
  });

  it("rejects unbalanced postings", async () => {
    const { tx } = fakeTx();
    await expect(
      journal.post(tx, { ...base, lines: [{ account: { code: "1000" }, debit: 100 }, { account: { code: "1100" }, credit: 90 }] }),
    ).rejects.toThrow("Unbalanced journal");
  });

  it("refuses codes missing from the chart", async () => {
    const { tx } = fakeTx();
    await expect(
      journal.post(tx, { ...base, lines: [{ account: { code: "1000" }, debit: 5 }, { account: { code: "9999" }, credit: 5 }] }),
    ).rejects.toThrow("missing 9999");
  });
});
