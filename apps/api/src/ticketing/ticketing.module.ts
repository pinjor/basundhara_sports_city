import { Module } from "@nestjs/common";
import { AccessVerificationController, TicketingOpsController, TicketingPublicController } from "./ticketing.controller";
import { TicketingService } from "./ticketing.service";

@Module({
  providers: [TicketingService],
  controllers: [TicketingPublicController, TicketingOpsController, AccessVerificationController],
  exports: [TicketingService],
})
export class TicketingModule {}
