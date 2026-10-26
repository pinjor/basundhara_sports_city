import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { CurrentUser, type RequestUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { NotificationsService } from "./notifications.service";

/** Every signed-in user manages their own read state, so no role restriction applies. */
@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.notifications.list(user);
  }

  @Get("unread-count")
  unreadCount(@CurrentUser() user: RequestUser) {
    return this.notifications.unreadCount(user);
  }

  @Post("read-all")
  markAllRead(@CurrentUser() user: RequestUser) {
    return this.notifications.markAllRead(user);
  }

  @Post(":id/read")
  markRead(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    return this.notifications.markRead(id, user);
  }
}
