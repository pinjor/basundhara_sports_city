import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { Role } from "@bsc/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { HrmReportsService } from "./hrm-reports.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HR_MANAGER)
@Controller("hrm/reports")
export class HrmReportsController {
  constructor(private readonly reports: HrmReportsService) {}

  @Get("headcount")
  headcount() {
    return this.reports.headcount();
  }

  @Get("analytics")
  analytics() {
    return this.reports.analytics();
  }

  @Get("on-duty")
  onDuty() {
    return this.reports.onDuty();
  }

  @Get("attendance")
  attendance() {
    return this.reports.attendance();
  }

  @Get("leave-balances")
  leaveBalances() {
    return this.reports.leaveBalances();
  }

  @Get("skill-match")
  skillMatch(@Query() query: Record<string, unknown>) {
    return this.reports.skillMatch(query);
  }
}
