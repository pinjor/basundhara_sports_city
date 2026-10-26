import { Module } from "@nestjs/common";
import { BookingDashboard } from "./booking.dashboard";
import { ChairmanDashboard } from "./chairman.dashboard";
import { DashboardsController } from "./dashboards.controller";
import { HrDashboard } from "./hr.dashboard";
import { RevenueDashboard } from "./revenue.dashboard";
import { SecurityDashboard } from "./security.dashboard";

@Module({
  controllers: [DashboardsController],
  providers: [RevenueDashboard, HrDashboard, BookingDashboard, SecurityDashboard, ChairmanDashboard],
})
export class DashboardsModule {}
