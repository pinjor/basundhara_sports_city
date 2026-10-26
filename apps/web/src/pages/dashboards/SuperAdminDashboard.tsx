import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FacilityStatus } from "@bsc/shared";
import { api } from "../../lib/api";
import { auditLine, greeting, timeAgo } from "../../lib/audit";
import { useAuthStore } from "../../store/auth";
import { useEventBoard, useEventPacks, type EventBoard } from "../../api/events";
import { Ico } from "./icons";
import { Badge, Card, Donut, Kpi, Pick, Quick, Ring, ViewAll } from "./widgets";

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
  user: { name: string } | null;
}

const DESKS = [
  { label: "Executive Overview", note: "Board-level view", icon: "crown", to: "/chairman", img: "/dash/chair-hero.jpg" },
  { label: "Revenue & Finance", note: "Income, costs, budgets", icon: "wallet", to: "/chairman/revenue", img: "/dash/chair-strip.jpg" },
  { label: "People & HR", note: "Staff, leave, hiring", icon: "users", to: "/chairman/hr", img: "/dash/hero-hr.jpg" },
  { label: "Booking & Ticketing", note: "Venues, members, tickets", icon: "ticket", to: "/chairman/booking", img: "/dash/hero-booking.jpg" },
  { label: "Security Centre", note: "Cameras, incidents, gates", icon: "shield", to: "/security", img: "/dash/hero-security.jpg" },
  { label: "Event Operations", note: "Live event readiness", icon: "activity", to: "/?view=events", img: "/dash/ev-football.jpg" },
];

const STATUS_COLORS: Record<string, string> = {
  [FacilityStatus.AVAILABLE]: "#22c97a",
  [FacilityStatus.IN_USE]: "#f2b81d",
  [FacilityStatus.RESERVED]: "#3f97f4",
  [FacilityStatus.MAINTENANCE]: "#f0444a",
};

const READY: [keyof EventBoard["readiness"], string][] = [
  ["venueReady", "Venue"],
  ["surfaceReady", "Surface"],
  ["accessOnline", "Access"],
  ["hospitalityReady", "Hospitality"],
  ["fnbReady", "F&B"],
  ["transportReady", "Transport"],
];

function actionIcon(action: string): [string, string] {
  const a = action.toLowerCase();
  if (a.includes("create")) return ["sparkle", "green"];
  if (a.includes("delete")) return ["x", "red"];
  if (a.includes("rejected") || a.includes("inactive") || a.includes("frozen")) return ["x", "red"];
  if (a.includes("check_in") || a === "entry" || a.includes("approved") || a.includes("paid") || a.includes("cleared")) return ["check", "green"];
  if (a === "exit") return ["logout", "blue"];
  if (a.includes("update") || a.includes("status") || a === "renew") return ["wrench", "blue"];
  return ["activity", ""];
}

const n = (v: number | undefined) => (v === undefined ? "—" : v.toLocaleString());

