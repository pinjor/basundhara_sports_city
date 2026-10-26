import { Injectable, type OnModuleInit } from "@nestjs/common";
import { assertEditable, fail } from "../common/resource/guards";
import { ResourceHookRegistry } from "../common/resource/resource-hooks";

const DONE = 100;

/** Progress stays within 0-100 and reaches 100 when a project completes. */
@Injectable()
export class ProjectsHooks implements OnModuleInit {
  constructor(private readonly hooks: ResourceHookRegistry) {}

  onModuleInit() {
    this.hooks.register("project", {
      prepare: (data, _ctx, existing) => {
        assertEditable(existing, ["PLANNED", "IN_PROGRESS", "ON_HOLD"]);
        if (data.progress !== undefined && (Number(data.progress) < 0 || Number(data.progress) > DONE)) fail("Progress must be between 0 and 100");
        return data;
      },
      beforeTransition: (_row, to) => (to === "COMPLETED" ? { progress: DONE } : undefined),
    });
  }
}
