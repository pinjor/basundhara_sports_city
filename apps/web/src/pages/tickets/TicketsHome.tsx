import { Link, useSearchParams } from "react-router-dom";
import { usePublicEvents } from "../../api/ticketing";
import { PageHero } from "../../components/ui/PageHero";
import { ErrorState, LoadingSkeleton } from "../../components/ui/States";
import { useI18n } from "../../lib/i18n";
import { apiErrorMessage } from "../../lib/apiError";
import { formatBdt, formatWhen } from "../../lib/money";
import { PublicShell } from "./PublicShell";

export function TicketsHome() {
  const { t, lang } = useI18n();
  const events = usePublicEvents();
  const featured = (events.data ?? []).filter((event) => new Date(event.startsAt).getTime() > Date.now()).slice(0, 3);
  return (
    <PublicShell>
      <PageHero kicker={t("hero.kicker")} title={t("hero.title")} subtitle={t("hero.sub")} note={t("hero.photo")} />
      <Link to="/tickets/book" className="gold-btn mt-6 inline-flex min-h-11 items-center rounded-md px-4 py-2 text-sm">{t("session.cta")}</Link>
      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl uppercase text-[var(--brand-gold)]">{t("events.upcoming")}</h2>
          <Link to="/tickets/events" className="text-sm text-[var(--brand-gold)]">{t("nav.events")}</Link>
        </div>
        {events.isLoading && <LoadingSkeleton />}
        {events.isError && <ErrorState message={apiErrorMessage(events.error, t("common.error"))} onRetry={() => void events.refetch()} />}
        {events.data && featured.length === 0 && <p className="text-sm text-text-dim">{t("events.empty")}</p>}
        <div className="grid gap-4 md:grid-cols-3">
          {featured.map((event) => (
            <article key={event.id} className="panel-gold panel-interactive overflow-hidden">
              <div className="h-28 bg-cover bg-center" style={{ backgroundImage: "linear-gradient(180deg, transparent, #080B0C), url(/login-hero.jpg)" }} />
              <div className="p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--brand-gold)]">{event.sport}</p>
                <h3 className="mt-1 font-display text-2xl uppercase leading-none">{event.title}</h3>
                <p className="mt-2 text-sm text-text-dim">{formatWhen(event.startsAt, lang)}</p>
                <p className="text-sm text-text-dim">{event.venueName}</p>
                <p className="mt-3 text-sm">{event.fromPriceBdt != null ? `${t("events.from")} ${formatBdt(event.fromPriceBdt, lang)}` : ""} · {event.remaining} {t("events.left")}</p>
                <Link to={`/tickets/events/${event.id}`} className="gold-btn mt-4 inline-flex min-h-11 items-center rounded-md px-4 py-2 text-sm">{t("events.book")}</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}

export function EventsListPage() {
  const { t, lang } = useI18n();
  const events = usePublicEvents();
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const sport = params.get("sport") ?? "";
  const rows = (events.data ?? []).filter((event) => {
    const hay = `${event.title} ${event.venueName} ${event.sport}`.toLowerCase();
    return (!q || hay.includes(q.toLowerCase())) && (!sport || event.sport === sport);
  });
  const sports = [...new Set((events.data ?? []).map((event) => event.sport))];
  return (
    <PublicShell>
      <h1 className="font-display text-3xl uppercase text-[var(--brand-gold)]">{t("events.upcoming")}</h1>
      <form className="mt-4 flex flex-wrap gap-3" action="/tickets/events">
        <label className="text-sm">
          <span className="mb-1 block text-text-dim">{t("events.search")}</span>
          <input name="q" defaultValue={q} className="min-h-11 rounded-md border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-text-dim">{t("events.sport")}</span>
          <select name="sport" defaultValue={sport} className="min-h-11 rounded-md border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3">
            <option value="">{t("events.all")}</option>
            {sports.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <button className="gold-btn mt-6 min-h-11 rounded-md px-4" type="submit">{t("events.search")}</button>
      </form>
      <div className="mt-6 grid gap-4">
        {events.isLoading && <LoadingSkeleton />}
        {events.isError && <ErrorState message={apiErrorMessage(events.error, t("common.error"))} onRetry={() => void events.refetch()} />}
        {events.data && rows.length === 0 && <p className="text-sm text-text-dim">{t("events.empty")}</p>}
        {rows.map((event) => {
          const onSale = event.salesStatus === "ON_SALE" && new Date(event.startsAt).getTime() > Date.now();
          return (
          <article key={event.id} className="panel flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--brand-gold)]">{event.sport}</p>
              <h2 className="font-display text-2xl uppercase">{event.title}</h2>
              <p className="text-sm text-text-dim">{formatWhen(event.startsAt, lang)} · {event.venueName}</p>
              <p className="mt-1 text-sm">
                {event.salesStatus === "SOLD_OUT" ? t("events.soldout") : event.salesStatus === "CLOSED" || !onSale ? t("events.closed") : `${event.remaining} ${t("events.left")}`}
                {event.fromPriceBdt != null ? ` · ${t("events.from")} ${formatBdt(event.fromPriceBdt, lang)}` : ""}
              </p>
            </div>
            {onSale
              ? <Link to={`/tickets/events/${event.id}`} className="gold-btn inline-flex min-h-11 items-center rounded-md px-4">{t("events.book")}</Link>
              : <p className="text-sm text-text-dim">{event.salesStatus === "SOLD_OUT" ? t("events.soldout") : t("events.closed")}</p>}
          </article>
          );
        })}
      </div>
    </PublicShell>
  );
}
