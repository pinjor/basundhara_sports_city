import "reflect-metadata";
import { ArgumentsHost, Catch, ExceptionFilter, Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import type { ValidationError } from "class-validator";
import * as classTransformer from "class-transformer";
import { AppModule } from "./app.module";
import { validationError } from "./common/validation";
import { assertProductionConfig, corsOrigins } from "./config/env";

/** Known Prisma request errors are client mistakes (duplicate key, bad reference), not server faults. */
function prismaError(exception: unknown): { statusCode: number; message: string } | null {
  const error = exception as { code?: unknown; meta?: { target?: unknown; field_name?: unknown } };
  if (typeof error?.code !== "string" || !/^P2\d{3}$/.test(error.code)) return null;
  if (error.code === "P2002") return { statusCode: 409, message: `Already exists: ${[error.meta?.target].flat().join(", ") || "duplicate value"}` };
  if (error.code === "P2003") return { statusCode: 400, message: `Linked record not found (${String(error.meta?.field_name ?? "reference")})` };
  if (error.code === "P2025") return { statusCode: 404, message: "Record not found" };
  return null;
}

/**
 * On Windows the drive letter can be `D:` in one require path and `d:` in another.
 * Node then loads @nestjs/common twice, so `instanceof HttpException` fails in Nest's
 * filter and every application exception becomes a generic 500. Match by behaviour.
 */
@Catch()
class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger("HttpErrorFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const prisma = prismaError(exception);
    if (prisma) {
      response.status(prisma.statusCode).json(prisma);
      return;
    }
    const withStatus = exception as { getStatus?: () => number; getResponse?: () => unknown; message?: string; stack?: string };
    const status = typeof withStatus?.getStatus === "function" ? withStatus.getStatus() : 500;
    if (status >= 500) this.logger.error(withStatus?.message ?? "Unhandled error", withStatus?.stack);
    const raw = typeof withStatus?.getResponse === "function" ? withStatus.getResponse() : undefined;
    const body =
      typeof raw === "string"
        ? { statusCode: status, message: raw }
        : raw && typeof raw === "object"
          ? raw
          : { statusCode: status, message: status === 500 ? "Internal server error" : "Request failed" };
    response.status(status).json(body);
  }
}

function setupDocs(app: NestExpressApplication) {
  const config = new DocumentBuilder()
    .setTitle("Bashundhara Sports City API")
    .setDescription(
      [
        "Staff dashboards sign in at /auth/login; the customer app signs in at /customer/auth/login.",
        "Send the access token as `Authorization: Bearer <token>`. It is short-lived: swap the refresh token at the matching /refresh route before it expires.",
        "Order, payment and cancellation calls need an `Idempotency-Key` header (any unique string per attempt).",
      ].join("\n\n"),
    )
    .setVersion(process.env.APP_VERSION ?? "1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config), { jsonDocumentUrl: "api/docs-json" });
}

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const warnings = assertProductionConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: { origin: corsOrigins(), exposedHeaders: ["Idempotent-Replayed"] } });
  if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.useBodyParser("json", { limit: "1mb" });
  app.enableShutdownHooks();
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new HttpErrorFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      // Same class-transformer instance the DTOs decorated. A second copy
      // (drive-letter case on Windows) drops @Type metadata and rejects nested fields.
      transformerPackage: classTransformer,
      exceptionFactory: (errors: ValidationError[]) => validationError(errors),
    }),
  );
  if (process.env.API_DOCS !== "false") setupDocs(app);
  const port = process.env.PORT ? Number(process.env.PORT) : 18481;
  await app.listen(port);
  warnings.forEach((warning) => logger.warn(warning));
  logger.log(`BSC API listening on :${port}`);
}
bootstrap();
