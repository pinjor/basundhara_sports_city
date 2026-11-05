import { useMemo, useState } from "react";
import { BookingType } from "@bsc/shared";
import { useCreateBooking } from "../../api/bookings";
import { useBookableFacilities, useDaySlots, useGuestHold, useGuestPay, type BookableFacility, type DaySlot, type SessionHold } from "../../api/sessionBookings";
import { TicketQr } from "../tickets/TicketQr";
import { Button } from "../ui/Button";
import { ErrorState, LoadingSkeleton } from "../ui/States";
import { apiErrorMessage } from "../../lib/apiError";
import { useI18n } from "../../lib/i18n";
import { formatBdt } from "../../lib/money";
import { rememberOrder } from "../../pages/tickets/orderMemory";

const DAYS = 7;

function isoDay(offset: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dayChip(iso: string, lang: "en" | "bn"): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", { weekday: "short", day: "numeric", month: "short" }).format(
    new Date(year, month - 1, day),
  );
}

interface Props {
  mode: "public" | "staff";
  onStaffCreated?: () => void;
}

export function SessionBookingFlow({ mode, onStaffCreated }: Props) {
  const { t, lang } = useI18n();
  const facilities = useBookableFacilities();
  const createStaff = useCreateBooking();
  const guestHold = useGuestHold();
  const [step, setStep] = useState(0);
  const [facility, setFacility] = useState<BookableFacility | null>(null);
  const [date, setDate] = useState(isoDay(0));
  const [slot, setSlot] = useState<DaySlot | null>(null);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<string>(BookingType.PUBLIC);
  const [terms, setTerms] = useState(false);
  const [method, setMethod] = useState("CARD");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [hold, setHold] = useState<SessionHold | null>(null);
  const [error, setError] = useState<string | null>(null);
  const slots = useDaySlots(facility?.id ?? null, date);
  const pay = useGuestPay(hold?.id ?? "");
  const days = useMemo(() => Array.from({ length: DAYS }, (_, index) => isoDay(index)), []);

  const titles = [t("session.venue"), t("session.time"), t("session.review"), t("session.pass")];
  const last = mode === "staff" ? 2 : 3;

  function back() {
    if (step === 0) return;
    if (step === 2 && hold && mode === "public") {
      setHold(null);
      return;
    }
    setStep((current) => current - 1);
  }

  async function continueFromReview() {
    setError(null);
    if (!facility || !slot) return;
    if (mode === "staff") {
      if (!name.trim()) {
        setError(t("session.needName"));
        return;
      }
      try {
        await createStaff.mutateAsync({
          facilityId: facility.id,
          customerName: name.trim(),
          type,
          date,
          timeSlotStart: slot.timeSlotStart,
          timeSlotEnd: slot.timeSlotEnd,
          amount: slot.price,
        });
        onStaffCreated?.();
      } catch (err) {
        setError(apiErrorMessage(err, t("common.error")));
      }
      return;
    }
    if (!/^01[3-9]\d{8}$/.test(mobile)) {
      setError(lang === "bn" ? "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)।" : "Enter a Bangladesh mobile number (01XXXXXXXXX).");
      return;
    }
    if (!terms) return;
    try {
      const next = await guestHold.mutateAsync({
        slotId: slot.id,
        date,
        buyerName: name.trim(),
        buyerMobile: mobile,
        buyerEmail: email.trim(),
        termsAccepted: true,
      });
      rememberOrder(next.id, mobile);
      setHold(next);
    } catch (err) {
      setError(apiErrorMessage(err, t("common.error")));
      void slots.refetch();
    }
  }

  async function payHold() {
    if (!hold) return;
    setError(null);
    try {
      const next = await pay.mutateAsync({ buyerMobile: mobile, method, simulateFailure });
      rememberOrder(next.id, mobile);
      setHold(next);
      if (next.status === "Confirmed") setStep(3);
      else setError(t("checkout.retry"));
    } catch (err) {
      setError(apiErrorMessage(err, t("common.error")));
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--brand-gold)]">{t("session.step").replace("{n}", String(step + 1)).replace("{total}", String(last + 1))} · {titles[step]}</p>
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: last + 1 }, (_, index) => (
          <span key={index} className={`h-1.5 min-w-0 flex-1 rounded-full ${index <= step ? "bg-[var(--brand-gold)]" : "bg-[var(--border-strong)]"}`} />
        ))}
      </div>

      {step === 0 && (
        <section>
          <h2 className="font-display text-2xl uppercase">{t("session.pickVenue")}</h2>
          {facilities.isLoading && <LoadingSkeleton />}
          {facilities.isError && <ErrorState message={apiErrorMessage(facilities.error, t("common.error"))} onRetry={() => void facilities.refetch()} />}
          {facilities.data?.length === 0 && <p className="mt-3 text-sm text-text-dim">{t("session.noVenues")}</p>}
          <ul className="mt-3 grid gap-2">
            {(facilities.data ?? []).map((item) => {
              const selected = facility?.id === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setFacility(item);
                      setSlot(null);
                    }}
                    className={`flex min-h-14 w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${selected ? "border-[var(--brand-gold)] bg-[var(--hover-bg)]" : "border-[var(--border-strong)]"}`}
                  >
                    <span>
                      <span className="block font-medium">{item.name}</span>
                      <span className="block text-xs text-text-dim">{item.type}{item.zone?.name ? ` · ${item.zone.name}` : ""}</span>
                    </span>
                    {selected && <span className="text-[var(--brand-gold)]">✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {step === 1 && facility && (
        <section>
          <h2 className="font-display text-2xl uppercase">{facility.name}</h2>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-gold)]">{t("session.day")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {days.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setDate(item);
                  setSlot(null);
                }}
                className={`min-h-11 rounded-full px-3 text-sm ${item === date ? "gold-btn" : "border border-[var(--border-strong)]"}`}
              >
                {dayChip(item, lang)}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-gold)]">{t("session.slot")}</p>
          {slots.isLoading && <LoadingSkeleton rows={2} />}
          {slots.isError && <ErrorState message={apiErrorMessage(slots.error, t("common.error"))} onRetry={() => void slots.refetch()} />}
          {slots.data && slots.data.length === 0 && <p className="mt-2 text-sm text-text-dim">{t("session.noSlots")}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {(slots.data ?? []).map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={!item.available}
                onClick={() => setSlot(item)}
                className={`min-h-11 rounded-full px-3 text-sm ${
                  slot?.id === item.id
                    ? "gold-btn"
                    : item.available
                      ? "border border-[var(--border-strong)]"
                      : "cursor-not-allowed border border-[var(--border-subtle)] text-text-dim line-through"
                }`}
              >
                {item.available ? `${item.timeSlotStart}–${item.timeSlotEnd} · ${formatBdt(item.price, lang)}` : `${item.timeSlotStart} · ${t("session.taken")}`}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && facility && slot && !hold && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl uppercase">{t("session.review")}</h2>
          <div className="panel p-4 text-sm">
            <p className="font-medium">{facility.name}</p>
            <p className="text-text-dim">{dayChip(date, lang)} · {slot.timeSlotStart}–{slot.timeSlotEnd}</p>
            <p className="mt-2 font-display text-xl tabular-nums text-[var(--brand-gold)]">{formatBdt(slot.price, lang)}</p>
            <p className="mt-2 text-xs text-text-dim">{t("session.holdNote")}</p>
          </div>
          <label className="block text-sm">{t("details.name")}
            <input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3" />
          </label>
          {mode === "staff" && (
            <label className="block text-sm">{t("session.type")}
              <select value={type} onChange={(event) => setType(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3">
                {Object.values(BookingType).map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          )}
          {mode === "public" && (
            <>
              <label className="block text-sm">{t("details.mobile")}
                <input required inputMode="numeric" autoComplete="tel" value={mobile} onChange={(event) => setMobile(event.target.value)} placeholder="01XXXXXXXXX" className="mt-1 min-h-11 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3" />
              </label>
              <label className="block text-sm">{t("details.email")}
                <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3" />
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={terms} onChange={(event) => setTerms(event.target.checked)} />
                <span>{t("session.terms")}</span>
              </label>
            </>
          )}
        </section>
      )}

      {step === 2 && hold && mode === "public" && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl uppercase">{t("checkout.title")}</h2>
          <p className="rounded-md border border-[var(--status-warning)] px-3 py-2 text-sm text-[var(--status-warning)]">{t("checkout.sandbox")}</p>
          <p className="text-sm">{hold.facility.name} · {hold.timeSlotStart}–{hold.timeSlotEnd}</p>
          <p className="font-display text-2xl tabular-nums">{formatBdt(hold.amount, lang)}</p>
          <p className="text-sm" aria-live="polite">{t("session.holdEnds")}</p>
          <fieldset className="space-y-2">
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
        </section>
      )}

      {step === 3 && hold?.qrCode && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl uppercase">{t("session.pass")}</h2>
          <TicketQr value={hold.qrCode} />
          <p className="text-sm">{hold.facility.name}</p>
          <p className="text-sm text-text-dim">{dayChip(hold.date, lang)} · {hold.timeSlotStart}–{hold.timeSlotEnd}</p>
          <p className="text-sm">{t("ticket.bright")}</p>
        </section>
      )}

      {error && <p className="text-sm text-[var(--status-danger)]" role="alert">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {step > 0 && step < 3 && <Button type="button" variant="secondary" onClick={back}>{t("session.back")}</Button>}
        {step === 0 && <Button type="button" disabled={!facility} onClick={() => setStep(1)}>{t("seats.continue")}</Button>}
        {step === 1 && <Button type="button" disabled={!slot} onClick={() => setStep(2)}>{t("seats.continue")}</Button>}
        {step === 2 && !hold && (
          <Button type="button" disabled={createStaff.isPending || guestHold.isPending || (mode === "public" && !terms)} onClick={() => void continueFromReview()}>
            {createStaff.isPending || guestHold.isPending
              ? t("common.loading")
              : mode === "staff"
                ? t("session.create")
                : t("session.payAmount").replace("{amount}", formatBdt(slot?.price ?? 0, lang))}
          </Button>
        )}
        {step === 2 && hold && (
          <Button type="button" disabled={pay.isPending} onClick={() => void payHold()}>
            {pay.isPending ? t("checkout.processing") : t("checkout.pay")}
          </Button>
        )}
      </div>
    </div>
  );
}
