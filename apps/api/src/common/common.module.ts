import { Global, Module } from "@nestjs/common";
import { IdempotencyService } from "./idempotency.service";
import { NotificationService } from "./notification.service";
import { ReferenceService } from "./reference.service";
import { lookupControllers } from "./resource/lookup.controller";
import { ResourceHookRegistry } from "./resource/resource-hooks";
import { ResourceRegistry } from "./resource/resource.registry";

@Global()
@Module({
  controllers: lookupControllers(),
  providers: [ReferenceService, NotificationService, IdempotencyService, ResourceHookRegistry, ResourceRegistry],
  exports: [ReferenceService, NotificationService, IdempotencyService, ResourceHookRegistry, ResourceRegistry],
})
export class CommonModule {}
