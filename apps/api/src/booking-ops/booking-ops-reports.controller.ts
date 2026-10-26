import { Controller, Get, UseGuards } from "@nestjs/common";
import { Role } from "@bsc/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { BookingOpsReportsService } from "./booking-ops-reports.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.BOOKINGS_OFFICER)
@Controller("booking-ops/reports")
export class BookingOpsReportsController {
  constructor(private readonly reports: BookingOpsReportsService) {}

  @Get("price-check")
  priceCheck() {
    return this.reports.priceCheck();
  }
}
