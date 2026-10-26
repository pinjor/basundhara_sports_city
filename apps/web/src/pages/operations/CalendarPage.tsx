import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { BookingDto, FacilityDto } from "@bsc/shared";
import { useBookings } from "../../api/bookings";
import { useFacilities } from "../../api/facilities";
import { useActiveFeature } from "../../hooks/useActiveFeature";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { StatTile } from "../../components/ui/StatTile";
import { Button } from "../../components/ui/Button";
import { ModuleHub } from "../../features/ModuleHub";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);
const HOUR_PX = 56;

const VIEWS = [
  { key: "day-view", label: "Day View", hint: "Hour board" },
  { key: "week-view", label: "Week View", hint: "Seven days" },
  { key: "resource-timeline", label: "Resource Timeline", hint: "By venue" },
] as const;

type CalendarMode = (typeof VIEWS)[number]["key"];

function dayKey(value: string | Date) {
  return String(value).slice(0, 10);
}

function parseDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function shiftIso(iso: string, days: number) {
  const d = parseDate(iso);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(iso: string) {
  const d = parseDate(iso);
  const weekday = d.getDay();
  const back = weekday === 0 ? 6 : weekday - 1;
  return shiftIso(iso, -back);
}

function minutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function prettyDay(iso: string, withWeekday = true) {
  return parseDate(iso).toLocaleDateString(undefined, {
    weekday: withWeekday ? "long" : undefined,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function modeFromFeature(key: string | null): CalendarMode {
  if (key === "week-view" || key === "resource-timeline") return key;
  return "day-view";
}

function toneClass(status: string) {
  if (status === "Confirmed") return "border-gold/50 bg-gold/20 text-gold";
  if (status === "Pending") return "border-gold/25 bg-gold/5 text-gold-soft";
  if (status === "Cancelled") return "border-red/30 bg-red/10 text-red";
  return "border-gold/15 bg-surface-2 text-text";
}

export function CalendarPage() {
  const { featureKey, feature } = useActiveFeature();
  const mode = modeFromFeature(featureKey);
  const { data: bookings = [], isLoading } = useBookings({});
  const { data: facilities = [] } = useFacilities({});
  const today = dayKey(new Date().toISOString());
  const [focus, setFocus] = useState(today);

  useEffect(() => {
    if (bookings.length === 0) return;
    const days = bookings.map((b) => dayKey(b.date)).sort();
    if (days.includes(focus)) return;
    const upcoming = days.find((d) => d >= today);
    setFocus(upcoming ?? days[0]);
  }, [bookings, today]);

  const weekStart = startOfWeek(focus);
  const weekDays = Array.from({ length: 7 }, (_, i) => shiftIso(weekStart, i));
  const dayBookings = bookings.filter((b) => dayKey(b.date) === focus && b.status === "Confirmed");
  const weekBookings = bookings.filter((b) => weekDays.includes(dayKey(b.date)) && b.status !== "Cancelled");
  const timelineBookings = bookings.filter((b) => dayKey(b.date) === focus);
  const confirmed = bookings.filter((b) => b.status === "Confirmed").length;

  if (!featureKey) return <ModuleHub />;

  const copy =
    mode === "week-view"
      ? { kicker: "Seven-day grid", lede: "Every venue hold this week — confirmed events sit in gold, pending holds stay muted." }
      : mode === "resource-timeline"
        ? { kicker: "Venue lanes", lede: "One row per playing space. Read clashes across the operating day before you confirm another slot." }
        : { kicker: "Operating day", lede: "Hour-by-hour board for a single day. Closed surfaces cannot take a confirmed slot." };

  return (
    <div>
      <header className="feature-hero mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            Master Calendar
            <span className="mx-2 text-gold/40">·</span>
            {copy.kicker}
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold gold-foil">{feature?.label ?? "Day View"}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-dim">{copy.lede}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {VIEWS.map((view) => (
            <Link
              key={view.key}
              to={`/calendar?feature=${view.key}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${
                mode === view.key ? "border-gold bg-gold/20 text-gold" : "border-gold/20 text-text-dim hover:border-gold/50 hover:text-gold"
              }`}
            >
              {view.label}
            </Link>
          ))}
        </div>
      </header>

      <div className="stat-row mb-6">
        <StatTile label="Bookings" value={bookings.length} tone="gold" />
        <StatTile label="Confirmed" value={confirmed} tone="teal" />
        <StatTile
          label={mode === "week-view" ? "This week" : mode === "resource-timeline" ? "On the lanes" : "Confirmed today"}
          value={mode === "week-view" ? weekBookings.length : mode === "resource-timeline" ? timelineBookings.length : dayBookings.length}
          tone="blue"
        />
        <StatTile label="Venues" value={facilities.length} />
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setFocus(shiftIso(focus, mode === "week-view" ? -7 : -1))}>
            Prev
          </Button>
          <Button variant="secondary" onClick={() => setFocus(today)}>
            Today
          </Button>
          <Button variant="secondary" onClick={() => setFocus(shiftIso(focus, mode === "week-view" ? 7 : 1))}>
            Next
          </Button>
        </div>
        <p className="font-display text-sm text-gold">
          {mode === "week-view" ? `${prettyDay(weekDays[0], false)} – ${prettyDay(weekDays[6], false)}` : prettyDay(focus)}
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-dim">Loading calendar…</p>
      ) : mode === "week-view" ? (
        <WeekGrid days={weekDays} bookings={weekBookings} focus={focus} onPick={setFocus} />
      ) : mode === "resource-timeline" ? (
        <ResourceTimeline day={focus} bookings={timelineBookings} facilities={facilities} />
      ) : (
        <DayBoard day={focus} bookings={dayBookings} />
      )}
    </div>
  );
}

function DayBoard({ day, bookings }: { day: string; bookings: BookingDto[] }) {
  const height = HOURS.length * HOUR_PX;
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-gold/15 px-5 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/70">Day board</p>
        <h3 className="mt-1 font-display text-lg text-text">{prettyDay(day)}</h3>
      </div>
      {bookings.length === 0 ? (
        <p className="px-5 py-10 text-sm text-text-dim">No bookings on this day. Step to a date with live holds, or open Bookings to create one.</p>
      ) : (
        <div className="relative grid grid-cols-[72px_1fr]" style={{ height }}>
          <div>
            {HOURS.map((hour) => (
              <div key={hour} className="border-b border-gold/10 px-3 text-[11px] text-text-dimmer" style={{ height: HOUR_PX }}>
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          <div className="relative border-l border-gold/15">
            {HOURS.map((hour) => (
              <div key={hour} className="border-b border-gold/10" style={{ height: HOUR_PX }} />
            ))}
            {bookings.map((booking) => {
              const start = minutes(booking.timeSlotStart);
              const end = minutes(booking.timeSlotEnd);
              const top = ((start - HOURS[0] * 60) / 60) * HOUR_PX;
              const heightPx = Math.max(HOUR_PX - 8, ((end - start) / 60) * HOUR_PX - 8);
              return (
                <Link
                  key={booking.id}
                  to={booking.eventPack ? `/?view=events&event=${booking.eventPack.id}` : "/bookings"}
                  className={`absolute left-3 right-3 overflow-hidden rounded-md border px-3 py-2 ${toneClass(booking.status)}`}
                  style={{ top: top + 4, height: heightPx }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{booking.customerName}</span>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="mt-0.5 truncate text-xs opacity-80">
                    {booking.timeSlotStart}–{booking.timeSlotEnd} · {booking.facility?.name ?? "Venue"} · {booking.type}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function WeekGrid({
  days,
  bookings,
  focus,
  onPick,
}: {
  days: string[];
  bookings: BookingDto[];
  focus: string;
  onPick: (day: string) => void;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-7">
      {days.map((day) => {
        const items = bookings.filter((b) => dayKey(b.date) === day).sort((a, b) => a.timeSlotStart.localeCompare(b.timeSlotStart));
        const active = day === focus;
        return (
          <section key={day} className={`panel min-h-[420px] p-3 ${active ? "!border-gold" : ""}`}>
            <button type="button" onClick={() => onPick(day)} className="mb-3 w-full text-left">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold/70">
                {parseDate(day).toLocaleDateString(undefined, { weekday: "short" })}
              </div>
              <div className={`font-display text-2xl ${active ? "text-gold" : "text-text"}`}>{parseDate(day).getDate()}</div>
              <div className="text-[11px] text-text-dimmer">{items.length} slots</div>
            </button>
            <div className="space-y-1.5">
              {items.length === 0 && <p className="text-[11px] text-text-dimmer">Clear</p>}
              {items.map((booking) => (
                <Link
                  key={booking.id}
                  to={booking.eventPack ? `/?view=events&event=${booking.eventPack.id}` : "/bookings"}
                  className={`block rounded-md border px-2 py-1.5 ${toneClass(booking.status)}`}
                >
                  <div className="text-[10px] text-gold/80">
                    {booking.timeSlotStart}–{booking.timeSlotEnd}
                  </div>
                  <div className="truncate text-xs font-medium">{booking.customerName}</div>
                  <div className="truncate text-[10px] opacity-70">{booking.facility?.name}</div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ResourceTimeline({ day, bookings, facilities }: { day: string; bookings: BookingDto[]; facilities: FacilityDto[] }) {
  const rows = useMemo(() => {
    const used = new Set(bookings.map((b) => b.facilityId));
    const booked = facilities.filter((f) => used.has(f.id));
    const rest = facilities.filter((f) => !used.has(f.id));
    const orphans = bookings
      .filter((b) => !facilities.some((f) => f.id === b.facilityId))
      .map((b) => ({ id: b.facilityId, name: b.facility?.name ?? "Unmapped venue", type: b.facility?.type ?? "Venue" }));
    const seen = new Set<string>();
    const extra = orphans.filter((o) => (seen.has(o.id) ? false : (seen.add(o.id), true)));
    return [...booked, ...extra, ...rest];
  }, [bookings, facilities]);

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-gold/15 px-5 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/70">Resource timeline</p>
        <h3 className="mt-1 font-display text-lg text-text">{prettyDay(day)} · venue lanes</h3>
      </div>
      <div className="thin-scroll overflow-x-auto">
        <div className="min-w-[1100px]">
          <div className="grid border-b border-gold/15" style={{ gridTemplateColumns: `200px repeat(${HOURS.length}, minmax(56px, 1fr))` }}>
            <div className="px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-gold/60">Venue</div>
            {HOURS.map((hour) => (
              <div key={hour} className="px-1 py-2 text-center text-[10px] text-text-dimmer">
                {String(hour).padStart(2, "0")}
              </div>
            ))}
          </div>
          {rows.map((facility) => {
            const items = bookings.filter((b) => b.facilityId === facility.id);
            return (
              <div key={facility.id} className="flex border-b border-gold/10" style={{ minHeight: 64 }}>
                <div className="w-[200px] shrink-0 border-r border-gold/10 px-3 py-2">
                  <div className="truncate text-sm text-text">{facility.name}</div>
                  <div className="truncate text-[11px] text-text-dimmer">{facility.type}</div>
                </div>
                <div className="relative min-w-0 flex-1">
                  <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${HOURS.length}, minmax(56px, 1fr))` }}>
                    {HOURS.map((hour) => (
                      <div key={hour} className="border-r border-gold/5" />
                    ))}
                  </div>
                  {items.map((booking) => {
                    const start = minutes(booking.timeSlotStart);
                    const end = minutes(booking.timeSlotEnd);
                    const leftPct = ((start - HOURS[0] * 60) / (HOURS.length * 60)) * 100;
                    const widthPct = Math.max(6, ((end - start) / (HOURS.length * 60)) * 100);
                    return (
                      <Link
                        key={booking.id}
                        to={booking.eventPack ? `/?view=events&event=${booking.eventPack.id}` : "/bookings"}
                        className={`absolute top-2 bottom-2 overflow-hidden rounded border px-2 py-1 ${toneClass(booking.status)}`}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      >
                        <div className="truncate text-[11px] font-medium">{booking.customerName}</div>
                        <div className="truncate text-[10px] opacity-70">
                          {booking.timeSlotStart}–{booking.timeSlotEnd}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {rows.length === 0 && <p className="px-5 py-10 text-sm text-text-dim">No venues on the register yet.</p>}
        </div>
      </div>
    </div>
  );
}
