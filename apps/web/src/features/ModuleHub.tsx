import { Link } from "react-router-dom";
import { BookingStatus } from "@bsc/shared";
import { ModuleTabs } from "../components/layout/ModuleTabs";

/** Modules with a full record manager (list, detail, edit) behind `?view=records`. */
export const RECORD_PAGES = new Set(["/zones", "/facilities", "/bookings", "/membership", "/gates", "/visitors", "/vip", "/lounges", "/outlets", "/parking", "/fleet", "/surfaces"]);
import { useActiveFeature } from "../hooks/useActiveFeature";
import { featurePreset } from "../lib/featurePresets";
import { featureStage } from "./featureStage";
import { resolveFlow } from "./flows";
import { StatTile } from "../components/ui/StatTile";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useZones } from "../api/zones";
import { useFacilities } from "../api/facilities";
import { useBookings } from "../api/bookings";
import { useMembers } from "../api/members";
import { useGates, useRecentAccessLog } from "../api/gates";
import { useVisitors } from "../api/visitors";
import { useVipGuests } from "../api/vipGuests";
import { useLounges, useServiceRequests } from "../api/lounges";
import { useOrders, useOutlets } from "../api/outlets";
import { useParkingZones } from "../api/parking";
import { useFleetVehicles, useTrips } from "../api/fleet";
import { useEquipment, useSurfaces } from "../api/surfaces";
import { useOpsTasks } from "../api/operations";

const HERO: Record<string, { kicker: string; lede: string }> = {
  "/zones": { kicker: "Campus fabric", lede: "The live map of Bashundhara Sports City — complexes, buildings, routes and restricted ground." },
  "/facilities": { kicker: "Playable estate", lede: "Stadiums, pitches, courts, pools and rooms with hours, capacity and availability." },
  "/surfaces": { kicker: "Grounds & kits", lede: "What is playable, what is recovering, and which equipment is on the field." },
  "/bookings": { kicker: "Reservation diary", lede: "Holds, confirmed events and settlement across every bookable space." },
  "/membership": { kicker: "Member roll", lede: "Tiers, access, freeze and check-in for recreation and academy." },
  "/gates": { kicker: "Access control", lede: "Readers, credentials and the grant/deny log for every gate on campus." },
  "/visitors": { kicker: "Reception", lede: "Expected guests, on-site muster and expired passes." },
  "/vip": { kicker: "Protocol", lede: "VIP and VVIP cases from invitation through departure." },
  "/lounges": { kicker: "Hospitality", lede: "Lounge occupancy and service requests against live events." },
  "/outlets": { kicker: "Food & beverage", lede: "Kitchens, concessions and tickets from the pass to the table." },
  "/parking": { kicker: "Vehicle estate", lede: "Bays, reservations and plate sessions by guest type." },
  "/fleet": { kicker: "Movement control", lede: "Buggies, shuttles and VIP cars — pick a desk. Each one opens a different live set." },
  "/calendar": { kicker: "Availability", lede: "Choose how you want to read the diary — a day, a week, or venue lanes." },
  "/tasks": { kicker: "Work queue", lede: "Open jobs versus event-linked operations. They are not the same list." },
  "/approvals": { kicker: "Decision inbox", lede: "Standard holds and senior escalations, split on purpose." },
};

