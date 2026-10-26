import { Module } from "@nestjs/common";
import { resourceControllers } from "../common/resource/resource.controller";
import { FinanceModule } from "../finance/finance.module";
import { HrmHooks } from "./hrm.hooks";
import { HrmReportsController } from "./hrm-reports.controller";
import { HrmReportsService } from "./hrm-reports.service";

@Module({
  imports: [FinanceModule],
  controllers: [HrmReportsController, ...resourceControllers("hrm")],
  providers: [HrmHooks, HrmReportsService],
})
export class HrmModule {}
