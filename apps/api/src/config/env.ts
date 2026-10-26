const DEV_JWT_SECRET = "dev-secret-change-me";
const WEAK_SECRETS = new Set([DEV_JWT_SECRET, "change-me-in-production", "secret", "changeme"]);

export const isProduction = () => process.env.NODE_ENV === "production";

/** Signing key for access tokens. Production refuses to start without a strong one. */
export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret && !(isProduction() && WEAK_SECRETS.has(secret))) return secret;
  if (isProduction()) throw new Error("JWT_SECRET must be set to a strong random value in production");
  return secret || DEV_JWT_SECRET;
}

/** Access-token lifetime in seconds. Short, because clients renew it with a refresh token. */
export function accessTtlSeconds(): number {
  return positiveInt(process.env.JWT_ACCESS_TTL_SECONDS, 15 * 60);
}

export function refreshTtlDays(): number {
  return positiveInt(process.env.JWT_REFRESH_TTL_DAYS, 30);
}

/** `*` (default) or a comma-separated allow-list. Native mobile apps send no Origin, so they are unaffected. */
export function corsOrigins(): string[] | true {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw || raw === "*") return true;
  return raw.split(",").map((origin) => origin.trim()).filter(Boolean);
}

/** Base URL prepended to relative image paths so mobile clients get fetchable links. */
export function publicAssetUrl(): string | null {
  const raw = process.env.PUBLIC_ASSET_URL?.trim();
  return raw ? raw.replace(/\/+$/, "") : null;
}

/** Fails fast on settings that would make a hosted deployment unsafe. */
export function assertProductionConfig(): string[] {
  const warnings: string[] = [];
  if (!isProduction()) return warnings;
  const secret = jwtSecret();
  if (secret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters in production");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL must be set");
  if (process.env.TICKETING_SANDBOX_PAYMENTS === "true") warnings.push("TICKETING_SANDBOX_PAYMENTS is on: ticket payments are simulated");
  if (process.env.SEED_DEMO_DATA === "true") warnings.push("SEED_DEMO_DATA is on: demo accounts with a shared password exist");
  if (!publicAssetUrl()) warnings.push("PUBLIC_ASSET_URL is not set: image paths stay relative to the web host");
  if (Number(process.env.AUTH_RATE_LIMIT) > 30) warnings.push("AUTH_RATE_LIMIT is above 30 sign-in attempts per minute");
  return warnings;
}

function positiveInt(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}
