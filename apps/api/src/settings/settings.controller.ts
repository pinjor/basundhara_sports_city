import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { CurrentUser, type RequestUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PreferencesDto } from "./settings.dto";
import { SettingsService } from "./settings.service";

/** Each user reads and saves only their own preferences, so view-only roles may save too. */
@UseGuards(JwtAuthGuard)
@Controller("settings")
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get("me")
  get(@CurrentUser() user: RequestUser) {
    return this.settings.get(user.id);
  }

  @Put("me")
  save(@CurrentUser() user: RequestUser, @Body() body: PreferencesDto) {
    return this.settings.save(user.id, body);
  }
}
