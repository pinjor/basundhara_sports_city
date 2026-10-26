import { Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { Role } from "@bsc/shared";
import { CurrentUser, type RequestUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { BookingDashboard } from "./booking.dashboard";
import { ChairmanDashboard } from "./chairman.dashboard";
import { HrDashboard } from "./hr.dashboard";
import { parseRange } from "./range";
import { RevenueDashboard } from "./revenue.dashboard";
import { SecurityDashboard } from "./security.dashboard";

/** One read endpoint per dashboard. The chairman and super admin read all of them. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("dashboards")
export class DashboardsController {
  constructor(
    private readonly revenue: RevenueDashboard,
    private readonly hr: HrDashboard,
    private readonly booking: BookingDashboard,
    private readonly security: SecurityDashboard,
    private readonly chairman: ChairmanDashboard,
  ) {}

  @Roles(Role.CHAIRMAN)
  @Get("chairman")
  chairmanView() {
    return this.chairman.get();
  }

  @Roles(Role.FINANCE_CONTROLLER)
  @Get("revenue")
  revenueView(@Query("range") range?: string) {
    return this.revenue.get(parseRange(range, "year"));
  }

  @Roles(Role.FINANCE_CONTROLLER)
  @Post("revenue/invoices/:id/settle")
  settle(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    return this.revenue.settle(id, user);
  }

  @Roles(Role.HR_MANAGER)
  @Get("hr")
  hrView(@Query("range") range?: string) {
    return this.hr.get(parseRange(range, "month"));
  }

  @Roles(Role.BOOKINGS_OFFICER)
  @Get("booking")
  bookingView(@Query("range") range?: string) {
    return this.booking.get(parseRange(range, "month"));
  }

  @Roles(Role.SECURITY_MANAGER)
  @Get("security")
  securityView(@Query("range") range?: string) {
    return this.security.get(parseRange(range, "today"));
  }
}
