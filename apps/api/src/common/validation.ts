import { BadRequestException } from "@nestjs/common";
import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate, type ValidationError } from "class-validator";

export function flattenValidation(errors: ValidationError[], prefix = ""): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    const path = prefix ? `${prefix}.${error.property}` : error.property;
    if (error.constraints) messages.push(...Object.values(error.constraints).map((message) => `${path}: ${message}`));
    if (error.children?.length) messages.push(...flattenValidation(error.children, path));
  }
  return messages.length ? messages : ["Invalid request"];
}

export function validationError(errors: ValidationError[]) {
  return new BadRequestException({ statusCode: 400, message: flattenValidation(errors), error: "Bad Request" });
}

/** Validates a body against a DTO class built at runtime (the global pipe skips untyped bodies). */
export async function validateBody<T extends object>(dto: ClassConstructor<T>, body: unknown): Promise<T> {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new BadRequestException("Request body must be an object");
  const instance = plainToInstance(dto, body);
  const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });
  if (errors.length) throw validationError(errors);
  return instance;
}
