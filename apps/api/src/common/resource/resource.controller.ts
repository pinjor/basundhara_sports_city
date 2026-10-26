import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, type Type } from "@nestjs/common";
import { resourceEndpoints, type ResourceModule } from "@bsc/shared";
import { CurrentUser, type RequestUser } from "../../auth/current-user.decorator";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { validateBody } from "../validation";
import { buildDto, inputFields, StatusBody } from "./resource-dto";
import { ResourceRegistry } from "./resource.registry";

type Endpoint = ReturnType<typeof resourceEndpoints>[number];

function pascal(path: string): string {
  return path
    .split(/[/-]/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Standard REST surface for one registry endpoint:
 * list, read, audit trail, create, update and workflow moves. Module roles read and write;
 * view-only executive roles read (enforced by RolesGuard).
 */
export function createResourceController({ path, entity, fixed }: Endpoint): Type<unknown> {
  const fields = inputFields(entity.fields, fixed);
  const name = pascal(path);
  const CreateDto = buildDto(`Create${name}Dto`, fields, false);
  const UpdateDto = buildDto(`Update${name}Dto`, fields, true);
  const roles = entity.writeRoles;

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...roles)
  @Controller(path)
  class ResourceController {
    constructor(@Inject(ResourceRegistry) private readonly registry: ResourceRegistry) {}

    private get service() {
      return this.registry.get(entity.key);
    }

    @Get()
    list(@Query() query: Record<string, unknown>) {
      return this.service.list(query, fixed);
    }

    @Get(":id")
    get(@Param("id", ParseUUIDPipe) id: string) {
      return this.service.get(id, fixed);
    }

    @Get(":id/audit-log")
    auditTrail(@Param("id", ParseUUIDPipe) id: string) {
      return this.service.auditTrail(id);
    }

    @Post()
    async create(@Body() body: unknown, @CurrentUser() user: RequestUser) {
      return this.service.create(await validateBody(CreateDto, body), user, fixed);
    }

    @Patch(":id")
    async update(@Param("id", ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentUser() user: RequestUser) {
      return this.service.update(id, await validateBody(UpdateDto, body), user, fixed);
    }

    @Post(":id/status")
    async transition(@Param("id", ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentUser() user: RequestUser) {
      const { status } = await validateBody(StatusBody, body);
      return this.service.transition(id, status, user, fixed);
    }
  }

  Object.defineProperty(ResourceController, "name", { value: `${name}Controller` });
  return ResourceController;
}

export function resourceControllers(module: ResourceModule): Type<unknown>[] {
  return resourceEndpoints()
    .filter((endpoint) => endpoint.entity.module === module)
    .map(createResourceController);
}
