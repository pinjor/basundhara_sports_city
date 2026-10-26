import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCreateTicketOrder, usePublicEvent, useSeatMap } from "../../api/ticketing";
import { Button } from "../../components/ui/Button";
import { ErrorState, LoadingSkeleton } from "../../components/ui/States";
import { apiErrorMessage } from "../../lib/apiError";
import { useI18n } from "../../lib/i18n";
import { formatBdt, formatWhen } from "../../lib/money";
import { rememberOrder } from "./orderMemory";
import { PublicShell } from "./PublicShell";

interface Pick {
  sectionId: string;
  sectionName: string;
  rowLabel: string;
  seatNumber: number;
  price: number;
}

export function EventPage() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const event = usePublicEvent(id);
  const seats = useSeatMap(id);
  const create = useCreateTicketOrder();
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [picked, setPicked] = useState<Pick[]>([]);
  const [step, setStep] = useState<"seats" | "details">("seats");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [terms, setTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const section = useMemo(() => {
    const list = seats.data?.sections ?? [];
    return list.find((item) => item.id === sectionId) ?? list[0];
  }, [seats.data, sectionId]);

  function toggle(rowLabel: string, seatNumber: number, state: string) {
    if (!section || state !== "available") return;
    const key = `${section.id}:${rowLabel}:${seatNumber}`;
    const exists = picked.some((seat) => `${seat.sectionId}:${seat.rowLabel}:${seat.seatNumber}` === key);
    if (exists) {
      setPicked((current) => current.filter((seat) => `${seat.sectionId}:${seat.rowLabel}:${seat.seatNumber}` !== key));
      return;
    }
    if (picked.length >= 6) return;
    setPicked((current) => [
      ...current,
      { sectionId: section.id, sectionName: section.name, rowLabel, seatNumber, price: section.category?.priceBdt ?? 0 },
    ]);
  }

  async function hold(eventForm: FormEvent) {
    eventForm.preventDefault();
    setFormError(null);
    if (!/^01[3-9]\d{8}$/.test(mobile)) {
      setFormError(lang === "bn" ? "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)।" : "Enter a Bangladesh mobile number (01XXXXXXXXX).");
      return;
    }
    if (!terms || !id) return;
    try {
      const order = await create.mutateAsync({
        eventId: id,
        buyerName: name.trim(),
        buyerMobile: mobile,
        buyerEmail: email.trim(),
        termsAccepted: true,
        seats: picked.map((seat) => ({ sectionId: seat.sectionId, rowLabel: seat.rowLabel, seatNumber: seat.seatNumber })),
      });
      rememberOrder(order.reference, mobile);
      navigate(`/tickets/orders/${order.reference}/checkout`);
    } catch (error) {
      setFormError(apiErrorMessage(error, t("common.error")));
    }
  }

  const closed = event.data && (event.data.salesStatus !== "ON_SALE" || new Date(event.data.startsAt).getTime() <= Date.now());

  return (
    <PublicShell>
      {event.isLoading && <LoadingSkeleton />}
      {event.isError && <ErrorState message={apiErrorMessage(event.error, t("common.error"))} onRetry={() => void event.refetch()} />}
      {event.data && (
        <>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--brand-gold)]">{event.data.sport}</p>
          <h1 className="font-display text-4xl uppercase leading-none">{event.data.title}</h1>
          <p className="mt-2 text-sm text-text-dim">{event.data.venueName}</p>
          {event.data.venueNote && <p className="mt-1 max-w-2xl text-sm text-text-dim">{event.data.venueNote}</p>}
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="panel p-3"><dt className="text-xs text-text-dim">{t("event.starts")}</dt><dd className="tabular-nums">{formatWhen(event.data.startsAt, lang)}</dd></div>
            <div className="panel p-3"><dt className="text-xs text-text-dim">{t("event.doors")}</dt><dd className="tabular-nums">{formatWhen(event.data.doorsAt, lang)}</dd></div>
            <div className="panel p-3"><dt className="text-xs text-text-dim">{t("event.venue")}</dt><dd>{event.data.remaining} {t("events.left")}</dd></div>
          </dl>
          <h2 className="mt-8 font-display text-2xl uppercase">{t("event.categories")}</h2>
          <p className="mt-1 text-xs text-text-dim">{t("event.priceNote")}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {event.data.sections.map((item) => (
              <li key={item.id} className="panel p-3 text-sm">
                <p className="font-medium">{item.name}</p>
                <p className="tabular-nums text-[var(--brand-gold)]">{item.category ? formatBdt(item.category.priceBdt, lang) : "—"}</p>
                <p className="text-text-dim">{item.category?.gateName} · {item.remaining} {t("events.left")}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      {closed && <p className="mt-6 rounded-md border border-[var(--status-warning)] px-3 py-2 text-sm">{event.data?.salesStatus === "CLOSED" ? t("events.closed") : t("events.soldout")}</p>}

      {!closed && step === "seats" && (
        <section className="mt-8">
          <h2 className="font-display text-2xl uppercase">{t("seats.title")}</h2>
          <p className="text-sm text-text-dim">{t("seats.max")}</p>
          {seats.isLoading && <LoadingSkeleton rows={2} />}
          {seats.isError && <ErrorState message={apiErrorMessage(seats.error, t("common.error"))} onRetry={() => void seats.refetch()} />}
          {seats.data && section && (
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="panel min-w-0 p-4">
                <div className="mb-3 flex flex-wrap gap-2" role="tablist">
                  {seats.data.sections.map((item) => (
                    <button key={item.id} type="button" role="tab" aria-selected={item.id === section.id} className={`min-h-11 rounded-md px-3 text-sm ${item.id === section.id ? "gold-btn" : "border border-[var(--border-strong)]"}`} onClick={() => setSectionId(item.id)}>
                      {item.name}
                    </button>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <div className="inline-grid gap-1" style={{ gridTemplateColumns: `auto repeat(${section.rows[0]?.seats.length ?? 1}, 36px)` }}>
                    <span />
                    {section.rows[0]?.seats.map((seat) => <span key={seat.number} className="text-center text-[10px] text-text-dim">{seat.number}</span>)}
                    {section.rows.map((row) => (
                      <div key={row.label} className="contents">
                        <span className="pr-2 text-xs text-text-dim">{row.label}</span>
                        {row.seats.map((seat) => {
                          const selected = picked.some((item) => item.sectionId === section.id && item.rowLabel === row.label && item.seatNumber === seat.number);
                          const label = `${section.name} ${row.label}${seat.number}, ${selected ? t("seats.selected") : t(seat.state === "sold" ? "seats.sold" : seat.state === "held" ? "seats.held" : "seats.available")}`;
                          return (
                            <button
                              key={seat.number}
                              type="button"
                              disabled={seat.state !== "available"}
                              aria-pressed={selected}
                              aria-label={label}
                              onClick={() => toggle(row.label, seat.number, seat.state)}
                              className={`h-9 w-9 rounded-sm text-[10px] ${
                                selected
                                  ? "bg-[var(--brand-gold)] text-[var(--text-on-gold)]"
                                  : seat.state === "sold"
                                    ? "bg-[var(--surface-secondary)] text-text-dim line-through"
                                    : seat.state === "held"
                                      ? "border border-dashed border-[var(--status-warning)] text-[var(--status-warning)]"
                                      : "border border-[var(--border-strong)] hover:border-[var(--brand-gold)]"
                              }`}
                            >
                              {seat.state === "sold" ? "×" : seat.state === "held" ? "·" : selected ? "✓" : ""}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                <ul className="mt-4 flex flex-wrap gap-3 text-xs text-text-dim">
                  <li>□ {t("seats.available")}</li>
                  <li>✓ {t("seats.selected")}</li>
                  <li>· {t("seats.held")}</li>
                  <li>× {t("seats.sold")}</li>
                </ul>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-[var(--brand-gold)]">{t("seats.list")}</summary>
                  <ul className="mt-2 max-h-48 overflow-auto text-sm">
                    {section.rows.flatMap((row) => row.seats.map((seat) => (
                      <li key={`${row.label}${seat.number}`}>
                        <button type="button" className="min-h-11 w-full text-left disabled:text-text-dim" disabled={seat.state !== "available"} onClick={() => toggle(row.label, seat.number, seat.state)}>
                          {row.label}{seat.number} — {seat.state === "sold" ? t("seats.sold") : seat.state === "held" ? t("seats.held") : t("seats.available")}
                        </button>
                      </li>
                    )))}
                  </ul>
                </details>
              </div>
              <aside className="panel h-fit p-4">
                <h3 className="font-medium">{t("seats.selected")}</h3>
                {picked.length === 0 && <p className="mt-2 text-sm text-text-dim">{t("seats.empty")}</p>}
                <ul className="mt-2 space-y-1 text-sm">
                  {picked.map((seat) => (
                    <li key={`${seat.sectionId}${seat.rowLabel}${seat.seatNumber}`} className="flex justify-between gap-2">
                      <span>{seat.sectionName} {seat.rowLabel}{seat.seatNumber}</span>
                      <span className="tabular-nums">{formatBdt(seat.price, lang)}</span>
                    </li>
                  ))}
                </ul>
                <Button type="button" className="mt-4 w-full" disabled={picked.length === 0} onClick={() => setStep("details")}>{t("seats.continue")}</Button>
              </aside>
            </div>
          )}
        </section>
      )}

      {!closed && step === "details" && (
        <form className="panel mt-8 max-w-lg space-y-4 p-5" onSubmit={(eventForm) => void hold(eventForm)}>
          <h2 className="font-display text-2xl uppercase">{t("details.title")}</h2>
          <label className="block text-sm">{t("details.name")}
            <input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3" />
          </label>
          <label className="block text-sm">{t("details.mobile")}
            <input required inputMode="numeric" autoComplete="tel" value={mobile} onChange={(event) => setMobile(event.target.value)} placeholder="01XXXXXXXXX" className="mt-1 min-h-11 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3" />
          </label>
          <label className="block text-sm">{t("details.email")}
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3" />
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={terms} onChange={(event) => setTerms(event.target.checked)} required />
            <span>{t("details.terms")}</span>
          </label>
          {formError && <p className="text-sm text-[var(--status-danger)]" role="alert">{formError}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep("seats")}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={create.isPending || !terms}>{create.isPending ? t("common.loading") : t("details.hold")}</Button>
          </div>
          <Link to="/tickets/events" className="block text-sm text-text-dim">{t("nav.events")}</Link>
        </form>
      )}
    </PublicShell>
  );
}
