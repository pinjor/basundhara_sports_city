import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@bsc/shared";
import { ROLES_KEY } from "./roles.decorator";

/**
 * RBAC enforcement (Section 3). Applied globally alongside JwtAuthGuard:
 *  - SUPER_ADMIN always passes.
 *  - READ_ONLY_EXECUTIVE and CHAIRMAN pass for GET requests on any module, and may write only
 *    where an endpoint lists their role explicitly (e.g. the chairman's event approval).
 *  - Every other role must be explicitly listed in the endpoint's @Roles(...) metadata.
 *  - An endpoint with no @Roles metadata is open to any authenticated user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;
    if (user.role === Role.SUPER_ADMIN) return true;

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (user.role === Role.READ_ONLY_EXECUTIVE || user.role === Role.CHAIRMAN) {
      if (request.method === "GET" || requiredRoles.includes(user.role)) return true;
      throw new ForbiddenException("View-only roles cannot perform write actions");
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`Role ${user.role} is not permitted to access this resource`);
    }
    return true;
  }
}
