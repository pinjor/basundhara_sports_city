import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { RequestUser } from "../auth/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";

const LIST_SIZE = 30;

/** Notifications a user can see, with read state kept per user. */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private visibleTo(user: RequestUser): Prisma.NotificationWhereInput {
    return { OR: [{ role: null }, { role: user.role }] };
  }

  async list(user: RequestUser) {
    const rows = await this.prisma.notification.findMany({
      where: this.visibleTo(user),
      include: { reads: { where: { userId: user.id }, select: { readAt: true } } },
      orderBy: { createdAt: "desc" },
      take: LIST_SIZE,
    });
    return rows.map(({ reads, ...note }) => ({ ...note, read: reads.length > 0 }));
  }

  async unreadCount(user: RequestUser) {
    const count = await this.prisma.notification.count({ where: { ...this.visibleTo(user), reads: { none: { userId: user.id } } } });
    return { count };
  }

  async markRead(id: string, user: RequestUser) {
    const note = await this.prisma.notification.findFirst({ where: { id, ...this.visibleTo(user) } });
    if (!note) throw new NotFoundException("Notification not found");
    await this.prisma.notificationRead.upsert({
      where: { notificationId_userId: { notificationId: id, userId: user.id } },
      create: { notificationId: id, userId: user.id },
      update: {},
    });
    return { id, read: true };
  }

  async markAllRead(user: RequestUser) {
    const unread = await this.prisma.notification.findMany({
      where: { ...this.visibleTo(user), reads: { none: { userId: user.id } } },
      select: { id: true },
    });
    await this.prisma.notificationRead.createMany({
      data: unread.map((note) => ({ notificationId: note.id, userId: user.id })),
      skipDuplicates: true,
    });
    return { marked: unread.length };
  }
}
