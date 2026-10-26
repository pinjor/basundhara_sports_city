import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, type Observable } from "rxjs";
import { publicAssetUrl } from "../config/env";

const IMAGE_KEY = /(image|photo|avatar|logo|thumbnail)Url$/i;

/**
 * Stored image paths are relative to the web host ("/dash/cam-food.jpg"). When PUBLIC_ASSET_URL is set,
 * responses carry absolute links instead, so mobile clients can load them directly.
 */
@Injectable()
export class AssetUrlInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const base = publicAssetUrl();
    if (!base) return next.handle();
    return next.handle().pipe(map((body) => absolutise(body, base)));
  }
}

function absolutise(value: unknown, base: string): unknown {
  if (Array.isArray(value)) {
    value.forEach((item, index) => (value[index] = absolutise(item, base)));
    return value;
  }
  if (!isPlainObject(value)) return value;
  for (const [key, field] of Object.entries(value)) {
    if (typeof field === "string" && IMAGE_KEY.test(key) && field.startsWith("/") && !field.startsWith("//")) {
      value[key] = `${base}${field}`;
    } else if (field && typeof field === "object") {
      value[key] = absolutise(field, base);
    }
  }
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
