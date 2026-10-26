import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { StatTile } from "../components/ui/StatTile";
import { StatusBadge, statusLabel } from "../components/ui/StatusBadge";
import { SelectInput } from "../components/ui/Field";
import { useEventBoard, useEventPacks } from "../api/events";
import { auditLine, timeAgo } from "../lib/audit";

interface DashboardSummary {
  zones: { total: number; totalCapacity: number; liveOccupancy: number };
  facilities: { total: number; byStatus: Record<string, number> };
  bookingsToday: number;
  activeMembers: number;
  gateEntriesToday: number;
  openServiceRequests: number;
  fleetUtilisation: number;
}

interface AuditLogRow {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  createdAt: string;
  user: { name: string };
}

function Ready({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] bg-surface-2 px-3 py-2 text-sm">
      <span className="min-w-0 truncate text-text-dim">{label}</span>
      <StatusBadge status={ok ? "Ready" : "Attention"} />
    </div>
  );
}

function OpsTile({
  title,
  value,
  detail,
  to,
  items,
}: {
  title: string;
  value: string | number;
  detail: string;
  to: string;
  items?: string[];
}) {
  return (
    <Link
      to={to}
      className="hub-card block p-4"
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">{title}</div>
      <div className="mt-1 font-display text-2xl text-text">{value}</div>
      <p className="mt-1 text-xs text-text-dim">{detail}</p>
      {items && items.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-text-dim">
          {items.slice(0, 3).map((item) => (
            <li key={item} className="truncate">
              {item}
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}

export function CommandCentre() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("event");

  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => (await api.get<DashboardSummary>("/dashboard/summary")).data,
  });

  const { data: feed } = useQuery({
    queryKey: ["audit-recent"],
    queryFn: async () => (await api.get<AuditLogRow[]>("/audit-log/recent", { params: { take: 12 } })).data,
    refetchInterval: 15000,
  });

  const { data: packs = [] } = useEventPacks();
  const activeId = selectedId && packs.some((p) => p.id === selectedId) ? selectedId : packs[0]?.id ?? null;
  const { data: board } = useEventBoard(activeId);

  const occupancyPct =
    summary && summary.zones.totalCapacity > 0
      ? Math.round((summary.zones.liveOccupancy / summary.zones.totalCapacity) * 100)
      : 0;

  function selectEvent(id: string) {
    const next = new URLSearchParams(params);
    if (id) next.set("event", id);
    else next.delete("event");
    setParams(next, { replace: true });
  }

  const eventQuery = activeId ? `&event=${activeId}` : "";

  return (
    <div>
      <header className="feature-hero mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Command</p>
        <h2 className="mt-1 font-display text-4xl font-semibold gold-foil">Event Operations</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-dim">
          Select a confirmed booking and run the full chain — venue, surface, access, visitors, protocol, hospitality, catering, parking and transport.
        </p>
      </header>

      <div className="stat-row mb-6" style={{ ["--n" as string]: 7, ["--ns" as string]: 4 }}>
        <StatTile label="Zones" value={summary?.zones.total ?? 0} tone="gold" />
        <StatTile label="Live Occupancy" value={occupancyPct} suffix="%" tone="teal" />
        <StatTile label="Facilities" value={summary?.facilities.total ?? 0} tone="blue" />
        <StatTile label="Bookings Today" value={summary?.bookingsToday ?? 0} />
        <StatTile label="Active Members" value={summary?.activeMembers ?? 0} />
        <StatTile label="Open Service Requests" value={summary?.openServiceRequests ?? 0} />
        <StatTile label="Fleet Utilisation" value={summary?.fleetUtilisation ?? 0} suffix="%" tone="blue" />
      </div>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-text">Event operations pack</h3>
          <p className="text-sm text-text-dim">A confirmed booking is the commercial and operational anchor.</p>
        </div>
        <SelectInput className="w-full min-w-0 sm:min-w-[280px] sm:w-auto" value={activeId ?? ""} onChange={(e) => selectEvent(e.target.value)}>
          {packs.length === 0 && <option value="">No confirmed event packs yet</option>}
          {packs.map((pack) => (
            <option key={pack.id} value={pack.id}>
              {`${pack.title} · ${statusLabel(pack.status)}`}
            </option>
          ))}
        </SelectInput>
      </div>

      {board ? (
        <div className="panel mb-6 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-display text-xl font-semibold text-text">{board.pack.title}</h4>
                <StatusBadge status={board.pack.status} />
                <StatusBadge status={board.booking.status} />
                <StatusBadge status={board.booking.paymentStatus} />
              </div>
              <p className="mt-1 text-sm text-text-dim">
                {board.booking.facility.name} · {new Date(board.booking.date).toLocaleDateString()} ·{" "}
                {board.booking.timeSlotStart}–{board.booking.timeSlotEnd} · expected {board.pack.expectedCount}
              </p>
            </div>
            <Link to={`/bookings`} className="text-sm text-gold hover:text-gold-soft">
              Open booking
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-6">
            <Ready ok={board.readiness.venueReady} label="Venue" />
            <Ready ok={board.readiness.surfaceReady} label="Surface" />
            <Ready ok={board.readiness.accessOnline} label="Access" />
            <Ready ok={board.readiness.hospitalityReady} label="Hospitality" />
            <Ready ok={board.readiness.fnbReady} label="F&B" />
            <Ready ok={board.readiness.transportReady} label="Transport" />
          </div>
        </div>
      ) : (
        <p className="mb-6 text-sm text-text-dim">Confirm a booking to open its operational event pack.</p>
      )}

      {board && (
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <OpsTile
            title="Booking"
            value={board.booking.status}
            detail={`${board.booking.customerName} · ${board.booking.type}`}
            to="/bookings"
            items={[`QR ${board.booking.qrConfirmationCode.slice(0, 8)}`, `৳${Number(board.booking.amount).toLocaleString()}`]}
          />
          <OpsTile
            title="Venue"
            value={board.booking.facility.name}
            detail={board.booking.facility.zone?.name ?? board.booking.facility.type}
            to="/facilities"
          />
          <OpsTile
            title="Surface"
            value={board.counts.closedSurfaces === 0 ? "Playable" : `${board.counts.closedSurfaces} closed`}
            detail={board.surfaces[0] ? `${board.surfaces[0].surfaceType} · ${board.surfaces[0].condition}` : "No surface linked"}
            to="/surfaces"
            items={board.surfaces.map((s) => `${s.surfaceType} · ${s.closureStatus}`)}
          />
          <OpsTile
            title="Equipment"
            value={board.equipment.length}
            detail="Allocated kits and assets"
            to="/surfaces"
            items={board.equipment.map((e) => `${e.name} · ${e.status}`)}
          />
          <OpsTile
            title="Access"
            value={`${board.counts.gates} gates`}
            detail={`${board.accessEvents.filter((e) => e.result === "Approved").length} grants today`}
            to="/gates"
            items={board.accessEvents.map((e) => `${e.gate?.name ?? "Gate"} · ${e.result}`)}
          />
          <OpsTile
            title="Visitors"
            value={`${board.counts.visitorsOnsite}/${board.counts.visitors}`}
            detail="Onsite / invited"
            to={`/visitors?feature=visitor-registration${eventQuery}`}
            items={board.visitors.map((v) => `${v.name} · ${v.status}`)}
          />
          <OpsTile
            title="VIP / Protocol"
            value={`${board.counts.vipsArrived}/${board.counts.vips}`}
            detail="Arrived / cases"
            to={`/vip?feature=protocol-planning${eventQuery}`}
            items={board.vipGuests.map((v) => `${v.name} · ${v.status}`)}
          />
          <OpsTile
            title="Hospitality"
            value={board.counts.openServiceRequests}
            detail="Open lounge service requests"
            to={`/lounges?feature=service-request-management${eventQuery}`}
            items={board.lounges.map((l) => `${l.name} · ${l.currentOccupancy}/${l.capacity}`)}
          />
          <OpsTile
            title="F&B"
            value={board.counts.orders}
            detail={`${board.outlets.filter((o) => o.status === "Open").length} outlets open`}
            to={`/outlets?feature=event-catering${eventQuery}`}
            items={board.outlets.map((o) => `${o.name} · ${o.status}`)}
          />
          <OpsTile
            title="Parking"
            value={`${board.counts.parkingOccupied}/${board.counts.parkingCapacity || 0}`}
            detail={`${board.counts.parkingReservations ?? 0} reserved for this event`}
            to="/parking"
            items={(board.parkingReservations ?? []).map((p) => `${p.parkingZone?.name ?? "Bay"} · ${p.status}`)}
          />
          <OpsTile
            title="Transport"
            value={`${board.counts.activeTrips} live`}
            detail={`${board.counts.trips} trips on this pack`}
            to={`/fleet?feature=trip-management${eventQuery}`}
            items={board.trips.map((t) => `${t.passengerRef} · ${t.status}`)}
          />
          <OpsTile
            title="Membership"
            value={board.member?.name ?? "Walk-in / group"}
            detail={board.member ? `${board.member.tier} · ${board.member.status}` : "No member linked"}
            to="/membership"
          />
          <OpsTile
            title="Tasks"
            value={board.counts.openTasks ?? 0}
            detail="Open operational actions"
            to="/tasks"
            items={(board.tasks ?? []).map((t) => `${t.title} · ${t.status}`)}
          />
          <OpsTile
            title="Incidents"
            value={board.counts.openIncidents ?? 0}
            detail="Active exceptions on this event"
            to="/tasks"
            items={(board.incidents ?? []).map((i) => `${i.title}`)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel p-4 lg:col-span-2">
          <h3 className="mb-3 font-display text-base font-semibold text-text">City-wide facility status</h3>
          <div className="space-y-2">
            {summary && Object.entries(summary.facilities.byStatus).length > 0 ? (
              Object.entries(summary.facilities.byStatus).map(([status, count]) => {
                const pct = summary.facilities.total ? Math.round((count / summary.facilities.total) * 100) : 0;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className="w-32 shrink-0">
                      <StatusBadge status={status} />
                    </div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-10 shrink-0 text-right text-sm text-text-dim">{count}</div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-text-dim">No facility data yet.</p>
            )}
          </div>
        </div>

        <div className="panel p-4">
          <h3 className="mb-3 font-display text-base font-semibold text-text">Live activity</h3>
          <div className="space-y-3">
            {feed && feed.length > 0 ? (
              feed.map((row) => (
                <div key={row.id} className="border-b border-border-soft pb-2 text-sm last:border-0 last:pb-0">
                  <div className="text-text">
                    {auditLine(row.entityType, row.action)}
                  </div>
                  <div className="text-xs text-text-dimmer">
                    {row.user?.name ?? "System"} · {timeAgo(row.createdAt)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-dim">No activity recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
