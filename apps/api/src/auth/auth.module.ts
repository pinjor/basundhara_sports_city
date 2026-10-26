import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import { CustomerJwtStrategy } from "./customer-jwt.strategy";
import { TokenService } from "./token.service";
import { accessTtlSeconds, jwtSecret } from "../config/env";

@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({ secret: jwtSecret(), signOptions: { expiresIn: accessTtlSeconds() } }),
    }),
  ],
  providers: [AuthService, TokenService, JwtStrategy, CustomerJwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
