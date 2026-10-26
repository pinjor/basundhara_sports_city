import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usePayTicketOrder, useTicketOrder } from "../../api/ticketing";
import { Button } from "../../components/ui/Button";
import { ErrorState, LoadingSkeleton } from "../../components/ui/States";
import { apiErrorMessage } from "../../lib/apiError";
import { useI18n } from "../../lib/i18n";
import { formatBdt } from "../../lib/money";
import { activeOrder, rememberOrder } from "./orderMemory";
import { PublicShell } from "./PublicShell";

export function CheckoutPage() {
  const { reference = "" } = useParams();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const stored = activeOrder();
  const mobile = stored?.reference === reference ? stored.mobile : "";
  const order = useTicketOrder(reference, mobile || undefined);
  const pay = usePayTicketOrder(reference);
  const [method, setMethod] = useState("CARD");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remainingMs = order.data ? new Date(order.data.holdExpiresAt).getTime() - now : 0;
  const expired = order.data ? remainingMs <= 0 && order.data.status !== "CONFIRMED" : false;
  const minutes = Math.max(0, Math.floor(remainingMs / 60000));
  const seconds = Math.max(0, Math.floor((remainingMs % 60000) / 1000));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!mobile) return;
    setMessage(null);
    try {
      const next = await pay.mutateAsync({ buyerMobile: mobile, method, simulateFailure });
      rememberOrder(next.reference, mobile);
      if (next.status === "CONFIRMED") navigate(`/tickets/orders/${next.reference}`);
      else setMessage(t("checkout.retry"));
      await order.refetch();
    } catch (error) {
      setMessage(apiErrorMessage(error, t("common.error")));
    }
  }

  return (
    <PublicShell>
      <h1 className="font-display text-3xl uppercase text-[var(--brand-gold)]">{t("checkout.title")}</h1>
      {!mobile && <p className="mt-4 text-sm">{t("my.lookup")} — <Link to="/tickets/my" className="text-[var(--brand-gold)]">{t("nav.my")}</Link></p>}
      {order.isLoading && <LoadingSkeleton />}
      {order.isError && <ErrorState message={apiErrorMessage(order.error, t("common.error"))} />}
      {order.data && (
        <form className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_320px]" onSubmit={(event) => void submit(event)}>
          <section className="panel space-y-3 p-4">
            <p className="rounded-md border border-[var(--status-warning)] px-3 py-2 text-sm text-[var(--status-warning)]">{t("checkout.sandbox")}</p>
            <h2 className="font-display text-2xl uppercase">{order.data.event.title}</h2>
            <ul className="text-sm">
              {order.data.items.map((item) => (
                <li key={item.id} className="flex justify-between border-b border-[var(--border-subtle)] py-2">
                  <span>{item.sectionName} {item.rowLabel}{item.seatNumber}</span>
                  <span className="tabular-nums">{formatBdt(item.unitPrice, lang)}</span>
                </li>
              ))}
            </ul>
            <p className="flex justify-between text-sm"><span>{t("checkout.subtotal")}</span><span className="tabular-nums">{formatBdt(order.data.subtotal, lang)}</span></p>
            <p className="flex justify-between text-sm"><span>{t("checkout.vat")} ({(order.data.vatRateBps / 100).toFixed(2)}%)</span><span className="tabular-nums">{formatBdt(order.data.vat, lang)}</span></p>
            <p className="text-xs text-text-dim">{order.data.vatNote}</p>
            <p className="flex justify-between font-display text-2xl"><span>{t("checkout.total")}</span><span className="tabular-nums">{formatBdt(order.data.total, lang)}</span></p>
          </section>
          <section className="panel h-fit space-y-3 p-4">
            <p className="text-sm" aria-live="polite">
              {order.data.status === "CONFIRMED"
                ? t("order.confirmed")
                : expired
                  ? t("checkout.expired")
                  : `${t("checkout.hold")} ${minutes}:${seconds.toString().padStart(2, "0")}`}
            </p>
            {order.data.status === "PAYMENT_FAILED_RETRY_HOLD" && <p className="text-sm text-[var(--status-warning)]">{t("checkout.retry")}</p>}
            <fieldset className="space-y-2" disabled={expired || order.data.status === "CONFIRMED"}>
              <legend className="text-sm">{t("checkout.method")}</legend>
              {[["CARD", t("checkout.card")], ["BKASH", t("checkout.bkash")], ["NAGAD", t("checkout.nagad")]].map(([value, label]) => (
                <label key={value} className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="radio" name="method" value={value} checked={method === value} onChange={() => setMethod(value)} />
                  {label}
                </label>
              ))}
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={simulateFailure} onChange={(event) => setSimulateFailure(event.target.checked)} />
                {t("checkout.fail")}
              </label>
            </fieldset>
            {pay.isPending && <p className="text-sm" role="status">{t("checkout.processing")}</p>}
            {message && <p className="text-sm text-[var(--status-danger)]" role="alert">{message}</p>}
            {order.data.status === "CONFIRMED" ? (
              <Link to={`/tickets/orders/${reference}`} className="gold-btn inline-flex min-h-11 items-center rounded-md px-4">{t("order.confirmed")}</Link>
            ) : expired ? (
              <Link to={`/tickets/events/${order.data.event.id}`} className="text-sm text-[var(--brand-gold)]">{t("checkout.startAgain")}</Link>
            ) : (
              <Button type="submit" disabled={pay.isPending}>{pay.isPending ? t("common.loading") : t("checkout.pay")}</Button>
            )}
          </section>
        </form>
      )}
    </PublicShell>
  );
}
