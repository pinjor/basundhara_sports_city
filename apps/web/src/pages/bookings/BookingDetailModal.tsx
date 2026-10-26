import { Link } from "react-router-dom";
import { BOOKING_STATUS_TRANSITIONS, PaymentStatus } from "@bsc/shared";
import { Modal } from "../../components/ui/Modal";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { SelectInput } from "../../components/ui/Field";
import { useBooking, useBookingAuditLog, useSetBookingStatus, useSetBookingPaymentStatus } from "../../api/bookings";
import { useToast } from "../../components/ui/Toast";

export function BookingDetailModal({ bookingId, onClose }: { bookingId: string | null; onClose: () => void }) {
  const { data: booking } = useBooking(bookingId);
  const { data: auditLog } = useBookingAuditLog(bookingId);
  const setStatus = useSetBookingStatus();
  const setPaymentStatus = useSetBookingPaymentStatus();
  const { push } = useToast();

  if (!bookingId || !booking) return null;

  const nextStatuses = BOOKING_STATUS_TRANSITIONS[booking.status] ?? [];

  async function transition(status: string) {
    try {
      await setStatus.mutateAsync({ id: booking!.id, status });
      push(`Booking moved to ${status}.`);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      push(Array.isArray(message) ? message[0] : message ?? "That transition isn't allowed from the current status.", "danger");
    }
  }

  return (
    <Modal open={!!bookingId} onClose={onClose} title={booking.customerName}>
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between">
          <StatusBadge status={booking.status} />
          <span className="text-text-dim">{booking.type} · {booking.facility?.name}</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-surface-2 p-3">
            <div className="text-xs uppercase text-text-dimmer">Date & time</div>
            <div className="font-display text-lg text-text">
              {new Date(booking.date).toLocaleDateString()} · {booking.timeSlotStart}–{booking.timeSlotEnd}
            </div>
          </div>
          <div className="rounded-md bg-surface-2 p-3">
            <div className="text-xs uppercase text-text-dimmer">Amount</div>
            <div className="font-display text-lg text-text">৳{Number(booking.amount).toLocaleString()}</div>
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-xs uppercase tracking-wide text-text-dimmer">QR confirmation code</div>
          <code className="block rounded-md bg-surface-2 px-3 py-1.5 text-xs text-text-dim">{booking.qrConfirmationCode}</code>
        </div>

        {booking.eventPack ? (
          <div className="rounded-md border border-gold/25 bg-gold/10 p-3">
            <div className="text-xs uppercase tracking-wide text-gold">Event operations pack</div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <div>
                <div className="text-sm text-text">{booking.eventPack.title}</div>
                <StatusBadge status={booking.eventPack.status} />
              </div>
              <Link to={`/?view=events&event=${booking.eventPack.id}`} className="text-sm text-gold hover:text-gold-soft" onClick={onClose}>
                Open command board
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-dim">Confirm this booking to create the operational event pack.</p>
        )}

        <div>
          <div className="mb-1.5 text-xs uppercase tracking-wide text-text-dimmer">Payment status</div>
          <div className="flex items-center gap-2">
            <StatusBadge status={booking.paymentStatus} />
            <SelectInput
              className="w-auto"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  setPaymentStatus.mutate({ id: booking.id, paymentStatus: e.target.value });
                }
              }}
            >
              <option value="">Change payment status…</option>
              {Object.values(PaymentStatus)
                .filter((s) => s !== booking.paymentStatus)
                .map((s) => <option key={s} value={s}>{s}</option>)}
            </SelectInput>
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-xs uppercase tracking-wide text-text-dimmer">Status transitions</div>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.length === 0 && <span className="text-text-dim">No further transitions — booking is final.</span>}
            {nextStatuses.map((s) => (
              <Button key={s} variant="secondary" onClick={() => transition(s)} disabled={setStatus.isPending}>
                Move to {s}
              </Button>
            ))}
          </div>
        </div>

        {auditLog && auditLog.length > 0 && (
          <div>
            <div className="mb-1.5 text-xs uppercase tracking-wide text-text-dimmer">Audit trail</div>
            <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-text-dim">
              {auditLog.map((entry: any) => (
                <li key={entry.id}>
                  {entry.action} · {entry.user?.name} · {new Date(entry.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
