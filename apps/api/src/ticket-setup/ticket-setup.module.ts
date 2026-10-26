import { Module } from "@nestjs/common";
import { resourceControllers } from "../common/resource/resource.controller";
import { TicketSetupHooks } from "./ticket-setup.hooks";
import { TicketSetupReportsController } from "./ticket-setup-reports.controller";
import { TicketSetupReportsService } from "./ticket-setup-reports.service";

@Module({
  controllers: [TicketSetupReportsController, ...resourceControllers("ticketing")],
  providers: [TicketSetupHooks, TicketSetupReportsService],
})
export class TicketSetupModule {}
