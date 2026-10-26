import { Module } from "@nestjs/common";
import { resourceControllers } from "../common/resource/resource.controller";
import { IncidentsController } from "./incidents.controller";
import { IncidentsService } from "./incidents.service";
import { SecurityHooks } from "./security.hooks";

@Module({
  controllers: [IncidentsController, ...resourceControllers("security")],
  providers: [IncidentsService, SecurityHooks],
})
export class SecurityModule {}
