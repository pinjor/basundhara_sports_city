/**
 * Analytics events (documented in docs/analytics-events.md).
 * No-op unless NEXT_PUBLIC_GA_ID is set and gtag has loaded.
 */
export type AnalyticsEvent =
  | "rfq_start"
  | "rfq_step_complete"
  | "rfq_submit"
  | "quick_inquiry_submit"
  | "add_to_rfq"
  | "catalogue_download"
  | "product_view"
  | "category_view"
  | "email_click"
  | "phone_click"
  | "whatsapp_click"
  | "spec_upload"
  | "contact_submit";

type Gtag = (command: "event", name: string, params?: Record<string, unknown>) => void;

export function track(event: AnalyticsEvent, params?: Record<string, string | number | boolean | undefined>) {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_GA_ID) return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  gtag?.("event", event, params);
}
