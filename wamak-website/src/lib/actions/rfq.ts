"use server";

import { deliverLead, makeRef } from "@/lib/lead-delivery";
import { checkUpload, rfqSchema } from "@/lib/validators";
import { fieldErrors, guard, parsePayload, type ActionResult } from "./shared";

/** Receives the RFQ wizard: JSON payload + optional specification file. */
export async function submitRfq(formData: FormData): Promise<ActionResult> {
  const blocked = await guard(formData);
  // Honeypot hits get a normal-looking success so bots learn nothing.
  if (blocked === "honeypot") return { ok: true, ref: makeRef() };
  if (blocked) return blocked;

  const parsed = rfqSchema.safeParse(parsePayload(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), formError: "Some details need attention." };

  const raw = formData.get("file");
  const upload = await checkUpload(raw instanceof File ? raw : null);
  if (!upload.ok) return { ok: false, fieldErrors: { file: upload.error } };

  const ref = makeRef();
  const result = await deliverLead({ kind: "rfq", ref, data: parsed.data, file: upload.file });
  if (!result.ok) {
    return { ok: false, formError: "We couldn't send your request just now. Please try again, or email it to us directly." };
  }
  return { ok: true, ref };
}
