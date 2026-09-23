import { z } from "zod";

/**
 * Shared validation for the RFQ wizard and contact form. The same schemas run
 * in the browser (react-hook-form) and again on the server (server actions).
 * Only the fields named in the brief are required; everything else is optional.
 */

export const UNITS = ["Pieces", "Sets", "Kilograms", "Metric tonnes", "Cartons", "20ft containers", "40ft containers", "Other"] as const;

export const INCOTERMS = [
  { value: "EXW", label: "EXW", hint: "You collect from the supplier's premises in Bangladesh and arrange everything after." },
  { value: "FOB", label: "FOB", hint: "We deliver to the vessel at the Bangladesh port. You arrange the sea freight." },
  { value: "CFR", label: "CFR", hint: "We arrange the freight to your port. You take on the risk once the goods are loaded." },
  { value: "CIF", label: "CIF", hint: "Like CFR, plus we arrange cargo insurance to your port." },
  { value: "Other", label: "Other", hint: "Tell us the term you need in the notes." },
  { value: "Not sure", label: "Not sure yet", hint: "We'll suggest the right term with the quotation." },
] as const;

export const CUSTOMIZATION = ["Logo or branding", "Private label", "Custom packaging", "Custom size or design"] as const;

export const CONTACT_TOPICS = ["Product inquiry", "Catalogue request", "Sourcing partnership", "Supplier introduction", "Something else"] as const;

/** Upload rules: PDF, JPG or PNG. Limit is configurable (Vercel caps request bodies at 4.5MB). */
export const UPLOAD_TYPES = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
} as const;
export const MAX_UPLOAD_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? 10);
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

const trimmed = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);
const optional = (max: number) => trimmed(max).optional().or(z.literal(""));

export const rfqItemSchema = z.object({
  category: z.string().max(80),
  slug: z.string().max(120),
  name: z.string().max(160),
  note: z.string().max(300).optional(),
});

const rfqStep1Base = z.object({
  items: z.array(rfqItemSchema).max(40),
  category: optional(80),
  product: optional(1000),
  quantity: trimmed(120).min(1, "Enter a quantity, for example 5,000 or 2."),
  unit: z.enum(UNITS),
  packaging: optional(1000),
  customization: z.array(z.enum(CUSTOMIZATION)).optional(),
});

/** A product must be identified: from the RFQ list, a description, or a category. */
const hasProduct = {
  check: (v: { items: unknown[]; product?: string; category?: string }) =>
    v.items.length > 0 || (v.product?.trim().length ?? 0) >= 2 || !!v.category,
  params: { message: "Tell us the product or choose a category.", path: ["product"] },
};

export const rfqStep1 = rfqStep1Base.refine(hasProduct.check, hasProduct.params);

export const rfqStep2 = z.object({
  destinationCountry: trimmed(80).min(1, "Choose the destination country."),
  destinationPort: optional(120),
  incoterm: z.enum(INCOTERMS.map((i) => i.value) as [string, ...string[]]),
  requiredDate: optional(20),
  targetPrice: optional(200),
});

export const rfqStep3 = z.object({
  company: trimmed(160).min(2, "Enter your company name."),
  contactName: trimmed(120).min(2, "Enter the name of the person we should reply to."),
  email: z.email("Enter a business email address, for example name@company.com."),
  phone: optional(40),
  companyCountry: optional(80),
  notes: optional(3000),
  consent: z.literal(true, { error: "Please confirm we may use these details to reply to your request." }),
});

/** Full RFQ, as validated on the server. */
export const rfqSchema = z
  .object({
    ...rfqStep1Base.shape,
    ...rfqStep2.shape,
    ...rfqStep3.shape,
    context: z
      .object({
        sourcePage: z.string().max(300).optional(),
        utm: z.record(z.string(), z.string().max(200)).optional(),
      })
      .optional(),
  })
  .refine(hasProduct.check, hasProduct.params);

export type RfqValues = z.infer<typeof rfqSchema>;

export const contactSchema = z.object({
  topic: z.enum(CONTACT_TOPICS),
  name: trimmed(120).min(2, "Enter your name."),
  company: optional(160),
  email: z.email("Enter an email address, for example name@company.com."),
  country: optional(80),
  message: trimmed(3000).min(10, "Tell us a little more, at least a sentence, so we can reply usefully."),
  consent: z.literal(true, { error: "Please confirm we may use these details to reply." }),
});

export type ContactValues = z.infer<typeof contactSchema>;

/** Server-side file check: declared type, size, and magic bytes must all agree. */
export async function checkUpload(file: File | null): Promise<{ ok: true; file: File | null } | { ok: false; error: string }> {
  if (!file || file.size === 0) return { ok: true, file: null };
  if (!(file.type in UPLOAD_TYPES)) return { ok: false, error: "Upload a PDF, JPG or PNG file." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: `The file is larger than ${MAX_UPLOAD_MB}MB. Send a smaller file, or email it to us.` };
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
  const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  const isJpg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const matches =
    (file.type === "application/pdf" && isPdf) || (file.type === "image/png" && isPng) || (file.type === "image/jpeg" && isJpg);
  if (!matches) return { ok: false, error: "This file doesn't look like a valid PDF, JPG or PNG." };
  return { ok: true, file };
}