function metric(path: string, featureKey: string, ctx: HubCtx): { value: number; unit: string } {
  const preset = featurePreset(featureKey);
  const flow = resolveFlow(featureKey, path);

  if (path === "/calendar") {
    if (featureKey === "day-view") return { value: ctx.bookings.filter((b) => b.status === "Confirmed").length, unit: "confirmed" };
    if (featureKey === "week-view") return { value: ctx.bookings.filter((b) => b.status !== "Cancelled").length, unit: "in diary" };
    return { value: ctx.facilities.length, unit: "venues" };
  }
  if (path === "/tasks") {
    if (featureKey === "event-work-queue") return { value: ctx.tasks.filter((t) => t.eventPack).length, unit: "event jobs" };
    return { value: ctx.tasks.filter((t) => t.status !== "Done").length, unit: "open" };
  }
  if (path === "/approvals") {
    if (featureKey === "escalations") return { value: ctx.bookings.filter((b) => b.status === "Pending" && (b.type === "Team" || b.type === "Corporate" || Number(b.amount) >= 10000)).length, unit: "escalations" };
    return { value: ctx.bookings.filter((b) => b.status === "Pending").length, unit: "pending" };
  }

  if (path === "/fleet") {
    if (preset.type) return { value: ctx.vehicles.filter((v) => v.type === preset.type).length, unit: `${preset.type}s` };
    if (preset.status) return { value: ctx.vehicles.filter((v) => v.status === preset.status).length, unit: preset.status.toLowerCase() };
    if (featureKey.includes("trip") || featureKey.includes("route") || featureKey.includes("schedul") || featureKey.includes("passenger") || featureKey.includes("event-transport") || featureKey.includes("gps") || featureKey.includes("location") || featureKey.includes("analytic")) {
      return { value: ctx.trips.filter((t) => t.status !== "Completed").length, unit: "live trips" };
    }
    if (featureKey.includes("driver")) return { value: ctx.vehicles.filter((v) => !!v.driverName).length, unit: "drivers" };
    return { value: ctx.vehicles.length, unit: "vehicles" };
  }
  if (path === "/parking") {
    if (preset.type) return { value: ctx.parking.filter((z) => z.type === preset.type).length, unit: `${preset.type} zones` };
    return { value: ctx.parking.reduce((s, z) => s + z.occupied, 0), unit: "occupied bays" };
  }
  if (path === "/facilities" || path === "/zones") {
    if (flow.kind === "zone-map") return { value: ctx.zones.filter((z) => z.status === "Operational").length, unit: "live zones" };
    if (preset.type) {
      const facilities = ctx.facilities.filter((f) => f.type === preset.type);
      const zones = ctx.zones.filter((z) => z.type === preset.type);
      return { value: facilities.length || zones.length, unit: preset.type };
    }
    return { value: path === "/zones" ? ctx.zones.length : ctx.facilities.length, unit: "records" };
  }
  if (path === "/bookings") {
    if (preset.type) return { value: ctx.bookings.filter((b) => b.type === preset.type).length, unit: preset.type };
    if (preset.status) return { value: ctx.bookings.filter((b) => b.status === preset.status).length, unit: preset.status };
    return { value: ctx.bookings.length, unit: "bookings" };
  }
  if (path === "/membership") {
    if (preset.tier) return { value: ctx.members.filter((m) => m.tier === preset.tier).length, unit: preset.tier };
    if (preset.status) return { value: ctx.members.filter((m) => m.status === preset.status).length, unit: preset.status };
    return { value: ctx.members.filter((m) => m.status === "Active").length, unit: "active" };
  }
  if (path === "/gates") {
    if (preset.type) return { value: ctx.gates.filter((g) => g.type === preset.type).length, unit: `${preset.type} gates` };
    if (featureKey.includes("log") || featureKey.includes("scan") || featureKey.includes("qr") || featureKey.includes("rfid") || featureKey.includes("bio")) {
      return { value: ctx.accessLog.length, unit: "scans" };
    }
    return { value: ctx.gates.filter((g) => g.status === "Online").length, unit: "online" };
  }
  if (path === "/visitors") {
    if (preset.category) return { value: ctx.visitors.filter((v) => v.category === preset.category).length, unit: preset.category };
    if (featureKey.includes("check-out") || featureKey.includes("history")) return { value: ctx.visitors.filter((v) => !!v.checkOutTime).length, unit: "departed" };
    if (featureKey.includes("check-in") || featureKey.includes("reception")) return { value: ctx.visitors.filter((v) => !v.checkInTime).length, unit: "expected" };
    return { value: ctx.visitors.filter((v) => v.checkInTime && !v.checkOutTime).length, unit: "on site" };
  }
  if (path === "/vip") {
    if (featureKey.includes("depart")) return { value: ctx.vips.filter((v) => v.status === "Departed").length, unit: "departed" };
    if (featureKey.includes("arriv") || featureKey.includes("airport")) return { value: ctx.vips.filter((v) => v.status === "Expected" || v.status === "Scheduled").length, unit: "arrivals" };
    return { value: ctx.vips.length, unit: "protocol cases" };
  }
  if (path === "/lounges") {
    if (featureKey.includes("service") || featureKey.includes("refresh") || featureKey.includes("beverage") || featureKey.includes("cater")) {
      return { value: ctx.requests.filter((r) => r.status !== "Delivered").length, unit: "open requests" };
    }
    return { value: ctx.lounges.reduce((s, l) => s + l.currentOccupancy, 0), unit: "seated" };
  }
  if (path === "/outlets") {
    if (flow.kind === "order-flow") return { value: ctx.orders.filter((o) => o.status !== "Delivered").length, unit: "kitchen tickets" };
    return { value: ctx.outlets.length, unit: "outlets" };
  }
  if (path === "/surfaces") {
    if (featureKey.includes("equipment") || featureKey.includes("kit") || featureKey.includes("pool-equipment") || featureKey.includes("gym-equipment")) {
      return { value: ctx.kits.length, unit: "kits" };
    }
    return { value: ctx.surfaces.filter((s) => s.closureStatus !== "Open").length, unit: "closed surfaces" };
  }
  if (path === "/tasks") {
    return { value: ctx.tasks.filter((t) => t.status !== "Done").length, unit: "open" };
  }
  if (path === "/bookings" || path === "/approvals") {
    return { value: ctx.bookings.filter((b) => b.status === "Pending").length, unit: "pending" };
  }
  return { value: 0, unit: "live" };
}