export function SuperAdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => (await api.get<DashboardSummary>("/dashboard/summary")).data,
    refetchInterval: 30000,
  });
  const { data: feed = [], isLoading: feedLoading } = useQuery({
    queryKey: ["audit-recent"],
    queryFn: async () => (await api.get<AuditLogRow[]>("/audit-log/recent", { params: { take: 12 } })).data,
    refetchInterval: 15000,
  });
  const { data: packs = [], isLoading: packsLoading } = useEventPacks();
  const [packTitle, setPackTitle] = useState<string | null>(null);
  const pack = packs.find((p) => p.title === packTitle) ?? packs[0];
  const { data: board } = useEventBoard(pack?.id ?? null);

  const occupancy = summary && summary.zones.totalCapacity > 0 ? Math.round((summary.zones.liveOccupancy / summary.zones.totalCapacity) * 100) : 0;
  const byStatus = summary?.facilities.byStatus ?? {};
  const facTotal = summary?.facilities.total;
  const parts = Object.values(FacilityStatus).map((status) => {
    const count = byStatus[status] ?? 0;
    return { label: status, pct: facTotal ? (count / facTotal) * 100 : 0, color: STATUS_COLORS[status], value: `${count}` };
  });
  const readyCount = board ? READY.filter(([k]) => board.readiness[k]).length : 0;

  return (
    <div className="page p-adm">
      <header className="hero" style={{ backgroundImage: "linear-gradient(90deg, rgba(0,0,0,.9) 0%, rgba(0,0,0,.55) 36%, rgba(0,0,0,0) 66%), url(/dash/chair-hero.jpg)" }}>
        <p className="hello">{greeting()}, {user?.name?.split(" ")[0] ?? "Admin"}</p>
        <h2 className="gold">The Whole Sports City, One View</h2>
        <p className="sub">Every venue, desk and gate across Bashundhara Sports City</p>
        <div className="hero-brand">
          <b>Bashundhara Sports City</b>
          <small>People Build Champions</small>
        </div>
      </header>

      <div className="kpis c4">
        <Kpi variant="spark" icon="users" label="Occupancy Now" value={summary ? `${occupancy}%` : "—"} note={`${n(summary?.zones.liveOccupancy)} of ${n(summary?.zones.totalCapacity)} across ${n(summary?.zones.total)} zones`} to="/zones" />
        <Kpi variant="spark" icon="calendar" label="Bookings Today" value={n(summary?.bookingsToday)} note="Confirmed and pending, excluding cancelled" to="/bookings" />
        <Kpi variant="spark" icon="lock" label="Gate Entries Today" value={n(summary?.gateEntriesToday)} note="All gates combined" color="#3f97f4" to="/gates" />
        <Kpi variant="spark" icon="swim" label="Active Members" value={n(summary?.activeMembers)} note="Gym, pool and club members" color="#22c97a" to="/membership" />
      </div>

      <div className="row c-adm1">
        <Card title="Department Dashboards" sub="Open any desk with full admin access">
          <div className="adm-tiles">
            {DESKS.map((d) => (
              <Link key={d.to} to={d.to} className="adm-tile" style={{ backgroundImage: `url(${d.img})` }}>
                <Ico name={d.icon} />
                <b>{d.label}</b>
                <small>{d.note}</small>
              </Link>
            ))}
          </div>
        </Card>
        <Card title="Venue Health" sub={`${n(facTotal)} facilities · ${n(summary?.openServiceRequests)} open service requests`} extra={<ViewAll to="/facilities" />}>
          <Donut center={n(facTotal)} caption="Facilities" thick={16} parts={parts} />
          <div className="adm-stats">
            <span><small>Fleet in use</small><b>{summary ? `${summary.fleetUtilisation}%` : "—"}</b></span>
            <span><small>Service requests</small><b>{n(summary?.openServiceRequests)}</b></span>
            <span><small>Zones</small><b>{n(summary?.zones.total)}</b></span>
          </div>
        </Card>
      </div>

      <div className="row c-adm2">
        <Card
          title="Event Readiness"
          sub={board ? `${board.booking.facility.name} · ${new Date(board.booking.date).toLocaleDateString()} · ${board.booking.timeSlotStart}–${board.booking.timeSlotEnd}` : "Confirmed bookings with an event pack"}
          extra={packs.length > 1 ? <Pick options={packs.map((p) => p.title)} value={pack?.title ?? ""} onChange={setPackTitle} /> : undefined}
        >
          {board ? (
            <div className="adm-ev">
              <Ring pct={Math.round((readyCount / READY.length) * 100)} color={readyCount === READY.length ? "#22c97a" : "#f2b81d"} label={`${readyCount} of ${READY.length} ready`} to={`/?view=events&event=${board.pack.id}`} />
              <div className="adm-checks">
                {READY.map(([k, name]) => (
                  <span key={k} className="adm-check">
                    {name}
                    <Badge tone={board.readiness[k] ? "green" : "orange"}>{board.readiness[k] ? "Ready" : "Attention"}</Badge>
                  </span>
                ))}
              </div>
              <Link to={`/?view=events&event=${board.pack.id}`} className="view-all btn adm-open">Open event board</Link>
            </div>
          ) : (
            <p className="adm-empty">{packsLoading || packs.length ? "Loading event pack…" : "No event packs yet. Confirm a booking to open one."}</p>
          )}
        </Card>
        <Card title="Recent Activity" sub="Latest changes across every module" extra={<ViewAll to="/tasks" label="Tasks" />}>
          <ul className="list tight scroll adm-feed">
            {feed.map((row) => {
              const [icon, tone] = actionIcon(row.action);
              return (
                <li key={row.id}>
                  <span className={`li-ico ${tone}`}><Ico name={icon} /></span>
                  <div>
                    <b>{auditLine(row.entityType, row.action)}</b>
                    <small>{row.user?.name ?? "System"}</small>
                  </div>
                  <span className="when">{timeAgo(row.createdAt)}</span>
                </li>
              );
            })}
            {feed.length === 0 && <li className="empty">{feedLoading ? "Loading activity…" : "No activity yet."}</li>}
          </ul>
        </Card>
        <Card title="Quick Actions" sub="Common admin jobs">
          <div className="qa">
            <Quick icon="calCheck" label="Review Approvals" to="/approvals" />
            <Quick icon="calendar" label="Master Calendar" to="/calendar" />
            <Quick icon="check" label="Open Tasks" to="/tasks" />
            <Quick icon="scan" label="Gate Scan" to="/ticketing/scan" />
            <Quick icon="users" label="Visitors" to="/visitors" />
            <Quick icon="gear" label="Settings" to="/?view=settings" />
          </div>
        </Card>
      </div>

      <footer className="foot">
        <span>© {new Date().getFullYear()} Bashundhara Sports City. All rights reserved.</span>
        <b>Sports Empowers People</b>
      </footer>
    </div>
  );
}
