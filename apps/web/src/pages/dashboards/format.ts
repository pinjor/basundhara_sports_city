const LAKH = 100_000;
const CRORE = 10_000_000;
const MILLION = 1_000_000;

const grouped = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const oneDp = (n: number) => (Math.round(n * 10) / 10).toLocaleString("en-IN");

/** Whole number with lakh/crore grouping: 1,28,450. */
export const count = (n: number) => grouped.format(n);

/** Taka with lakh/crore grouping: ৳ 2,80,000. */
export const bdt = (n: number) => `৳ ${grouped.format(n)}`;

/** Short taka for KPI tiles: ৳ 2.8M / ৳ 45.2K. */
export function bdtShort(n: number) {
  if (Math.abs(n) >= MILLION) return `৳ ${oneDp(n / MILLION)}M`;
  if (Math.abs(n) >= 1_000) return `৳ ${oneDp(n / 1_000)}K`;
  return bdt(n);
}

/** Crore/lakh taka for the chairman view: ৳ 41.0 Cr. */
export function bdtCrore(n: number) {
  if (Math.abs(n) >= CRORE) return `৳ ${oneDp(n / CRORE)} Cr`;
  if (Math.abs(n) >= LAKH) return `৳ ${oneDp(n / LAKH)} L`;
  return bdt(n);
}

/** Props for a KPI change chip. No baseline gives an empty chip. */
export function change(delta: number | null, lowerIsBetter = false) {
  if (delta === null) return { delta: "" };
  const down = delta < 0;
  return { delta: `${Math.abs(delta)}%`, down, bad: down !== lowerIsBetter && delta !== 0 };
}

/** "18 Oct 2026" from an ISO date. */
export function day(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: iso.length === 10 ? "UTC" : "Asia/Dhaka" });
}

/** "10:24 AM" in Dhaka time. */
export const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Dhaka" });

/** "18:30" → "6:30 PM". */
export function slotTime(hhmm: string) {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

const NICE = [1, 2, 2.5, 5, 10];

/** A round axis top above `values` and evenly spaced labels from top to 0. */
export function scale(values: number[], label: (n: number) => string = (n) => count(n), ticks = 4) {
  const peak = Math.max(0, ...values);
  if (peak === 0) return { max: ticks, axis: Array.from({ length: ticks + 1 }, (_, i) => label(ticks - i)) };
  const raw = peak / ticks;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = (NICE.find((n) => n * magnitude >= raw) ?? 10) * magnitude;
  const max = step * ticks;
  return { max, axis: Array.from({ length: ticks + 1 }, (_, i) => label(Math.round((max - step * i) * 100) / 100)) };
}

/** Title-case an enum value: "FULL_TIME" → "Full time". */
export function titleCase(value: string) {
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Nusrat Jahan" → "NJ". */
export function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}