interface HubCtx {
  zones: { id: string; name: string; type: string; status: string; liveOccupancy: number; capacity: number }[];
  facilities: { id: string; name: string; type: string; status: string }[];
  bookings: { id: string; customerName: string; type: string; status: string; date: string; timeSlotStart: string; amount?: string | number; facility?: { name?: string } }[];
  members: { id: string; name: string; tier: string; status: string }[];
  gates: { id: string; name: string; type: string; status: string }[];
  accessLog: { id: string }[];
  visitors: { id: string; name: string; category: string; status: string; checkInTime: string | null; checkOutTime: string | null }[];
  vips: { id: string; name: string; status: string; classification: string }[];
  lounges: { id: string; name: string; currentOccupancy: number; capacity: number }[];
  requests: { id: string; status: string; item: string }[];
  outlets: { id: string; name: string; type: string; status: string }[];
  orders: { id: string; status: string }[];
  parking: { id: string; name: string; type: string; occupied: number; capacity: number }[];
  vehicles: { id: string; type: string; status: string; driverName: string | null; currentLocation: string | null }[];
  trips: { id: string; passengerRef: string; status: string; fromLocation: string; toLocation: string }[];
  surfaces: { id: string; closureStatus: string; surfaceType: string }[];
  kits: { id: string; name: string }[];
  tasks: { id: string; title: string; status: string; area: string; eventPack?: { id: string } | null }[];
}

const BUSY_SHARE = 0.8;
const loadStatus = (used: number, capacity: number) => (capacity > 0 && used >= capacity ? "Full" : capacity > 0 && used / capacity >= BUSY_SHARE ? "Busy" : "Available");

function snapshot(path: string, ctx: HubCtx): { title: string; meta: string; status: string }[] {
  if (path === "/fleet") {
    return [
      ...ctx.trips.slice(0, 3).map((t) => ({ title: t.passengerRef, meta: `${t.fromLocation} → ${t.toLocation}`, status: t.status })),
      ...ctx.vehicles.slice(0, 3).map((v) => ({ title: `${v.type} · ${v.driverName ?? "Unassigned"}`, meta: v.currentLocation ?? "Depot", status: v.status })),
    ].slice(0, 6);
  }
  if (path === "/bookings" || path === "/approvals" || path === "/calendar") {
    const day = (b: HubCtx["bookings"][number]) => `${String(b.date).slice(0, 10)} ${b.timeSlotStart}`;
    const today = new Date().toISOString().slice(0, 10);
    const pool = ctx.bookings.filter((b) => (path === "/approvals" ? b.status === BookingStatus.PENDING : b.status !== BookingStatus.CANCELLED));
    const upcoming = pool.filter((b) => day(b) >= today).sort((a, b) => day(a).localeCompare(day(b)));
    return (upcoming.length ? upcoming : pool).slice(0, 6).map((b) => ({ title: b.customerName, meta: `${b.facility?.name ?? "Venue"} · ${String(b.date).slice(0, 10)} ${b.timeSlotStart}`, status: b.status }));
  }
  if (path === "/vip") return ctx.vips.slice(0, 6).map((v) => ({ title: v.name, meta: v.classification, status: v.status }));
  if (path === "/visitors") return ctx.visitors.slice(0, 6).map((v) => ({ title: v.name, meta: v.category, status: v.status }));
  if (path === "/gates") return ctx.gates.slice(0, 6).map((g) => ({ title: g.name, meta: g.type, status: g.status }));
  if (path === "/facilities") return ctx.facilities.slice(0, 6).map((f) => ({ title: f.name, meta: f.type, status: f.status }));
  if (path === "/zones") return ctx.zones.slice(0, 6).map((z) => ({ title: z.name, meta: `${z.type} · ${z.liveOccupancy}/${z.capacity}`, status: z.status }));
  if (path === "/membership") return ctx.members.slice(0, 6).map((m) => ({ title: m.name, meta: m.tier, status: m.status }));
  if (path === "/lounges") return ctx.lounges.slice(0, 6).map((l) => ({ title: l.name, meta: `${l.currentOccupancy}/${l.capacity} guests`, status: loadStatus(l.currentOccupancy, l.capacity) }));
  if (path === "/outlets") return ctx.outlets.slice(0, 6).map((o) => ({ title: o.name, meta: o.type, status: o.status }));
  if (path === "/parking") return ctx.parking.slice(0, 6).map((z) => ({ title: z.name, meta: `${z.type} · ${z.occupied}/${z.capacity}`, status: loadStatus(z.occupied, z.capacity) }));
  if (path === "/surfaces") return ctx.surfaces.slice(0, 6).map((s) => ({ title: s.surfaceType, meta: "Playing surface", status: s.closureStatus }));
  if (path === "/tasks") return ctx.tasks.filter((t) => t.status !== "Done").slice(0, 6).map((t) => ({ title: t.title, meta: t.area, status: t.status }));
  return [];
}

