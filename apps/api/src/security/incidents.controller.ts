import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Role } from "@bsc/shared";
import { CurrentUser, type RequestUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateIncidentDto, IncidentStatusDto, UpdateIncidentDto } from "./incidents.dto";
import { IncidentsService } from "./incidents.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SECURITY_MANAGER, Role.GATE_SECURITY_OFFICER)
@Controller("security/incidents")
export class IncidentsController {
  constructor(private readonly incidents: IncidentsService) {}

  @Get()
  list(@Query("status") status?: string) {
    return this.incidents.list(status);
  }

  @Post()
  create(@Body() body: CreateIncidentDto, @CurrentUser() user: RequestUser) {
    return this.incidents.create(body, user);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() body: UpdateIncidentDto, @CurrentUser() user: RequestUser) {
    return this.incidents.update(id, body, user);
  }

  @Post(":id/status")
  setStatus(@Param("id", ParseUUIDPipe) id: string, @Body() body: IncidentStatusDto, @CurrentUser() user: RequestUser) {
    return this.incidents.setStatus(id, body.status, user);
  }
}
