import { Module } from "@nestjs/common";
import { resourceControllers } from "../common/resource/resource.controller";
import { BookingOpsHooks } from "./booking-ops.hooks";
import { BookingOpsReportsController } from "./booking-ops-reports.controller";
import { BookingOpsReportsService } from "./booking-ops-reports.service";

@Module({
  controllers: [BookingOpsReportsController, ...resourceControllers("bookings")],
  providers: [BookingOpsHooks, BookingOpsReportsService],
})
export class BookingOpsModule {}
