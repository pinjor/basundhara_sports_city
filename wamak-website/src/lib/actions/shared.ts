import "server-only";

import { headers } from "next/headers";
import type { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

export type ActionResult =
  | { ok: true; ref: string }
  | { ok: false; fieldErrors?: Record<string, string>; formError?: string };

export async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** Rejects bursts from one client. Returns an ActionResult on failure, else null. */
export async function guard(formData: FormData): Promise<ActionResult | "honeypot" | null> {
  // Honeypot: real people never see or fill this field.
  if (String(formData.get("website") ?? "").trim() !== "") return "honeypot";
  const limit = rateLimit(await clientKey());
  if (!limit.ok) {
    return {
      ok: false,
      formError: `Too many requests from this connection. Please try again in ${limit.retryAfterMin} minutes, or email us directly.`,
    };
  }
  return null;
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}

export function parsePayload(formData: FormData): unknown {
  try {
    return JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return {};
  }
}
