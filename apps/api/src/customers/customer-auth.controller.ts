import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiTags } from "@nestjs/swagger";
import { RefreshTokenDto } from "../auth/dto/refresh.dto";
import { UserAgent } from "../auth/user-agent.decorator";
import { AUTH_THROTTLE } from "../common/throttle";
import { CustomersService } from "./customers.service";
import { CustomerLoginDto, RegisterCustomerDto } from "./dto/customer.dto";

@ApiTags("Customer auth")
@Throttle(AUTH_THROTTLE)
@Controller("customer/auth")
export class CustomerAuthController {
  constructor(private readonly customers: CustomersService) {}

  @Post("register")
  register(@Body() dto: RegisterCustomerDto, @UserAgent() userAgent?: string) {
    return this.customers.register(dto, userAgent);
  }

  /** `login` is the email address or the mobile number. */
  @Post("login")
  @HttpCode(200)
  login(@Body() dto: CustomerLoginDto, @UserAgent() userAgent?: string) {
    return this.customers.login(dto.login, dto.password, userAgent);
  }

  @Post("refresh")
  @HttpCode(200)
  refresh(@Body() dto: RefreshTokenDto, @UserAgent() userAgent?: string) {
    return this.customers.refresh(dto.refreshToken, userAgent);
  }

  @Post("logout")
  @HttpCode(204)
  async logout(@Body() dto: RefreshTokenDto) {
    await this.customers.logout(dto.refreshToken);
  }
}
