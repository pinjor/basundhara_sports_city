import type { ClassConstructor } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, MaxLength, Min } from "class-validator";
import type { ResourceField } from "@bsc/shared";

type PropertyDecoratorFn = (target: object, propertyKey: string) => void;

/** Fields a client may send: everything except server-filled ones and the forced values of a narrowed endpoint. */
export function inputFields(fields: ResourceField[], fixed: Record<string, unknown> = {}): ResourceField[] {
  return fields.filter((field) => !field.readOnly && field.kind !== "stamp" && !(field.key in fixed));
}

function decoratorsFor(field: ResourceField, partial: boolean): PropertyDecoratorFn[] {
  const decorators: PropertyDecoratorFn[] = [];
  if (partial || !field.required) decorators.push(IsOptional());
  switch (field.kind) {
    case "text":
      decorators.push(IsString(), MaxLength(240));
      if (field.required) decorators.push(IsNotEmpty());
      break;
    case "textarea":
      decorators.push(IsString(), MaxLength(4000));
      break;
    case "number":
      decorators.push(field.integer === false ? IsNumber({ maxDecimalPlaces: 4 }) : IsInt());
      break;
    case "money":
      decorators.push(IsNumber({ maxDecimalPlaces: 2 }), Min(0));
      break;
    case "date":
      decorators.push(IsString(), Matches(/^\d{4}-\d{2}-\d{2}$/, { message: `${field.key} must be YYYY-MM-DD` }));
      break;
    case "time":
      decorators.push(IsString(), Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: `${field.key} must be HH:mm` }));
      break;
    case "select":
      decorators.push(IsIn([...(field.options ?? [])]));
      break;
    case "ref":
      decorators.push(IsUUID());
      break;
    case "bool":
      decorators.push(IsBoolean());
      break;
    default:
      break;
  }
  return decorators;
}

/** Builds a class-validator DTO class from registry fields. */
export function buildDto(name: string, fields: ResourceField[], partial: boolean): ClassConstructor<Record<string, unknown>> {
  const Dto = class {} as ClassConstructor<Record<string, unknown>>;
  Object.defineProperty(Dto, "name", { value: name });
  for (const field of fields) {
    for (const decorate of decoratorsFor(field, partial)) decorate(Dto.prototype, field.key);
  }
  return Dto;
}

export class StatusBody {
  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
