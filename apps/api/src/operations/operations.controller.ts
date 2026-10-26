import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { OperationsService } from "./operations.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("operations")
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}

  @Get("tasks")
  listTasks(@Query("status") status?: string, @Query("eventPackId") eventPackId?: string) {
    return this.operations.listTasks({ status, eventPackId });
  }

  @Post("tasks/:id/status")
  setTaskStatus(@Param("id") id: string, @Body() body: { status: string }) {
    return this.operations.setTaskStatus(id, body.status);
  }

  @Get("incidents")
  listIncidents(@Query("status") status?: string) {
    return this.operations.listIncidents({ status });
  }

  @Get("search")
  search(@Query("q") q = "") {
    return this.operations.search(q);
  }
}
