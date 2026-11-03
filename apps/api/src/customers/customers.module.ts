import { Module } from "@nestjs/common";
import { BookingsModule } from "../bookings/bookings.module";
import { TicketingModule } from "../ticketing/ticketing.module";
import { CustomerAuthController } from "./customer-auth.controller";
import { CustomerAccountController, CustomerBookingsController, CustomerOrdersController } from "./customer-app.controller";
import { CustomerCatalogController, CustomerServicesController } from "./customer-services.controller";
import { CustomersService } from "./customers.service";
import { CustomerTicketsService } from "./customer-tickets.service";
import { CustomerAccessService } from "./customer-access.service";
import { CustomerBookingsService } from "./customer-bookings.service";
import { CustomerCatalogService } from "./customer-catalog.service";
import { CustomerInboxService } from "./customer-inbox.service";
import { CustomerMembershipService } from "./customer-membership.service";
import { CustomerServicesService } from "./customer-services.service";

/** Public mobile app: accounts, bookings, tickets, membership and on-site services for customers. */
@Module({
  imports: [BookingsModule, TicketingModule],
  providers: [
    CustomersService,
    CustomerAccessService,
    CustomerTicketsService,
    CustomerBookingsService,
    CustomerCatalogService,
    CustomerInboxService,
    CustomerMembershipService,
    CustomerServicesService,
  ],
  controllers: [
    CustomerAuthController,
    CustomerAccountController,
    CustomerOrdersController,
    CustomerBookingsController,
    CustomerCatalogController,
    CustomerServicesController,
  ],
})
export class CustomersModule {}
