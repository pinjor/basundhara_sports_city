import { Module } from "@nestjs/common";
import { resourceControllers } from "../common/resource/resource.controller";
import { InventoryModule } from "../inventory/inventory.module";
import { ProcurementHooks } from "./procurement.hooks";
import { ProcurementReportsController } from "./procurement-reports.controller";
import { ProcurementReportsService } from "./procurement-reports.service";

@Module({
  imports: [InventoryModule],
  controllers: [ProcurementReportsController, ...resourceControllers("procurement")],
  providers: [ProcurementHooks, ProcurementReportsService],
})
export class ProcurementModule {}
