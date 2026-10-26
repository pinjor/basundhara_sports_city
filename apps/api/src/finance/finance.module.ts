import { Module } from "@nestjs/common";
import { resourceControllers } from "../common/resource/resource.controller";
import { FinanceHooks } from "./finance.hooks";
import { FinanceReportsController } from "./finance-reports.controller";
import { FinanceReportsService } from "./finance-reports.service";
import { JournalService } from "./journal.service";

@Module({
  controllers: [FinanceReportsController, ...resourceControllers("finance")],
  providers: [JournalService, FinanceHooks, FinanceReportsService],
  exports: [JournalService],
})
export class FinanceModule {}
