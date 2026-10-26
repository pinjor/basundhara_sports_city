import { createParamDecorator, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard, PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../prisma/prisma.service";
import { jwtSecret } from "../config/env";
import type { JwtPayload } from "./jwt.strategy";

export interface RequestCustomer {
  id: string;
  name: string;
  email: string;
  mobile: string;
}

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, "customer-jwt") {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(),
    });
  }

  async validate(payload: JwtPayload): Promise<RequestCustomer> {
    if (payload.typ !== "customer") throw new UnauthorizedException("Customer sign-in required");
    const customer = await this.prisma.customer.findUnique({ where: { id: payload.sub } });
    if (!customer || !customer.active) throw new UnauthorizedException("Account is inactive or no longer exists");
    return { id: customer.id, name: customer.name, email: customer.email, mobile: customer.mobile };
  }
}

@Injectable()
export class CustomerAuthGuard extends AuthGuard("customer-jwt") {}

export const CurrentCustomer = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestCustomer => {
  return ctx.switchToHttp().getRequest().user;
});
