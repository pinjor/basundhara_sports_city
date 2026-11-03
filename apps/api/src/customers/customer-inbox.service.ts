import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const INBOX_SIZE = 50;

/** Messages in the customer app inbox. */
@Injectable()
export class CustomerInboxService {
  constructor(private readonly prisma: PrismaService) {}

  notify(customerId: string, title: string, body: string, tx: Prisma.TransactionClient = this.prisma) {
    return tx.customerNotification.create({ data: { customerId, title, body } });
  }

  async list(customerId: string) {
    const rows = await this.prisma.customerNotification.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: INBOX_SIZE,
    });
    return rows.map((row) => ({ id: row.id, title: row.title, body: row.body, read: row.readAt !== null, createdAt: row.createdAt }));
  }

  async readAll(customerId: string) {
    const { count } = await this.prisma.customerNotification.updateMany({
      where: { customerId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: count };
  }
}
