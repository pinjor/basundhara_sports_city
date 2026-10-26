import { Global, Module } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { ReferenceService } from "./reference.service";
import { lookupControllers } from "./resource/lookup.controller";
import { ResourceHookRegistry } from "./resource/resource-hooks";
import { ResourceRegistry } from "./resource/resource.registry";

@Global()
@Module({
  controllers: lookupControllers(),
  providers: [ReferenceService, NotificationService, ResourceHookRegistry, ResourceRegistry],
  exports: [ReferenceService, NotificationService, ResourceHookRegistry, ResourceRegistry],
})
export class CommonModule {}
