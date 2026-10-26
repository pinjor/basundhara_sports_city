import { BadRequestException, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { ReferenceService } from "../common/reference.service";
import { decimal, money } from "../common/resource/resource-mapper";
import { round2 } from "./ledger";

export interface PostingLine {
  /** Chart code, or a concrete account id when the document picked one. */
  account: { code: string } | { id: string };
  debit?: number;
  credit?: number;
}

export interface Posting {
  date: Date;
  memo: string;
  sourceType: string;
  sourceId: string;
  lines: PostingLine[];
}

@Injectable()
export class JournalService {
  constructor(private readonly references: ReferenceService) {}

  private async resolve(tx: Prisma.TransactionClient, lines: PostingLine[]): Promise<Map<string, string>> {
    const codes = [...new Set(lines.flatMap((line) => ("code" in line.account ? [line.account.code] : [])))];
    const accounts = codes.length ? await tx.account.findMany({ where: { code: { in: codes } }, select: { id: true, code: true } }) : [];
    const byCode = new Map(accounts.map((account) => [account.code, account.id]));
    const missing = codes.filter((code) => !byCode.has(code));
    if (missing.length) throw new BadRequestException(`Chart of accounts is missing ${missing.join(", ")}`);
    return byCode;
  }

  /** Writes one balanced entry. Zero lines are dropped; an unbalanced posting is a programming error. */
  async post(tx: Prisma.TransactionClient, posting: Posting) {
    const lines = posting.lines
      .map((line) => ({ ...line, debit: round2(line.debit ?? 0), credit: round2(line.credit ?? 0) }))
      .filter((line) => line.debit !== 0 || line.credit !== 0);
    const debits = round2(lines.reduce((sum, line) => sum + line.debit, 0));
    const credits = round2(lines.reduce((sum, line) => sum + line.credit, 0));
    if (debits !== credits) throw new Error(`Unbalanced journal for ${posting.sourceType} ${posting.sourceId}: ${debits} != ${credits}`);
    if (debits === 0) return null;
    const byCode = await this.resolve(tx, lines);
    return tx.journalEntry.create({
      data: {
        reference: await this.references.next("JE", tx),
        date: posting.date,
        memo: posting.memo,
        sourceType: posting.sourceType,
        sourceId: posting.sourceId,
        lines: {
          create: lines.map((line) => ({
            accountId: "id" in line.account ? line.account.id : byCode.get(line.account.code)!,
            debitBdt: decimal(line.debit),
            creditBdt: decimal(line.credit),
          })),
        },
      },
    });
  }

  /** Mirrors every not-yet-reversed entry a document produced. */
  async reverse(tx: Prisma.TransactionClient, sourceType: string, sourceId: string, memo: string) {
    const entries = await tx.journalEntry.findMany({ where: { sourceType, sourceId, reversalOf: null }, include: { lines: true } });
    const reversed = new Set(
      (await tx.journalEntry.findMany({ where: { reversalOf: { in: entries.map((entry) => entry.id) } }, select: { reversalOf: true } })).map(
        (entry) => entry.reversalOf,
      ),
    );
    for (const entry of entries.filter((candidate) => !reversed.has(candidate.id))) {
      await tx.journalEntry.create({
        data: {
          reference: await this.references.next("JE", tx),
          date: new Date(),
          memo: `${memo} (reverses ${entry.reference})`,
          sourceType,
          sourceId,
          reversalOf: entry.id,
          lines: {
            create: entry.lines.map((line) => ({ accountId: line.accountId, debitBdt: decimal(money(line.creditBdt)), creditBdt: decimal(money(line.debitBdt)) })),
          },
        },
      });
    }
  }
}
