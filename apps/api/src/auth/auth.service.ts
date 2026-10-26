import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import type { LoginResponseDto, TokenPairDto } from "@bsc/shared";
import { PrismaService } from "../prisma/prisma.service";
import { TokenService, type Subject } from "./token.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async login(email: string, password: string, userAgent?: string): Promise<LoginResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const pair = await this.tokens.issue(this.subject(user), userAgent);
    return { ...pair, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  refresh(refreshToken: string, userAgent?: string): Promise<TokenPairDto> {
    return this.tokens.rotate(
      refreshToken,
      "staff",
      async (id) => {
        const user = await this.prisma.user.findUnique({ where: { id } });
        return user?.active ? this.subject(user) : null;
      },
      userAgent,
    );
  }

  logout(refreshToken: string) {
    return this.tokens.revoke(refreshToken, "staff");
  }

  private subject(user: User): Subject {
    return { type: "staff", id: user.id, claims: { email: user.email, role: user.role } };
  }
}
