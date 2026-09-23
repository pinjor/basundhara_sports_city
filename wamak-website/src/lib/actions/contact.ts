"use server";

import { deliverLead, makeRef } from "@/lib/lead-delivery";
import { contactSchema } from "@/lib/validators";
import { fieldErrors, guard, parsePayload, type ActionResult } from "./shared";

export async function submitContact(formData: FormData): Promise<ActionResult> {
  const blocked = await guard(formData);
  if (blocked === "honeypot") return { ok: true, ref: makeRef("MSG") };
  if (blocked) return blocked;

  const parsed = contactSchema.safeParse(parsePayload(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), formError: "Some details need attention." };

  const ref = makeRef("MSG");
  const result = await deliverLead({ kind: "contact", ref, data: parsed.data });
  if (!result.ok) return { ok: false, formError: "We couldn't send your message just now. Please try again, or email us directly." };
  return { ok: true, ref };
}
