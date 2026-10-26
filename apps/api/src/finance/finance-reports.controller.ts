import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { Role } from "@bsc/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { FinanceReportsService } from "./finance-reports.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FINANCE_CONTROLLER)
@Controller("finance/reports")
export class FinanceReportsController {
  constructor(private readonly reports: FinanceReportsService) {}

  @Get("statements")
  statements(@Query() query: Record<string, unknown>) {
    return this.reports.statements(query);
  }

  @Get("receivable-aging")
  receivableAging() {
    return this.reports.aging("RECEIVABLE");
  }

  @Get("payable-aging")
  payableAging() {
    return this.reports.aging("PAYABLE");
  }

  @Get("tax-summary")
  taxSummary(@Query() query: Record<string, unknown>) {
    return this.reports.taxSummary(query);
  }

  @Get("profitability")
  profitability(@Query() query: Record<string, unknown>) {
    return this.reports.profitability(query);
  }
}
