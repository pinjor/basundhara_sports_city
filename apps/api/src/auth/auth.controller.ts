import { Body, Controller, Get, HttpCode, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser, type RequestUser } from "./current-user.decorator";
import { UserAgent } from "./user-agent.decorator";
import { AUTH_THROTTLE } from "../common/throttle";

@ApiTags("Staff auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle(AUTH_THROTTLE)
  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto, @UserAgent() userAgent?: string) {
    return this.authService.login(dto.email, dto.password, userAgent);
  }

  @Throttle(AUTH_THROTTLE)
  @Post("refresh")
  @HttpCode(200)
  refresh(@Body() dto: RefreshTokenDto, @UserAgent() userAgent?: string) {
    return this.authService.refresh(dto.refreshToken, userAgent);
  }

  /** Works with an expired access token, so a client can always sign out cleanly. */
  @Post("logout")
  @HttpCode(204)
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: RequestUser) {
    return user;
  }
}
