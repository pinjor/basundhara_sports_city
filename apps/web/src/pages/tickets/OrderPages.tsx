import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCancelTicketOrder, useTicketOrder } from "../../api/ticketing";
import { TicketQr } from "../../components/tickets/TicketQr";
import { Button } from "../../components/ui/Button";
import { ErrorState, LoadingSkeleton } from "../../components/ui/States";
import { apiErrorMessage } from "../../lib/apiError";
import { useI18n } from "../../lib/i18n";
import { formatBdt, formatWhen } from "../../lib/money";
import { activeOrder, rememberedOrders, rememberOrder } from "./orderMemory";
import { PublicShell } from "./PublicShell";

export function OrderPage() {
  const { reference = "" } = useParams();
  const { t, lang } = useI18n();
  const stored = activeOrder();
  const remembered = rememberedOrders().find((item) => item.reference === reference);
  const mobile = (stored?.reference === reference ? stored.mobile : remembered?.mobile) ?? "";
  const order = useTicketOrder(reference, mobile || undefined);
  const cancel = useCancelTicketOrder(reference);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const confirmed = order.data?.status === "CONFIRMED";

  return (
    <PublicShell>
      {!mobile && <p className="text-sm">Open this booking from {t("nav.my")}.</p>}
      {order.isLoading && <LoadingSkeleton />}
      {order.isError && <ErrorState message={apiErrorMessage(order.error, t("common.error"))} />}
      {order.data && (
        <div className="space-y-4">
          <p className={`inline-flex rounded-full px-3 py-1 text-sm ${confirmed ? "bg-[var(--status-success)] text-[#04140c]" : "bg-[var(--status-warning)] text-[#1a1204]"}`}>
            {confirmed ? t("order.confirmed") : `${t("order.notConfirmed")} (${order.data.status})`}
          </p>
          <h1 className="font-display text-4xl uppercase">{order.data.event.title}</h1>
          <p className="text-sm text-text-dim">{order.data.reference} · {formatWhen(order.data.event.startsAt, lang)} · {formatBdt(order.data.total, lang)}</p>
          {order.data.payment && <p className="text-sm">Payment: {order.data.payment.status}{order.data.payment.sandbox ? " · sandbox" : ""}</p>}
          {confirmed && (
            <ul className="grid gap-4 md:grid-cols-2">
              {order.data.items.map((item) => (
                <li key={item.id} className="panel bg-[#F7F5EE] p-4 text-[#14181A]">
                  <p className="font-display text-2xl uppercase">{item.sectionName} {item.rowLabel}{item.seatNumber}</p>
                  <p className="text-sm">{item.gateName} · {item.ticket?.status}</p>
                  {item.ticket?.token ? (
                    <div className="mt-3">
                      <TicketQr value={item.ticket.token} />
                      <p className="mt-2 text-xs">{t("ticket.bright")}</p>
                      <p className="mt-2 break-all font-mono text-xs">{t("ticket.code")}: {item.ticket.token}</p>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {confirmed && !order.data.refund && (
            <form
              className="panel max-w-lg space-y-3 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                void cancel.mutateAsync({ buyerMobile: mobile, reason }).then(() => {
                  setNote(t("cancel.note"));
                  void order.refetch();
                }).catch((error) => setNote(apiErrorMessage(error, t("common.error"))));
              }}
            >
              <h2 className="font-display text-xl uppercase">{t("cancel.title")}</h2>
              <p className="text-sm text-text-dim">{t("cancel.note")}</p>
              <label className="block text-sm">{t("cancel.reason")}
                <textarea required minLength={3} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 min-h-24 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface-secondary)] p-2" />
              </label>
              <Button type="submit" variant="danger" disabled={cancel.isPending}>{t("cancel.send")}</Button>
              {note && <p className="text-sm" role="status">{note}</p>}
            </form>
          )}
          {order.data.refund && <p className="text-sm">Cancellation: {order.data.refund.status}</p>}
          {order.data.status === "AWAITING_PAYMENT" || order.data.status === "PAYMENT_FAILED_RETRY_HOLD" ? (
            <Link to={`/tickets/orders/${reference}/checkout`} className="text-[var(--brand-gold)]">{t("checkout.pay")}</Link>
          ) : null}
        </div>
      )}
    </PublicShell>
  );
}

export function MyBookingsPage() {
  const { t } = useI18n();
  const [reference, setReference] = useState("");
  const [mobile, setMobile] = useState("");
  const saved = rememberedOrders();
  return (
    <PublicShell>
      <h1 className="font-display text-3xl uppercase text-[var(--brand-gold)]">{t("my.title")}</h1>
      <h2 className="mt-6 text-sm uppercase tracking-wide text-text-dim">{t("my.device")}</h2>
      {saved.length === 0 && <p className="mt-2 text-sm text-text-dim">{t("my.empty")}</p>}
      <ul className="mt-2 space-y-2">
        {saved.map((item) => (
          <li key={item.reference}>
            <Link className="text-[var(--brand-gold)]" to={`/tickets/orders/${item.reference}`} onClick={() => rememberOrder(item.reference, item.mobile)}>{item.reference}</Link>
          </li>
        ))}
      </ul>
      <form
        className="panel mt-6 max-w-md space-y-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          rememberOrder(reference.trim(), mobile.trim());
          window.location.assign(`/tickets/orders/${reference.trim()}`);
        }}
      >
        <h2 className="font-medium">{t("my.lookup")}</h2>
        <label className="block text-sm">{t("my.reference")}
          <input required value={reference} onChange={(event) => setReference(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3" />
        </label>
        <label className="block text-sm">{t("details.mobile")}
          <input required value={mobile} onChange={(event) => setMobile(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3" />
        </label>
        <Button type="submit">{t("my.find")}</Button>
      </form>
    </PublicShell>
  );
}

export function HelpPage() {
  const { t } = useI18n();
  return (
    <PublicShell>
      <h1 className="font-display text-3xl uppercase text-[var(--brand-gold)]">{t("help.title")}</h1>
      <div className="panel mt-4 max-w-2xl space-y-3 p-5 text-sm leading-6">
        <p>{t("help.body")}</p>
        <p>Your booking is confirmed only when My bookings shows it as Confirmed. The test payment screen is not a receipt.</p>
        <p>Seat colours are also labelled: empty, selected, held, and sold.</p>
      </div>
    </PublicShell>
  );
}
