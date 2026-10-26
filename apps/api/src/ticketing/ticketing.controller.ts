import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { Role } from "@bsc/shared";
import { CurrentUser, type RequestUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import {
  CancelTicketOrderDto,
  CreateMatchEventDto,
  CreateTicketOrderDto,
  DecideRefundDto,
  PayTicketOrderDto,
  SetSalesStatusDto,
  VerifyAccessDto,
} from "./dto/ticketing.dto";
import { TicketingService } from "./ticketing.service";
import { Idempotency, replay, type IdempotencyHandle } from "./idempotency";

@Controller("ticketing")
export class TicketingPublicController {
  constructor(private readonly ticketing: TicketingService) {}

  @Get("events")
  listEvents() {
    return this.ticketing.listEvents("public");
  }

  @Get("events/:id/seats")
  seats(@Param("id") id: string) {
    return this.ticketing.seatMap(id);
  }

  @Get("events/:id")
  event(@Param("id") id: string) {
    return this.ticketing.getEvent(id);
  }

  @Post("orders")
  async create(
    @Body() dto: CreateTicketOrderDto,
    @Idempotency() idem: IdempotencyHandle,
  ) {
    return replay(idem, await this.ticketing.createOrder(dto, idem.key));
  }

  @Get("orders/:reference")
  order(@Param("reference") reference: string, @Query("mobile") mobile?: string) {
    return this.ticketing.getOrder(reference, mobile, false);
  }

  @Post("orders/:reference/pay")
  async pay(
    @Param("reference") reference: string,
    @Body() dto: PayTicketOrderDto,
    @Idempotency() idem: IdempotencyHandle,
  ) {
    return replay(idem, await this.ticketing.pay(reference, dto, idem.key));
  }

  @Post("orders/:reference/cancel-request")
  async cancel(
    @Param("reference") reference: string,
    @Body() dto: CancelTicketOrderDto,
    @Idempotency() idem: IdempotencyHandle,
  ) {
    return replay(idem, await this.ticketing.requestCancel(reference, dto, idem.key));
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("ticketing/ops")
export class TicketingOpsController {
  constructor(private readonly ticketing: TicketingService) {}

  @Get("analytics")
  @Roles(Role.BOOKINGS_OFFICER, Role.TICKET_ADMINISTRATOR)
  analytics() {
    return this.ticketing.analytics();
  }

  @Get("events")
  @Roles(Role.BOOKINGS_OFFICER, Role.TICKET_ADMINISTRATOR)
  events() {
    return this.ticketing.listEvents("staff");
  }

  @Post("events")
  @Roles(Role.BOOKINGS_OFFICER, Role.TICKET_ADMINISTRATOR)
  async createEvent(
    @Body() dto: CreateMatchEventDto,
    @CurrentUser() user: RequestUser,
    @Idempotency() idem: IdempotencyHandle,
  ) {
    return replay(idem, await this.ticketing.createEvent(dto, user.id, idem.key));
  }

  @Post("events/:id/sales-status")
  @Roles(Role.BOOKINGS_OFFICER, Role.TICKET_ADMINISTRATOR)
  setSales(@Param("id") id: string, @Body() dto: SetSalesStatusDto, @CurrentUser() user: RequestUser) {
    return this.ticketing.setSalesStatus(id, dto.salesStatus, user.id);
  }

  @Get("orders")
  @Roles(Role.BOOKINGS_OFFICER, Role.TICKET_ADMINISTRATOR)
  orders(@Query("search") search?: string, @Query("status") status?: string) {
    return this.ticketing.listOrders(search, status);
  }

  @Get("orders/:reference")
  @Roles(Role.BOOKINGS_OFFICER, Role.TICKET_ADMINISTRATOR)
  order(@Param("reference") reference: string) {
    return this.ticketing.getOrder(reference, undefined, true);
  }

  @Get("refunds")
  @Roles(Role.BOOKINGS_OFFICER, Role.TICKET_ADMINISTRATOR)
  refunds() {
    return this.ticketing.listRefunds();
  }

  @Post("refunds/:id/decision")
  @Roles(Role.BOOKINGS_OFFICER)
  async decide(
    @Param("id") id: string,
    @Body() dto: DecideRefundDto,
    @CurrentUser() user: RequestUser,
    @Idempotency() idem: IdempotencyHandle,
  ) {
    return replay(idem, await this.ticketing.decideRefund(id, dto.decision, user.id, idem.key));
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("access")
export class AccessVerificationController {
  constructor(private readonly ticketing: TicketingService) {}

  @Post("verifications")
  @Roles(Role.BOOKINGS_OFFICER, Role.GATE_SECURITY_OFFICER)
  async verify(
    @Body() dto: VerifyAccessDto,
    @Idempotency() idem: IdempotencyHandle,
  ) {
    return replay(idem, await this.ticketing.verify(dto, idem.key));
  }
}