const HUB_LISTS: Record<string, [string, (ctx: HubCtx) => { status: string }[]]> = {
  "/gates": ["Gates", (c) => c.gates],
  "/visitors": ["Visitors", (c) => c.visitors],
  "/vip": ["VIP guests", (c) => c.vips],
  "/facilities": ["Venues", (c) => c.facilities],
  "/membership": ["Members", (c) => c.members],
  "/outlets": ["Outlets", (c) => c.outlets],
  "/lounges": ["Service requests", (c) => c.requests],
  "/parking": ["Parking zones", (c) => c.parking.map((z) => ({ status: loadStatus(z.occupied, z.capacity) }))],
  "/surfaces": ["Surfaces", (c) => c.surfaces.map((s) => ({ status: s.closureStatus }))],
};

const STATUS_TONES = ["teal", "blue", "red"] as const;

function statusTiles(label: string, rows: { status: string }[]) {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3);
  return [{ label, value: rows.length, tone: "gold" as const }, ...top.map(([status, value], i) => ({ label: status, value, tone: STATUS_TONES[i] }))];
}

function kpisFor(path: string, ctx: HubCtx) {
  if (path === "/fleet") {
    return [
      { label: "Vehicles", value: ctx.vehicles.length, tone: "gold" as const },
      { label: "Available", value: ctx.vehicles.filter((v) => v.status === "Available").length, tone: "teal" as const },
      { label: "Live trips", value: ctx.trips.filter((t) => t.status !== "Completed").length, tone: "blue" as const },
      { label: "VIP cars", value: ctx.vehicles.filter((v) => v.type === "VIP Car").length },
    ];
  }
  if (path === "/bookings" || path === "/calendar" || path === "/approvals") {
    return [
      { label: "Bookings", value: ctx.bookings.length, tone: "gold" as const },
      { label: "Confirmed", value: ctx.bookings.filter((b) => b.status === "Confirmed").length, tone: "teal" as const },
      { label: "Pending", value: ctx.bookings.filter((b) => b.status === "Pending").length, tone: "blue" as const },
      { label: "Venues", value: ctx.facilities.length },
    ];
  }
  if (path === "/zones") {
    return [
      { label: "Locations", value: ctx.zones.length, tone: "gold" as const },
      { label: "On site", value: ctx.zones.reduce((s, z) => s + z.liveOccupancy, 0), tone: "teal" as const },
      { label: "Operational", value: ctx.zones.filter((z) => z.status === "Operational").length, tone: "blue" as const },
      { label: "Restricted", value: ctx.zones.filter((z) => z.status === "Restricted").length, tone: "red" as const },
    ];
  }
  if (path === "/tasks") {
    return [
      { label: "Tasks", value: ctx.tasks.length, tone: "gold" as const },
      { label: "Open", value: ctx.tasks.filter((t) => t.status !== "Done").length, tone: "blue" as const },
      { label: "Done", value: ctx.tasks.filter((t) => t.status === "Done").length, tone: "teal" as const },
      { label: "Event-linked", value: ctx.tasks.filter((t) => t.eventPack).length },
    ];
  }
  const list = HUB_LISTS[path];
  if (list) return statusTiles(list[0], list[1](ctx));
  return [
    { label: "Records", value: ctx.facilities.length + ctx.members.length + ctx.visitors.length, tone: "gold" as const },
    { label: "Venues", value: ctx.facilities.length, tone: "teal" as const },
    { label: "People", value: ctx.members.length + ctx.visitors.length + ctx.vips.length, tone: "blue" as const },
    { label: "Open work", value: ctx.tasks.filter((t) => t.status !== "Done").length },
  ];
}

