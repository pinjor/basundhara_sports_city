import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/** Stored beside refresh tokens so a user can tell their signed-in devices apart. */
export const UserAgent = createParamDecorator((_data: unknown, ctx: ExecutionContext): string | undefined => {
  const value = ctx.switchToHttp().getRequest().headers["user-agent"];
  return typeof value === "string" ? value : undefined;
});
