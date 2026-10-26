import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentCustomer, CustomerAuthGuard, type RequestCustomer } from "../auth/customer-jwt.strategy";
import { UserAgent } from "../auth/user-agent.decorator";
import { AUTH_THROTTLE } from "../common/throttle";
import { Idempotency, replay, type IdempotencyHandle } from "../ticketing/idempotency";
import { CustomersService } from "./customers.service";
import { CustomerTicketsService } from "./customer-tickets.service";
import { CustomerBookingsService } from "./customer-bookings.service";
import {
  ChangePasswordDto,
  CustomerBookingDto,
  CustomerCancelOrderDto,
  CustomerPayDto,
  CustomerTicketOrderDto,
  UpdateCustomerDto,
} from "./dto/customer.dto";

@ApiTags("Customer account")
@ApiBearerAuth()
@UseGuards(CustomerAuthGuard)
@Controller("customer/me")
export class CustomerAccountController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  profile(@CurrentCustomer() customer: RequestCustomer) {
    return this.customers.profile(customer.id);
  }

  @Patch()
  update(@CurrentCustomer() customer: RequestCustomer, @Body() dto: UpdateCustomerDto) {
    return this.customers.update(customer.id, dto);
  }

  /** Signs out every other device and returns a fresh session for this one. */
  @Throttle(AUTH_THROTTLE)
  @Post("password")
  changePassword(@CurrentCustomer() customer: RequestCustomer, @Body() dto: ChangePasswordDto, @UserAgent() userAgent?: string) {
    return this.customers.changePassword(customer.id, dto, userAgent);
  }

  @Get("membership")
  membership(@CurrentCustomer() customer: RequestCustomer) {
    return this.customers.membership(customer.id);
  }
}

/** Ticket orders placed while signed in. Seat maps and event lists stay on the public /ticketing routes. */
@ApiTags("Customer tickets")
@ApiBearerAuth()
@UseGuards(CustomerAuthGuard)
@Controller("customer/orders")
export class CustomerOrdersController {
  constructor(private readonly tickets: CustomerTicketsService) {}

  @Get()
  list(@CurrentCustomer() customer: RequestCustomer) {
    return this.tickets.list(customer.id);
  }

  /** Requires an `Idempotency-Key` header. */
  @Post()
  async create(@CurrentCustomer() customer: RequestCustomer, @Body() dto: CustomerTicketOrderDto, @Idempotency() idem: IdempotencyHandle) {
    return replay(idem, await this.tickets.create(customer, dto, idem.key));
  }

  @Get(":reference")
  get(@CurrentCustomer() customer: RequestCustomer, @Param("reference") reference: string) {
    return this.tickets.get(customer.id, reference);
  }

  /** Requires an `Idempotency-Key` header. */
  @Post(":reference/pay")
  async pay(
    @CurrentCustomer() customer: RequestCustomer,
    @Param("reference") reference: string,
    @Body() dto: CustomerPayDto,
    @Idempotency() idem: IdempotencyHandle,
  ) {
    return replay(idem, await this.tickets.pay(customer.id, reference, dto, idem.key));
  }

  /** Requires an `Idempotency-Key` header. */
  @Post(":reference/cancel-request")
  async cancel(
    @CurrentCustomer() customer: RequestCustomer,
    @Param("reference") reference: string,
    @Body() dto: CustomerCancelOrderDto,
    @Idempotency() idem: IdempotencyHandle,
  ) {
    return replay(idem, await this.tickets.cancel(customer.id, reference, dto, idem.key));
  }
}

@ApiTags("Customer bookings")
@Controller("customer")
export class CustomerBookingsController {
  constructor(private readonly bookings: CustomerBookingsService) {}

  /** Public: facilities that can be booked from the app. */
  @Get("facilities")
  facilities() {
    return this.bookings.facilities();
  }

  /** Public: slots for one day (`date=YYYY-MM-DD`) with price and availability. */
  @Get("facilities/:id/slots")
  slots(@Param("id") id: string, @Query("date") date: string) {
    return this.bookings.slots(id, date);
  }

  @ApiBearerAuth()
  @UseGuards(CustomerAuthGuard)
  @Get("bookings")
  list(@CurrentCustomer() customer: RequestCustomer) {
    return this.bookings.list(customer.id);
  }

  @ApiBearerAuth()
  @UseGuards(CustomerAuthGuard)
  @Post("bookings")
  request(@CurrentCustomer() customer: RequestCustomer, @Body() dto: CustomerBookingDto) {
    return this.bookings.request(customer, dto);
  }

  @ApiBearerAuth()
  @UseGuards(CustomerAuthGuard)
  @Get("bookings/:id")
  get(@CurrentCustomer() customer: RequestCustomer, @Param("id") id: string) {
    return this.bookings.get(customer.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(CustomerAuthGuard)
  @Post("bookings/:id/cancel")
  cancel(@CurrentCustomer() customer: RequestCustomer, @Param("id") id: string) {
    return this.bookings.cancel(customer.id, id);
  }
}
