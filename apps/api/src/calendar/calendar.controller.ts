import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { Role } from "@bsc/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CalendarService } from "./calendar.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.BOOKINGS_OFFICER, Role.TICKET_ADMINISTRATOR, Role.HR_MANAGER, Role.SECURITY_MANAGER, Role.VENUE_FACILITY_MANAGER)
@Controller("calendar")
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get()
  items(@Query("from") from?: string, @Query("to") to?: string) {
    return this.calendar.items(from, to);
  }
}
