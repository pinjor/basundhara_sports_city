import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { Role } from "@bsc/shared";
import { CurrentUser, type RequestUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { EventApprovalDto } from "./events.dto";
import { EventsService } from "./events.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("events")
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list() {
    return this.events.list();
  }

  @Get(":id")
  getBoard(@Param("id") id: string) {
    return this.events.getBoard(id);
  }

  @Roles(Role.CHAIRMAN)
  @Post(":id/approval")
  decide(@Param("id", ParseUUIDPipe) id: string, @Body() body: EventApprovalDto, @CurrentUser() user: RequestUser) {
    return this.events.decide(id, body.decision, user);
  }
}
