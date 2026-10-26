import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { Role } from "@bsc/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { ProcurementReportsService } from "./procurement-reports.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FINANCE_CONTROLLER)
@Controller("procurement/reports")
export class ProcurementReportsController {
  constructor(private readonly reports: ProcurementReportsService) {}

  @Get("summary")
  summary(@Query() query: Record<string, unknown>) {
    return this.reports.summary(query);
  }

  @Get("cost-analysis")
  costAnalysis() {
    return this.reports.costAnalysis();
  }
}
