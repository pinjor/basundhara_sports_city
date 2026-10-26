import { Controller, Get, UseGuards } from "@nestjs/common";
import { Role } from "@bsc/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { TicketSetupReportsService } from "./ticket-setup-reports.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.BOOKINGS_OFFICER)
@Controller("ticketing/reports")
export class TicketSetupReportsController {
  constructor(private readonly reports: TicketSetupReportsService) {}

  @Get("catalogue")
  catalogue() {
    return this.reports.catalogue();
  }

  @Get("occupancy")
  occupancy() {
    return this.reports.occupancy();
  }
}
