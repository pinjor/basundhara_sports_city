import type { StatusTone } from "@bsc/shared";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "b-green",
  warning: "b-gold",
  danger: "b-red",
  info: "b-blue",
  neutral: "b-grey",
};

/** Maps a domain status string (Section 4) to one of the five semantic tones (Section 2.1). */
export function toneForStatus(status: string): StatusTone {
  const s = status.toLowerCase().replace(/_/g, " ");
  if (["available", "confirmed", "active", "approved", "online", "open", "operational", "delivered", "completed", "paid", "ready", "live", "playable", "done", "checked in", "posted", "on sale", "captured", "succeeded", "resolved"].includes(s)) {
    return "success";
  }
  if (["maintenance", "pending", "reserved", "preparing", "scheduled", "requested", "frozen", "deposit paid", "planning", "attention", "expected", "submitted", "returned", "draft", "held", "paused", "acknowledged", "investigating", "busy"].includes(s)) {
    return "warning";
  }
  if (["cancelled", "denied", "offline", "closed", "expired", "no-show", "under repair", "restricted", "closed for maintenance", "closed for recovery", "rejected", "reversed", "failed", "refunded", "void", "sales closed", "full"].includes(s)) {
    return "danger";
  }
  if (["in use", "on trip", "in progress", "arrived", "checked out", "charging", "sold out"].includes(s)) {
    return "info";
  }
  return "neutral";
}

/** Upper-case enum codes such as ON_SALE read as "On sale"; already-readable labels pass through. */
const ACRONYMS = new Set(["VIP", "VVIP", "QR", "RFID", "NFC", "CCTV", "F&B"]);

export function statusLabel(status: string) {
  if (!/^[A-Z0-9_]+$/.test(status) || status.length < 3 || ACRONYMS.has(status)) return status;
  const words = status.replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function StatusBadge({ status, tone }: { status: string; tone?: StatusTone }) {
  const resolvedTone = tone ?? toneForStatus(status);
  return (
    <span className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[0.35em] px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[resolvedTone]}`}>
      {statusLabel(status)}
    </span>
  );
}
