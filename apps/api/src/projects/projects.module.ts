import { Module } from "@nestjs/common";
import { resourceControllers } from "../common/resource/resource.controller";
import { ProjectsHooks } from "./projects.hooks";

@Module({
  controllers: resourceControllers("projects"),
  providers: [ProjectsHooks],
})
export class ProjectsModule {}
