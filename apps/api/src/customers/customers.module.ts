import { Module } from "@nestjs/common";
import { BookingsModule } from "../bookings/bookings.module";
import { TicketingModule } from "../ticketing/ticketing.module";
import { CustomerAuthController } from "./customer-auth.controller";
import { CustomerAccountController, CustomerBookingsController, CustomerOrdersController } from "./customer-app.controller";
import { CustomersService } from "./customers.service";
import { CustomerTicketsService } from "./customer-tickets.service";
import { CustomerBookingsService } from "./customer-bookings.service";

/** Public mobile app: customer sign-up, profile, ticket orders and facility booking requests. */
@Module({
  imports: [BookingsModule, TicketingModule],
  providers: [CustomersService, CustomerTicketsService, CustomerBookingsService],
  controllers: [CustomerAuthController, CustomerAccountController, CustomerOrdersController, CustomerBookingsController],
})
export class CustomersModule {}
