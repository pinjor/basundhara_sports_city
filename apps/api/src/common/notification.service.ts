import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface NewNotification {
  title: string;
  body: string;
  href?: string;
  /** Role the message is for. Omit to notify everyone. */
  role?: string;
}

/** Raises in-app notifications. Pass the open transaction so the message rolls back with the change. */
@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  notify(message: NewNotification, tx: Prisma.TransactionClient = this.prisma) {
    return tx.notification.create({ data: { title: message.title, body: message.body, href: message.href ?? null, role: message.role ?? null } });
  }
}