export function ModuleHub() {
  const { module } = useActiveFeature();
  const path = module?.path ?? "";
  const { data: zones = [] } = useZones({});
  const { data: facilities = [] } = useFacilities({});
  const { data: bookings = [] } = useBookings({});
  const { data: members = [] } = useMembers({});
  const { data: gates = [] } = useGates({});
  const { data: accessLog = [] } = useRecentAccessLog();
  const { data: visitors = [] } = useVisitors({});
  const { data: vips = [] } = useVipGuests({});
  const { data: lounges = [] } = useLounges();
  const { data: requests = [] } = useServiceRequests();
  const { data: outlets = [] } = useOutlets({});
  const { data: orders = [] } = useOrders();
  const { data: parking = [] } = useParkingZones({});
  const { data: vehicles = [] } = useFleetVehicles();
  const { data: trips = [] } = useTrips();
  const { data: surfaces = [] } = useSurfaces();
  const { data: kits = [] } = useEquipment({});
  const { data: tasks = [] } = useOpsTasks();

  const ctx: HubCtx = {
    zones,
    facilities,
    bookings,
    members,
    gates,
    accessLog,
    visitors,
    vips,
    lounges,
    requests,
    outlets,
    orders,
    parking,
    vehicles,
    trips,
    surfaces,
    kits,
    tasks,
  };

  const hero = HERO[path] ?? { kicker: "Operations", lede: "Open a desk from the list below — each one is a different live set, not a renamed form." };
  const tiles = kpisFor(path, ctx);
  const live = snapshot(path, ctx);
  const features = module?.features ?? [];

  return (
    <div>
      <header className="feature-hero mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{hero.kicker}</p>
        <h2 className="mt-1 font-display text-4xl font-semibold gold-foil">{module?.label ?? "Module"}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-dim">{hero.lede}</p>
        <p className="mt-2 text-xs text-gold/70">{features.length} desks · click one to leave this overview</p>
        {module && RECORD_PAGES.has(path) && <div className="mt-4"><ModuleTabs path={path} /></div>}
      </header>

      <div className="stat-row mb-8" style={{ ["--n" as string]: tiles.length }}>
        {tiles.map((tile) => (
          <StatTile key={tile.label} label={tile.label} value={tile.value} tone={tile.tone} />
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/70">Desks</p>
              <h3 className="font-display text-xl text-text">Open a focused workspace</h3>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => {
              const stage = featureStage(feature.key, resolveFlow(feature.key, path).kind);
              const m = metric(path, feature.key, ctx);
              return (
                <Link key={feature.key} to={`${path}?feature=${feature.key}`} className="hub-card block rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold/70">{stage.kicker}</p>
                      <div className="mt-1 font-display text-lg text-text">{feature.label}</div>
                      <p className="mt-1 text-xs leading-relaxed text-text-dim">{stage.lede}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl text-gold">{m.value}</div>
                      <div className="text-[10px] uppercase tracking-wide text-gold/60">{m.unit}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <aside className="lg:col-span-4">
          <div className="action-rail rounded-xl p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/70">Now on the floor</p>
            <h3 className="mb-4 mt-1 font-display text-lg text-text">Live pulse</h3>
            {live.length === 0 ? (
              <p className="text-sm text-text-dim">No live records in this module yet.</p>
            ) : (
              <ul className="space-y-3">
                {live.map((item, i) => (
                  <li key={`${item.title}-${i}`} className="border-b border-gold/10 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm text-text">{item.title}</div>
                        <div className="text-xs text-text-dimmer">{item.meta}</div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
