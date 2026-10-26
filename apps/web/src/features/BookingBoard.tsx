import type { BookingDto } from "@bsc/shared";
import { StatusBadge } from "../components/ui/StatusBadge";

const EXTRA: Record<string, string> = {
  "recurring-booking": "Repeats",
  "coach-booking": "Coach",
  "equipment-add-on": "Equipment",
  "setup-time-buffer": "Buffer",
  "dynamic-pricing": "Price rule",
  "peak-hour-pricing": "Peak window",
  "slot-management": "Slot",
  "waiting-list": "Request",
  "cancellation-policy": "Policy",
  "deposit-management": "Deposit",
  "payment-integration": "Payment note",
  "qr-confirmation": "Mobile",
  "availability-calendar": "Note",
  "conflict-detection": "Note",
};

const FACILITY: Record<string, string[]> = {
  "field-reservation": ["Football Pitch", "Cricket Ground", "Training Ground"],
  "turf-reservation": ["Turf"],
  "court-reservation": ["Basketball Court", "Tennis Court", "Padel Court", "Squash Court", "Badminton Court"],
  "lane-reservation": ["Swimming Pool"],
  "room-reservation": ["Changing Room", "Media Room", "Medical Room"],
  "event-space-booking": ["Event Hall", "Stadium"],
};

export function facilityTypesFor(featureKey: string | null): string[] | undefined {
  if (!featureKey) return undefined;
  return FACILITY[featureKey];
}

export function bookingExtraLabel(featureKey: string | null): string | undefined {
  if (!featureKey) return undefined;
  return EXTRA[featureKey];
}

function day(value: string): string {
  return value.slice(0, 10);
}

function clashes(row: BookingDto, all: BookingDto[]): boolean {
  return all.some((other) => {
    if (other.id === row.id || other.facilityId !== row.facilityId) return false;
    if (day(other.date) !== day(row.date)) return false;
    if (other.status === "Cancelled" || row.status === "Cancelled") return false;
    return row.timeSlotStart < other.timeSlotEnd && other.timeSlotStart < row.timeSlotEnd;
  });
}

export function BookingBoard({
  featureKey,
  bookings,
  selectedId,
  onSelect,
}: {
  featureKey: string | null;
  bookings: BookingDto[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const extra = bookingExtraLabel(featureKey);
  const showQr = featureKey === "qr-confirmation";
  const showConflict = featureKey === "conflict-detection";
  const sharesUntagged = new Set(["waiting-list", "cancellation-policy", "deposit-management", "payment-integration", "qr-confirmation"]);
  const rows = bookings.filter((row) => {
    if (showConflict || featureKey === "availability-calendar") return true;
    if (!featureKey || featureKey === "online-booking") return !row.featureKey || row.featureKey === "online-booking";
    if (sharesUntagged.has(featureKey)) return !row.featureKey || row.featureKey === featureKey;
    return row.featureKey === featureKey;
  });

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-[var(--border-strong)] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-dim">Bookings</p>
        <h3 className="mt-1 font-display text-lg font-semibold text-text">{rows.length} on this feature</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse whitespace-nowrap text-sm">
          <thead>
            <tr className="border-b border-[var(--border-strong)] text-left text-xs uppercase tracking-[0.14em] text-text-dim">
              <th className="px-3 py-3 font-medium">Customer</th>
              <th className="px-3 py-3 font-medium">When</th>
              <th className="px-3 py-3 font-medium">Type</th>
              <th className="px-3 py-3 font-medium">Amount</th>
              {extra && <th className="px-3 py-3 font-medium">{extra}</th>}
              {showQr && <th className="px-3 py-3 font-medium">QR</th>}
              {showConflict && <th className="px-3 py-3 font-medium">Conflict</th>}
              <th className="px-3 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-8 text-center text-text-dim">No bookings for this feature yet.</td>
              </tr>
            ) : rows.map((row) => (
              <tr
                key={row.id}
                className={`cursor-pointer border-b border-[var(--border-strong)] last:border-0 ${selectedId === row.id ? "bg-white/5" : ""}`}
                onClick={() => onSelect(row.id)}
              >
                <td className="max-w-[16rem] px-3 py-3">
                  <span className="block truncate">{row.customerName}</span>
                  <span className="block truncate text-xs text-text-dim">{row.facility?.name ?? "Venue"}</span>
                </td>
                <td className="px-3 py-3">
                  <span className="block">{day(row.date)}</span>
                  <span className="block text-xs text-text-dim tabular-nums">{row.timeSlotStart}–{row.timeSlotEnd}</span>
                </td>
                <td className="px-3 py-3">{row.type}</td>
                <td className="px-3 py-3">
                  <span className="block tabular-nums">{Number(row.amount).toLocaleString()}</span>
                  <span className="block text-xs text-text-dim">{row.paymentStatus}</span>
                </td>
                {extra && <td className="px-3 py-3">{row.detail || "—"}</td>}
                {showQr && <td className="px-3 py-3">{row.qrConfirmationCode.slice(0, 8)}</td>}
                {showConflict && <td className="px-3 py-3">{clashes(row, bookings) ? "Overlap" : "Clear"}</td>}
                <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
