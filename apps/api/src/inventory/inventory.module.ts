import { Module } from "@nestjs/common";
import { resourceControllers } from "../common/resource/resource.controller";
import { InventoryHooks } from "./inventory.hooks";
import { InventoryReportsController } from "./inventory-reports.controller";
import { InventoryReportsService } from "./inventory-reports.service";
import { StockService } from "./stock.service";

@Module({
  controllers: [InventoryReportsController, ...resourceControllers("inventory")],
  providers: [StockService, InventoryHooks, InventoryReportsService],
  exports: [StockService],
})
export class InventoryModule {}
