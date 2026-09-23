import "server-only";

import { Resend } from "resend";
import { site } from "@/content/site";
import type { ContactValues, RfqValues } from "./validators";

/**
 * Delivers leads: an internal notification to WAMAK, a confirmation to the
 * buyer, and an optional JSON webhook for a CRM (HubSpot, Zoho, …).
 * Without RESEND_API_KEY the payload is logged, so the site works locally.
 */

type Lead =
  | { kind: "rfq"; ref: string; data: RfqValues; file: File | null }
  | { kind: "contact"; ref: string; data: ContactValues };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Short, human-readable reference, e.g. WMK-260923-4F7K. */
export function makeRef(prefix = "WMK") {
  const d = new Date();
  const date = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${date}-${rand}`;
}

/** Ordered label/value rows used by every channel, so they always match. */
export function rows(lead: Lead): [string, string][] {
  if (lead.kind === "contact") {
    const d = lead.data;
    return [
      ["Reference", lead.ref],
      ["Topic", d.topic],
      ["Name", d.name],
      ["Company", d.company || "—"],
      ["Email", d.email],
      ["Country", d.country || "—"],
      ["Message", d.message],
    ];
  }
  const d = lead.data;
  const products = d.items.length
    ? d.items.map((i) => `${i.name}${i.note ? ` (${i.note})` : ""}`).join("\n")
    : "—";
  const utm = d.context?.utm && Object.keys(d.context.utm).length
    ? Object.entries(d.context.utm).map(([k, v]) => `${k}=${v}`).join(", ")
    : "—";
  return [
    ["Reference", lead.ref],
    ["Products from RFQ list", products],
    ["Category", d.category || "—"],
    ["Product and specification", d.product || "—"],
    ["Quantity", `${d.quantity} ${d.unit.toLowerCase()}`],
    ["Packaging", d.packaging || "—"],
    ["Customization", d.customization?.length ? d.customization.join(", ") : "—"],
    ["Destination", [d.destinationPort, d.destinationCountry].filter(Boolean).join(", ")],
    ["Incoterm", d.incoterm],
    ["Required by", d.requiredDate || "—"],
    ["Target price", d.targetPrice || "—"],
    ["Company", d.company],
    ["Contact", d.contactName],
    ["Email", d.email],
    ["Phone / WhatsApp", d.phone || "—"],
    ["Company country", d.companyCountry || "—"],
    ["Notes", d.notes || "—"],
    ["Attachment", lead.file ? `${lead.file.name} (${Math.round(lead.file.size / 1024)} KB)` : "—"],
    ["Source page", d.context?.sourcePage || "—"],
    ["UTM", utm],
  ];
}

function html(title: string, intro: string, table: [string, string][]) {
  const body = table
    .map(
      ([k, v]) =>
        `<tr><th align="left" valign="top" style="padding:8px 16px 8px 0;border-bottom:1px solid #ddd6c6;font:600 14px Arial,sans-serif;color:#1b222b;white-space:nowrap">${esc(k)}</th><td style="padding:8px 0;border-bottom:1px solid #ddd6c6;font:14px/1.5 Arial,sans-serif;color:#1b222b">${esc(v).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#f7f5ee;padding:24px"><div style="max-width:640px;margin:0 auto;background:#fff;padding:32px;border-radius:12px"><p style="margin:0 0 4px;font:600 13px Arial,sans-serif;color:#7a5a24">${esc(site.name)}</p><h1 style="margin:0 0 12px;font:700 22px Arial,sans-serif;color:#05245c">${esc(title)}</h1><p style="margin:0 0 24px;font:15px/1.6 Arial,sans-serif;color:#4a5360">${esc(intro)}</p><table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${body}</table><p style="margin:24px 0 0;font:13px/1.6 Arial,sans-serif;color:#4a5360">${esc(site.name)}, ${esc(site.address.lines.join(", "))}. ${esc(site.email)}</p></div></body></html>`;
}

const text = (title: string, intro: string, table: [string, string][]) =>
  `${title}\n\n${intro}\n\n${table.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${site.name}, ${site.address.lines.join(", ")}\n${site.email}`;

export async function deliverLead(lead: Lead): Promise<{ ok: boolean }> {
  const table = rows(lead);
  const buyerEmail = lead.data.email;
  const buyerName = lead.kind === "rfq" ? lead.data.contactName : lead.data.name;
  const isRfq = lead.kind === "rfq";

  const internal = {
    subject: isRfq
      ? `RFQ ${lead.ref}: ${lead.data.company} (${lead.data.destinationCountry})`
      : `Contact ${lead.ref}: ${lead.data.topic} from ${lead.data.name}`,
    title: isRfq ? "New request for quotation" : "New contact message",
    intro: isRfq ? "Submitted through the website RFQ form. Reply to the buyer directly from this email." : "Submitted through the website contact form.",
  };
  const confirmation = {
    subject: isRfq ? `We've received your request (${lead.ref})` : `We've received your message (${lead.ref})`,
    title: isRfq ? "Thank you. We've received your request." : "Thank you. We've received your message.",
    intro: isRfq
      ? `Dear ${buyerName}, we will review your requirement and reply with questions or a quotation. Please quote reference ${lead.ref} in any follow-up. A copy of what you sent is below.`
      : `Dear ${buyerName}, we will reply to your message by email. Please quote reference ${lead.ref} in any follow-up.`,
  };

  const key = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_FROM_EMAIL;
  const notify = process.env.LEAD_NOTIFY_EMAIL || site.email;
  let ok = true;

  if (key && from) {
    const resend = new Resend(key);
    const attachments =
      lead.kind === "rfq" && lead.file
        ? [{ filename: lead.file.name, content: Buffer.from(await lead.file.arrayBuffer()) }]
        : undefined;
    const [a, b] = await Promise.all([
      resend.emails.send({
        from,
        to: notify,
        replyTo: buyerEmail,
        subject: internal.subject,
        html: html(internal.title, internal.intro, table),
        text: text(internal.title, internal.intro, table),
        attachments,
      }),
      resend.emails.send({
        from,
        to: buyerEmail,
        replyTo: notify,
        subject: confirmation.subject,
        html: html(confirmation.title, confirmation.intro, table.filter(([k]) => !["Source page", "UTM"].includes(k))),
        text: text(confirmation.title, confirmation.intro, table.filter(([k]) => !["Source page", "UTM"].includes(k))),
      }),
    ]);
    // The internal notification is the one that must succeed.
    if (a.error) {
      console.error("[lead] internal email failed", a.error);
      ok = false;
    }
    if (b.error) console.error("[lead] buyer confirmation failed", b.error);
  } else {
    console.info(`[lead] ${lead.kind} ${lead.ref} (email not configured: set RESEND_API_KEY and LEAD_FROM_EMAIL)\n` + text(internal.title, internal.intro, table));
  }

  const hook = process.env.LEAD_WEBHOOK_URL;
  if (hook) {
    try {
      const res = await fetch(hook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: lead.kind, ref: lead.ref, submittedAt: new Date().toISOString(), fields: Object.fromEntries(table) }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) console.error("[lead] webhook responded", res.status);
    } catch (e) {
      console.error("[lead] webhook failed", e);
    }
  }

  return { ok };
}
