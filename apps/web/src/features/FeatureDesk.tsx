import { StatusBadge } from "../components/ui/StatusBadge";
import { StatTile } from "../components/ui/StatTile";
import type { FlowKind } from "./flows";
import { AccessResult } from "@bsc/shared";
import type {
  AccessLogEntryDto,
  BookingDto,
  EquipmentDto,
  FacilityDto,
  FleetVehicleDto,
  GateDto,
  LoungeDto,
  MemberDto,
  OrderDto,
  OutletDto,
  ParkingZoneDto,
  ServiceRequestDto,
  SurfaceDto,
  TripDto,
  VIPGuestDto,
  VisitorDto,
  ZoneDto,
} from "@bsc/shared";

export interface DeskKpi {
  label: string;
  value: number;
  tone?: "gold" | "teal" | "blue" | "red" | "default";
}

export interface DeskRow {
  id: string;
  title: string;
  meta: string;
  status: string;
}

export interface DeskData {
  zones: ZoneDto[];
  facilities: FacilityDto[];
  bookings: BookingDto[];
  members: MemberDto[];
  gates: GateDto[];
  accessLog: AccessLogEntryDto[];
  visitors: VisitorDto[];
  vips: VIPGuestDto[];
  lounges: LoungeDto[];
  requests: ServiceRequestDto[];
  outlets: OutletDto[];
  orders: OrderDto[];
  parking: ParkingZoneDto[];
  vehicles: FleetVehicleDto[];
  trips: TripDto[];
  surfaces: SurfaceDto[];
  kits: EquipmentDto[];
}

function kpi(label: string, value: number, tone?: DeskKpi["tone"]): DeskKpi {
  return { label, value, tone };
}

function row(id: string, title: string, meta: string, status: string): DeskRow {
  return { id, title, meta, status };
}

