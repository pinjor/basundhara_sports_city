import { Link } from "react-router-dom";
import { BookingStatus, Role } from "@bsc/shared";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { StatTile } from "../../components/ui/StatTile";
import { useBookings, useSetBookingStatus } from "../../api/bookings";
import { useAuthStore } from "../../store/auth";
import { useToast } from "../../components/ui/Toast";
import { useActiveFeature } from "../../hooks/useActiveFeature";
import { ModuleHub } from "../../features/ModuleHub";

const ESCALATION_TYPES = new Set(["Team", "Corporate", "Academy"]);

function isEscalation(amount: number, type: string, facilityType?: string) {
  return amount >= 10000 || ESCALATION_TYPES.has(type) || facilityType === "Stadium";
}

export function ApprovalsPage() {
  const { featureKey, feature } = useActiveFeature();
  const escalations = featureKey === "escalations";
  const { data: pending = [], isLoading } = useBookings({ status: BookingStatus.PENDING });
  const setStatus = useSetBookingStatus();
  const { push } = useToast();
  const role = useAuthStore((s) => s.user?.role);
  const canApprove = role === Role.SUPER_ADMIN || role === Role.BOOKINGS_OFFICER;
  if (!featureKey) return <ModuleHub />;

  const ranked = pending.map((booking) => {
    const amount = Number(booking.amount);
    const hot = isEscalation(amount, booking.type, booking.facility?.type);
    return { booking, amount, hot };
  });
  const desk = escalations ? ranked.filter((r) => r.hot).sort((a, b) => b.amount - a.amount) : ranked.filter((r) => !r.hot);

  async function decide(id: string, status: string) {
    try {
      await setStatus.mutateAsync({ id, status });
      push(status === BookingStatus.CONFIRMED ? "Booking confirmed and event pack opened." : "Booking rejected.");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      push(Array.isArray(message) ? message[0] : message ?? "Approval failed.", "danger");
    }
  }

  return (
    <div>
      <header className="feature-hero mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            Approvals
            <span className="mx-2 text-gold/40">·</span>
            {escalations ? "Priority inbox" : "Standard holds"}
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold gold-foil">{feature?.label ?? "Booking Approvals"}</h2>
          <p className="mt-2 max-w-3xl text-sm text-text-dim">
            {escalations
              ? "Stadium, team, corporate and high-value holds that need a senior decision before the event pack opens."
              : "Everyday pending bookings waiting for confirm or reject."}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Link
            to="/approvals?feature=booking-approvals"
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${!escalations ? "border-gold bg-gold/20 text-gold" : "border-gold/20 text-text-dim"}`}
          >
            Booking Approvals
          </Link>
          <Link
            to="/approvals?feature=escalations"
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${escalations ? "border-gold bg-gold/20 text-gold" : "border-gold/20 text-text-dim"}`}
          >
            Escalations
          </Link>
        </div>
      </header>

      <div className="stat-row mb-6" style={{ ["--n" as string]: 3 }}>
        <StatTile label="Pending" value={pending.length} tone="gold" />
        <StatTile label="Escalations" value={ranked.filter((r) => r.hot).length} tone="red" />
        <StatTile label="On this desk" value={desk.length} tone="blue" />
      </div>

      {isLoading ? (
        <p className="text-sm text-text-dim">Loading approvals…</p>
      ) : desk.length === 0 ? (
        <p className="text-sm text-text-dim">{escalations ? "No escalated holds right now." : "No standard pending bookings."}</p>
      ) : (
        <div className="space-y-3">
          {desk.map(({ booking, amount, hot }) => (
            <div key={booking.id} className={`panel p-4 ${hot ? "!border-gold" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-display text-lg text-text">{booking.customerName}</div>
                  <p className="text-sm text-text-dim">
                    {booking.facility?.name} · {new Date(booking.date).toLocaleDateString()} · {booking.timeSlotStart}–{booking.timeSlotEnd} · ৳
                    {amount.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-gold/80">
                    {booking.type}
                    {hot ? " · Escalation: stadium / team / high value" : " · Standard hold"}
                  </p>
                </div>
                <StatusBadge status={hot ? "Escalation" : booking.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button disabled={!canApprove || setStatus.isPending} onClick={() => void decide(booking.id, BookingStatus.CONFIRMED)}>
                  Approve & open event pack
                </Button>
                <Button variant="secondary" disabled={!canApprove || setStatus.isPending} onClick={() => void decide(booking.id, BookingStatus.CANCELLED)}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
