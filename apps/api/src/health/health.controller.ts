import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";

const startedAt = Date.now();

/** Liveness and database reachability for load balancers, uptime checks and the container health check. */
@ApiTags("Health")
@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: "error", database: "unreachable" });
    }
    return {
      status: "ok",
      database: "ok",
      version: process.env.APP_VERSION ?? process.env.npm_package_version ?? "dev",
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      time: new Date().toISOString(),
    };
  }
}