export function buildFeatureDesk(kind: FlowKind, data: DeskData, type?: string, featureKey?: string): { kpis: DeskKpi[]; rows: DeskRow[] } {
  const {
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
  } = data;

  if (featureKey === "gps-tracking" || featureKey === "real-time-vehicle-location") {
    const moving = vehicles.filter((v) => v.status === "On Trip");
    return {
      kpis: [
        kpi("In motion", moving.length, "gold"),
        kpi("Last points", moving.filter((v) => !!v.currentLocation).length, "teal"),
        kpi("Idle fleet", vehicles.filter((v) => v.status === "Available").length, "blue"),
      ],
      rows: moving.map((v) => row(v.id, v.currentLocation ?? "Signal pending", `${v.type} · ${v.driverName ?? "Unassigned"}`, v.status)),
    };
  }
  if (featureKey === "trip-management" || featureKey === "vehicle-scheduling" || featureKey === "route-planning" || featureKey === "passenger-assignment") {
    return {
      kpis: [
        kpi("Trips", trips.length, "gold"),
        kpi("Live", trips.filter((t) => t.status !== "Completed").length, "blue"),
        kpi("Completed", trips.filter((t) => t.status === "Completed").length, "teal"),
      ],
      rows: trips.map((t) => row(t.id, t.passengerRef, `${t.fromLocation} → ${t.toLocation}`, t.status)),
    };
  }
  if (featureKey === "driver-management" || featureKey === "driver-assignment") {
    return {
      kpis: [
        kpi("Drivers", vehicles.filter((v) => !!v.driverName).length, "gold"),
        kpi("On trip", vehicles.filter((v) => v.status === "On Trip").length, "blue"),
        kpi("Unassigned", vehicles.filter((v) => !v.driverName).length, "red"),
      ],
      rows: vehicles.map((v) => row(v.id, v.driverName ?? "Unassigned", `${v.type} · ${v.currentLocation ?? "Depot"}`, v.status)),
    };
  }
  if (featureKey === "vehicle-maintenance") {
    const shop = vehicles.filter((v) => v.status === "Maintenance" || v.status === "Charging");
    return {
      kpis: [
        kpi("Workshop", shop.length, "red"),
        kpi("Charging", vehicles.filter((v) => v.status === "Charging").length, "blue"),
        kpi("Ready", vehicles.filter((v) => v.status === "Available").length, "teal"),
      ],
      rows: shop.map((v) => row(v.id, `${v.type} · ${v.driverName ?? "Workshop"}`, v.currentLocation ?? "Service bay", v.status)),
    };
  }

  switch (kind) {
    case "zone-setup":
    case "zone-map":
      return {
        kpis: [
          kpi("Locations", zones.length, "gold"),
          kpi("Operational", zones.filter((z) => z.status === "Operational").length, "teal"),
          kpi("Restricted", zones.filter((z) => z.status === "Restricted").length, "red"),
          kpi("On site now", zones.reduce((sum, z) => sum + z.liveOccupancy, 0), "blue"),
        ],
        rows: zones.map((z) => row(z.id, z.name, `${z.type} · ${z.building ?? "Campus"} · ${z.liveOccupancy}/${z.capacity}`, z.status)),
      };
    case "facility-setup":
    case "facility-status":
      return {
        kpis: [
          kpi(type ? type : "Spaces", facilities.length, "gold"),
          kpi("Available", facilities.filter((f) => f.status === "Available").length, "teal"),
          kpi("In use", facilities.filter((f) => f.status === "In Use").length, "blue"),
          kpi("Maintenance", facilities.filter((f) => f.status === "Maintenance").length, "red"),
        ],
        rows: facilities.map((f) =>
          row(f.id, f.name, `${f.type} · ${f.zone?.name ?? "Unzoned"} · ${f.operatingHoursStart}–${f.operatingHoursEnd}`, f.status),
        ),
      };
    case "booking-create":
    case "booking-advance":
    case "booking-pay":
      return {
        kpis: [
          kpi("Bookings", bookings.length, "gold"),
          kpi("Confirmed", bookings.filter((b) => b.status === "Confirmed").length, "teal"),
          kpi("Pending", bookings.filter((b) => b.status === "Pending").length, "blue"),
          kpi("Unpaid", bookings.filter((b) => b.paymentStatus !== "Paid").length, "red"),
        ],
        rows: bookings.map((b) =>
          row(b.id, b.customerName, `${b.facility?.name ?? "Venue"} · ${b.date} ${b.timeSlotStart}–${b.timeSlotEnd} · ${b.paymentStatus}`, b.status),
        ),
      };
    case "member-create":
    case "member-checkin":
    case "member-lifecycle":
      return {
        kpis: [
          kpi("Members", members.length, "gold"),
          kpi("Active", members.filter((m) => m.status === "Active").length, "teal"),
          kpi("Check-ins", members.reduce((sum, m) => sum + m.checkInCount, 0), "blue"),
          kpi("Frozen / expired", members.filter((m) => m.status !== "Active").length, "red"),
        ],
        rows: members.map((m) => row(m.id, m.name, `${m.tier} · ${m.email} · ${m.checkInCount} visits`, m.status)),
      };
    case "gate-setup":
    case "gate-toggle":
      return {
        kpis: [
          kpi("Gates", gates.length, "gold"),
          kpi("Online", gates.filter((g) => g.status === "Online").length, "teal"),
          kpi("Offline", gates.filter((g) => g.status !== "Online").length, "red"),
          kpi("Entries today", gates.reduce((sum, g) => sum + g.entriesToday, 0), "blue"),
        ],
        rows: gates.map((g) => row(g.id, g.name, `${g.type} · ${g.zone?.name ?? "Unmapped"} · ${g.entriesToday} entries`, g.status)),
      };
    case "gate-scan":
    case "gate-log":
      return {
        kpis: [
          kpi("Gates", gates.length, "gold"),
          kpi("Scans", accessLog.length, "blue"),
          kpi("Granted", accessLog.filter((e) => e.result === AccessResult.APPROVED).length, "teal"),
          kpi("Denied", accessLog.filter((e) => e.result === AccessResult.DENIED).length, "red"),
        ],
        rows:
          kind === "gate-log" || accessLog.length > 0
            ? accessLog.map((e) =>
                row(e.id, e.personRef, `${e.gate?.name ?? "Gate"} · ${e.method}${e.reason ? ` · ${e.reason}` : ""}`, e.result),
              )
            : gates.map((g) => row(g.id, g.name, `${g.type} · ${g.status}`, g.status)),
      };
    case "visitor-journey":
    case "visitor-checkin":
    case "visitor-checkout": {
      const expected = visitors.filter((v) => !v.checkInTime);
      const onSite = visitors.filter((v) => v.checkInTime && !v.checkOutTime);
      const list = kind === "visitor-checkout" ? onSite : kind === "visitor-checkin" ? expected : visitors;
      return {
        kpis: [
          kpi("Visitors", visitors.length, "gold"),
          kpi("Expected", expected.length, "blue"),
          kpi("On site", onSite.length, "teal"),
          kpi("Checked out", visitors.filter((v) => !!v.checkOutTime).length),
        ],
        rows: list.map((v) => row(v.id, v.name, `${v.category} · Host ${v.host} · ${v.purpose}`, v.status)),
      };
    }
    case "vip-journey":
      return {
        kpis: [
          kpi("Protocol cases", vips.length, "gold"),
          kpi("Expected", vips.filter((v) => v.status === "Expected").length, "blue"),
          kpi("Arrived", vips.filter((v) => v.status === "Arrived").length, "teal"),
          kpi("Departed", vips.filter((v) => v.status === "Departed").length),
        ],
        rows: vips.map((v) =>
          row(v.id, v.name, `${v.classification}${v.designation ? ` · ${v.designation}` : ""} · ${v.loungeAssignment ?? "No lounge"}`, v.status),
        ),
      };
    case "lounge-setup":
    case "lounge-party":
      return {
        kpis: [
          kpi("Lounges", lounges.length, "gold"),
          kpi("Guests inside", lounges.reduce((sum, l) => sum + l.currentOccupancy, 0), "teal"),
          kpi("Capacity", lounges.reduce((sum, l) => sum + l.capacity, 0), "blue"),
          kpi("Open", lounges.filter((l) => l.status === "Open").length),
        ],
        rows: lounges.map((l) => row(l.id, l.name, `${l.currentOccupancy}/${l.capacity} seated · ${l.zone?.name ?? "Hospitality"}`, l.status)),
      };
    case "service-request":
      return {
        kpis: [
          kpi("Requests", requests.length, "gold"),
          kpi("Pending", requests.filter((r) => r.status === "Pending").length, "blue"),
          kpi("Preparing", requests.filter((r) => r.status === "Preparing").length),
          kpi("Delivered", requests.filter((r) => r.status === "Delivered").length, "teal"),
        ],
        rows: requests.map((r) => row(r.id, r.item, `${r.partyRef} · ${r.lounge?.name ?? "Lounge"}`, r.status)),
      };
    case "outlet-setup":
      return {
        kpis: [
          kpi("Outlets", outlets.length, "gold"),
          kpi("Open", outlets.filter((o) => o.status === "Open").length, "teal"),
          kpi("Closed", outlets.filter((o) => o.status !== "Open").length),
        ],
        rows: outlets.map((o) => row(o.id, o.name, `${o.type} · ${o.zone?.name ?? "Unzoned"}`, o.status)),
      };
    case "order-flow":
      return {
        kpis: [
          kpi("Tickets", orders.length, "gold"),
          kpi("Live kitchen", orders.filter((o) => o.status !== "Delivered").length, "blue"),
          kpi("Delivered", orders.filter((o) => o.status === "Delivered").length, "teal"),
        ],
        rows: orders.map((o) =>
          row(o.id, o.items.map((i) => `${i.qty}× ${i.name}`).join(", ") || "Order", `${o.outlet?.name ?? "Outlet"} · ${o.amount}`, o.status),
        ),
      };
    case "parking-setup":
    case "parking-cycle":
      return {
        kpis: [
          kpi("Zones", parking.length, "gold"),
          kpi("Bays", parking.reduce((sum, z) => sum + z.capacity, 0), "blue"),
          kpi("Occupied", parking.reduce((sum, z) => sum + z.occupied, 0), "teal"),
          kpi("Free", parking.reduce((sum, z) => sum + Math.max(0, z.capacity - z.occupied), 0)),
        ],
        rows: parking.map((z) => row(z.id, z.name, `${z.type} · ${z.occupied}/${z.capacity} occupied`, z.occupied >= z.capacity ? "Full" : "Open")),
      };
    case "fleet-setup":
      return {
        kpis: [
          kpi(type ?? "Fleet", vehicles.length, "gold"),
          kpi("Available", vehicles.filter((v) => v.status === "Available").length, "teal"),
          kpi("On trip", vehicles.filter((v) => v.status === "On Trip").length, "blue"),
          kpi("Workshop", vehicles.filter((v) => v.status === "Maintenance" || v.status === "Charging").length, "red"),
        ],
        rows: vehicles.map((v) => row(v.id, `${v.type} · ${v.driverName ?? "Unassigned"}`, v.currentLocation ?? "Depot", v.status)),
      };
    case "trip-run": {
      const scoped = trips.filter((t) => !type || t.vehicle?.type === type);
      const live = scoped.filter((t) => t.status !== "Completed");
      return {
        kpis: [
          kpi(type ?? "Vehicles", vehicles.length, "gold"),
          kpi("Available", vehicles.filter((v) => v.status === "Available").length, "teal"),
          kpi("Live trips", live.length, "blue"),
          kpi("Completed", scoped.filter((t) => t.status === "Completed").length),
        ],
        rows: [
          ...vehicles.map((v) => row(v.id, `${v.type} · ${v.driverName ?? "Unassigned"}`, v.currentLocation ?? "Waiting at depot", v.status)),
          ...scoped.map((t) =>
            row(t.id, t.passengerRef, `${t.fromLocation} → ${t.toLocation}${t.vehicle?.type ? ` · ${t.vehicle.type}` : ""}`, t.status),
          ),
        ],
      };
    }
    case "surface-close":
      return {
        kpis: [
          kpi("Surfaces", surfaces.length, "gold"),
          kpi("Open", surfaces.filter((s) => s.closureStatus === "Open").length, "teal"),
          kpi("Closed", surfaces.filter((s) => s.closureStatus !== "Open").length, "red"),
        ],
        rows: surfaces.map((s) =>
          row(s.id, s.facility?.name ?? s.surfaceType, `${s.surfaceType} · moisture ${s.moisturePercent ?? "—"}%`, s.closureStatus),
        ),
      };
    case "equipment-flow":
      return {
        kpis: [
          kpi("Kits", kits.length, "gold"),
          kpi("Stock", kits.reduce((sum, k) => sum + k.quantity, 0), "blue"),
          kpi("Deployed", kits.filter((k) => k.status === "Deployed").length, "teal"),
        ],
        rows: kits.map((k) => row(k.id, k.name, `${k.category} · qty ${k.quantity}`, k.status)),
      };
    default:
      return { kpis: [], rows: [] };
  }
}

export function FeatureKpis({ items }: { items: DeskKpi[] }) {
  if (items.length === 0) return null;
  return (
    <div className="stat-row mb-6" style={{ ["--n" as string]: items.length }}>
      {items.map((item) => (
        <StatTile key={item.label} label={item.label} value={item.value} tone={item.tone} />
      ))}
    </div>
  );
}

export function FeatureRegister({
  title,
  rows,
  selectedId,
  onSelect,
}: {
  title: string;
  rows: DeskRow[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/70">Live register</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-text">{title}</h3>
        </div>
        <span className="rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-gold">
          {rows.length} records
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-10 text-sm text-text-dim">No live records in this desk yet. Use the gold rail to create the first one — it will appear here immediately.</p>
      ) : (
        <ul className="thin-scroll max-h-[640px] divide-y divide-[var(--border-subtle)] overflow-y-auto">
          {rows.map((item) => {
            const active = selectedId === item.id;
            return (
              <li key={`${item.id}-${item.title}`}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors ${
                    active ? "bg-gold/12" : "hover:bg-gold/5"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-text">{item.title}</div>
                    <div className="mt-0.5 truncate text-xs text-text-dimmer">{item.meta}</div>
                  </div>
                  <StatusBadge status={item.status} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
