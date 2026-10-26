import { Controller, Get, UseGuards } from "@nestjs/common";
import { Role } from "@bsc/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { InventoryReportsService } from "./inventory-reports.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FINANCE_CONTROLLER)
@Controller("inventory/reports")
export class InventoryReportsController {
  constructor(private readonly reports: InventoryReportsService) {}

  @Get("reorder")
  reorder() {
    return this.reports.reorder();
  }

  @Get("forecast")
  forecast() {
    return this.reports.forecast();
  }

  @Get("summary")
  summary() {
    return this.reports.summary();
  }

  @Get("expiry")
  expiry() {
    return this.reports.expiry();
  }
}
