import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentCustomer, CustomerAuthGuard, type RequestCustomer } from "../auth/customer-jwt.strategy";
import { Idempotency, replay, type IdempotencyHandle } from "../ticketing/idempotency";
import { CustomerCatalogService } from "./customer-catalog.service";
import { CustomerInboxService } from "./customer-inbox.service";
import { CustomerMembershipService } from "./customer-membership.service";
import { CustomerServicesService } from "./customer-services.service";
import { CustomerAccessService } from "./customer-access.service";
import { CustomerGateScanDto, FoodOrderDto, FreePassDto, GuestInviteDto, LoungeHoldDto, ParkingPassDto, RideRequestDto } from "./dto/customer.dto";

/** Public reads for the customer app: no sign-in needed. */
@ApiTags("Customer catalogue")
@Controller("customer")
export class CustomerCatalogController {
  constructor(
    private readonly catalog: CustomerCatalogService,
    private readonly membership: CustomerMembershipService,
  ) {}

  /** Every public venue with image, summary, live occupancy and whether it takes app bookings. */
  @Get("venues")
  venues() {
    return this.catalog.venues();
  }

  /** Complex map zones (x, y from 0 to 1) and entry gates. */
  @Get("map")
  map() {
    return this.catalog.map();
  }

  @Get("home")
  home() {
    return this.catalog.home();
  }

  @Get("membership/plans")
  plans() {
    return this.membership.catalog();
  }

  @Get("lounges")
  lounges() {
    return this.catalog.lounges();
  }

  /** Open outlets that take app orders, with their menus. */
  @Get("menu")
  menu() {
    return this.catalog.menu();
  }

  @Get("parking/zones")
  parkingZones() {
    return this.catalog.parkingZones();
  }

  /** Buggy stops with their map position (x, y from 0 to 1). */
  @Get("stops")
  stops() {
    return this.catalog.stops();
  }

  @Get("fleet")
  fleet() {
    return this.catalog.fleet();
  }

  @Get("passes/catalog")
  passCatalog() {
    return this.catalog.passCatalog();
  }
}

@ApiTags("Customer services")
@ApiBearerAuth()
@UseGuards(CustomerAuthGuard)
@Controller("customer")
export class CustomerServicesController {
  constructor(
    private readonly services: CustomerServicesService,
    private readonly inbox: CustomerInboxService,
    private readonly access: CustomerAccessService,
  ) {}

  /** Present a membership, booking, ticket or pass at a gate. The server decides, logs it and uses up single-use tickets. */
  @HttpCode(200)
  @Post("gate-scans")
  gateScan(@CurrentCustomer() customer: RequestCustomer, @Body() dto: CustomerGateScanDto) {
    return this.access.scan(customer, dto);
  }

  @Get("gate-scans")
  gateScans(@CurrentCustomer() customer: RequestCustomer) {
    return this.access.history(customer.id);
  }

  @Get("food-orders")
  foodOrders(@CurrentCustomer() customer: RequestCustomer) {
    return this.services.foodOrders(customer.id);
  }

  /** Requires an `Idempotency-Key` header. Paid at the pickup counter. */
  @Post("food-orders")
  async placeFoodOrder(@CurrentCustomer() customer: RequestCustomer, @Body() dto: FoodOrderDto, @Idempotency() idem: IdempotencyHandle) {
    return replay(idem, await this.services.placeFoodOrder(customer, dto, idem.key));
  }

  @Get("parking/pass")
  parkingPass(@CurrentCustomer() customer: RequestCustomer) {
    return this.services.parkingPass(customer.id);
  }

  @Post("parking/pass")
  reserveParking(@CurrentCustomer() customer: RequestCustomer, @Body() dto: ParkingPassDto) {
    return this.services.reserveParking(customer, dto);
  }

  @Delete("parking/pass")
  releaseParking(@CurrentCustomer() customer: RequestCustomer) {
    return this.services.releaseParking(customer.id);
  }

  @Get("rides/current")
  currentRide(@CurrentCustomer() customer: RequestCustomer) {
    return this.services.currentRide(customer.id);
  }

  @Post("rides")
  requestRide(@CurrentCustomer() customer: RequestCustomer, @Body() dto: RideRequestDto) {
    return this.services.requestRide(customer, dto);
  }

  @HttpCode(200)
  @Post("rides/:id/board")
  boardRide(@CurrentCustomer() customer: RequestCustomer, @Param("id") id: string) {
    return this.services.boardRide(customer.id, id);
  }

  @HttpCode(200)
  @Post("rides/:id/complete")
  completeRide(@CurrentCustomer() customer: RequestCustomer, @Param("id") id: string) {
    return this.services.completeRide(customer.id, id);
  }

  @HttpCode(200)
  @Post("rides/:id/cancel")
  cancelRide(@CurrentCustomer() customer: RequestCustomer, @Param("id") id: string) {
    return this.services.cancelRide(customer.id, id);
  }

  @Get("lounge-holds/current")
  loungeHold(@CurrentCustomer() customer: RequestCustomer) {
    return this.services.loungeHold(customer.id);
  }

  @Post("lounge-holds")
  holdLounge(@CurrentCustomer() customer: RequestCustomer, @Body() dto: LoungeHoldDto) {
    return this.services.holdLounge(customer, dto);
  }

  @Delete("lounge-holds/:id")
  releaseLoungeHold(@CurrentCustomer() customer: RequestCustomer, @Param("id") id: string) {
    return this.services.releaseLoungeHold(customer.id, id);
  }

  @Get("guests")
  guests(@CurrentCustomer() customer: RequestCustomer) {
    return this.services.guests(customer.id);
  }

  @Post("guests")
  inviteGuest(@CurrentCustomer() customer: RequestCustomer, @Body() dto: GuestInviteDto) {
    return this.services.inviteGuest(customer, dto);
  }

  @HttpCode(200)
  @Post("guests/:id/revoke")
  revokeGuest(@CurrentCustomer() customer: RequestCustomer, @Param("id") id: string) {
    return this.services.revokeGuest(customer.id, id);
  }

  @Get("passes")
  passes(@CurrentCustomer() customer: RequestCustomer) {
    return this.services.passes(customer.id);
  }

  @Post("passes")
  issuePass(@CurrentCustomer() customer: RequestCustomer, @Body() dto: FreePassDto) {
    return this.services.issuePass(customer, dto.name);
  }

  @Get("notifications")
  notifications(@CurrentCustomer() customer: RequestCustomer) {
    return this.inbox.list(customer.id);
  }

  @HttpCode(200)
  @Post("notifications/read-all")
  readAll(@CurrentCustomer() customer: RequestCustomer) {
    return this.inbox.readAll(customer.id);
  }
}
