import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../prisma/prisma.service";
import { jwtSecret } from "../config/env";

export interface JwtPayload {
  sub: string;
  /** "staff" or "customer"; tokens issued before customer accounts carry none and are staff. */
  typ?: string;
  email?: string;
  role?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.typ && payload.typ !== "staff") throw new UnauthorizedException("Staff sign-in required");
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active) {
      throw new UnauthorizedException("Account is inactive or no longer exists");
    }
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}
