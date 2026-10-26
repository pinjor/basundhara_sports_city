import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { AuditModule } from "./audit/audit.module";
import { CommonModule } from "./common/common.module";
import { AuthModule } from "./auth/auth.module";
import { ZonesModule } from "./zones/zones.module";
import { FacilitiesModule } from "./facilities/facilities.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { BookingsModule } from "./bookings/bookings.module";
import { MembersModule } from "./members/members.module";
import { GatesModule } from "./gates/gates.module";
import { VisitorsModule } from "./visitors/visitors.module";
import { VipGuestsModule } from "./vip-guests/vip-guests.module";
import { LoungesModule } from "./lounges/lounges.module";
import { OutletsModule } from "./outlets/outlets.module";
import { ParkingModule } from "./parking/parking.module";
import { FleetModule } from "./fleet/fleet.module";
import { SurfacesModule } from "./surfaces/surfaces.module";
import { EventsModule } from "./events/events.module";
import { OperationsModule } from "./operations/operations.module";
import { TicketingModule } from "./ticketing/ticketing.module";
import { FinanceModule } from "./finance/finance.module";
import { InventoryModule } from "./inventory/inventory.module";
import { ProcurementModule } from "./procurement/procurement.module";
import { HrmModule } from "./hrm/hrm.module";
import { BookingOpsModule } from "./booking-ops/booking-ops.module";
import { TicketSetupModule } from "./ticket-setup/ticket-setup.module";
import { SecurityModule } from "./security/security.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { SettingsModule } from "./settings/settings.module";
import { ProjectsModule } from "./projects/projects.module";
import { CalendarModule } from "./calendar/calendar.module";
import { DashboardsModule } from "./dashboards/dashboards.module";
import { CustomersModule } from "./customers/customers.module";
import { HealthController } from "./health/health.controller";
import { AssetUrlInterceptor } from "./common/asset-url.interceptor";
import { DEFAULT_THROTTLE } from "./common/throttle";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([DEFAULT_THROTTLE]),
    PrismaModule,
    AuditModule,
    CommonModule,
    AuthModule,
    ZonesModule,
    FacilitiesModule,
    EventsModule,
    OperationsModule,
    BookingsModule,
    MembersModule,
    GatesModule,
    VisitorsModule,
    VipGuestsModule,
    LoungesModule,
    OutletsModule,
    ParkingModule,
    FleetModule,
    SurfacesModule,
    DashboardModule,
    TicketingModule,
    FinanceModule,
    InventoryModule,
    ProcurementModule,
    HrmModule,
    BookingOpsModule,
    TicketSetupModule,
    SecurityModule,
    NotificationsModule,
    SettingsModule,
    ProjectsModule,
    CalendarModule,
    DashboardsModule,
    CustomersModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AssetUrlInterceptor },
  ],
})
export class AppModule {}
