import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PaymentStatus } from "@bsc/shared";
import { api } from "../lib/api";

export type RangeKey = "today" | "yesterday" | "week" | "month" | "last-month" | "quarter" | "year" | "last6" | "last12";

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "Last 7 days",
  month: "This month",
  "last-month": "Last month",
  quarter: "This quarter",
  year: "This year",
  last6: "Last 6 months",
  last12: "Last 12 months",
};

type Delta = number | null;
type Share = { label: string; amount: number; pct: number };
type Tone = "green" | "red" | "gold";

export interface RevenueDash {
  range: RangeKey;
  kpis: { revenue: number; revenueDelta: Delta; invoices: number; invoicesDelta: Delta; received: number; receivedDelta: Delta; outstanding: number };
  trend: { labels: string[]; revenue: number[]; invoiced: number[] };
  sources: Share[];
  comparison: { labels: string[]; current: number[]; previous: number[]; currentYear: number };
  invoices: { id: string; reference: string; party: string; service: string; issuedOn: string; dueOn: string; total: number; balance: number; state: string; status: string }[];
  insights: { tone: Tone; title: string; text: string }[];
}

export interface HrDash {
  range: RangeKey;
  kpis: { employees: number; employeesDelta: Delta; present: number; presentPct: number; onLeave: number; onLeavePct: number; newHires: number; newHiresDelta: Delta; newHiresChange: number };
  headcount: { department: string; count: number }[];
  attendance: { present: number; onLeave: number; absent: number; expected: number; total: number };
  leave: { type: string; days: number; requests: number; share: number; entitlement: number }[];
  distribution: { type: string; count: number; pct: number }[];
  activities: { id: string; title: string; detail: string; at: string }[];
  birthdays: Person[];
  anniversaries: Person[];
}

type Person = { name: string; department: string; date: string; inDays: number; years?: number };

export interface BookingRow {
  id: string;
  reference: string;
  customer: string;
  venue: string;
  date: string;
  time: string;
  amount: number;
  paymentStatus: string;
  status: string;
  paid: boolean;
}

export interface BookingDash {
  range: RangeKey;
  kpis: { bookings: number; bookingsDelta: Delta; ticketsToday: number; activeMembers: number; membersDelta: Delta; revenueToday: number; occupancy: number; upcomingEvents: number };
  trend: { labels: string[]; bookings: number[]; revenue: number[] };
  tickets: { labels: string[]; online: number[]; onsite: number[] };
  status: { Pending: number; Confirmed: number; Completed: number; Cancelled: number };
  venues: Share[];
  popular: Share[];
  occupancy: { id: string; name: string; pct: number }[];
  recent: BookingRow[];
  insights: { icon: string; title: string; text: string; to: string }[];
}

export interface SecurityAlert {
  id: string;
  reference: string;
  kind: string;
  severity: string;
  status: string;
  location: string;
  subject: string | null;
  camera: { id: string | null; name: string; reference: string; imageUrl: string | null } | null;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

export interface SecurityCamera {
  id: string;
  reference: string;
  name: string;
  zone: string;
  location: string | null;
  imageUrl: string | null;
  status: string;
  mapX: number | null;
  mapY: number | null;
  alert: boolean;
}

export interface ZoneLoad {
  zone: string;
  value: number;
  capacity: number;
}

export interface SecurityDash {
  range: RangeKey;
  kpis: { cameras: number; camerasOnline: number; activeAlerts: number; acknowledgedAlerts: number; people: number; peopleDelta: Delta; vehicles: number; vehiclesDelta: Delta; uptime: number; critical: number };
  cameras: SecurityCamera[];
  alerts: SecurityAlert[];
  events: SecurityAlert[];
  incidents: { id: string; title: string; severity: string; status: string; notes: string | null; createdAt: string }[];
  flow: { labels: string[]; people: number[] };
  crowd: { live: ZoneLoad[]; entries: ZoneLoad[]; peak: { label: string; zones: ZoneLoad[] } };
  traffic: { labels: string[]; entries: number[]; exits: number[] };
  access: { total: number; granted: number; denied: number; other: number };
  lockdown: { id: string; reference: string; reason: string; scope: string; drill: boolean; startedAt: string } | null;
  window: { from: string; to: string };
}

type Series = { labels: string[]; values: number[] };

export interface ChairEvent {
  id: string;
  kind: "pack" | "match";
  title: string;
  date: string;
  venue: string;
  audience: string;
  approvalStatus: string;
}

export interface ChairProject {
  id: string;
  reference: string;
  name: string;
  owner: string;
  budget: number;
  progress: number;
  dueOn: string | null;
  status: string;
}

export interface ChairVenue {
  type: string;
  count: number;
  available: number;
  inUse: number;
  maintenance: number;
  capacity: number;
}

export interface ChairmanDash {
  kpis: { visitors: number; visitorsDelta: Delta; events: number; eventsDelta: Delta; revenue: number; revenueDelta: Delta; cost: number; costDelta: Delta; surplus: number; surplusDelta: Delta; occupancy: number; members: number; membersDelta: Delta };
  campus: { facilities: number; zones: number; stadiums: number; capacity: number; onSite: number };
  venues: ChairVenue[];
  schedule: { id: string; start: string; end: string; title: string; venue: string; kind: string; lead: string; state: "Done" | "Ongoing" | "Upcoming" }[];
  events: ChairEvent[];
  revenue: { monthly: Series; quarterly: Series };
  visitors: { monthly: Series; quarterly: Series };
  utilization: { type: string; pct: number }[];
  segments: Share[];
  highlights: { id: string; title: string; body: string; href: string | null; at: string }[];
  projects: ChairProject[];
  maintenance: { id: string; name: string; status: string }[];
  finance: { revenue: number; cost: number; surplus: number; topSegment: Share | null; bestMonth: { label: string; year: number; amount: number } | null };
}

const KEY = "dashboards";

function useDashboard<T>(name: string, range?: RangeKey) {
  return useQuery({
    queryKey: [KEY, name, range ?? null],
    queryFn: async () => (await api.get<T>(`/dashboards/${name}`, { params: range ? { range } : undefined })).data,
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

export const useRevenueDash = (range: RangeKey) => useDashboard<RevenueDash>("revenue", range);
export const useHrDash = (range: RangeKey) => useDashboard<HrDash>("hr", range);
export const useBookingDash = (range: RangeKey) => useDashboard<BookingDash>("booking", range);
export const useSecurityDash = (range: RangeKey) => useDashboard<SecurityDash>("security", range);
export const useChairmanDash = () => useDashboard<ChairmanDash>("chairman");

/** Mutation that refreshes every dashboard (and notifications) once it succeeds. */
function useDashMutation<V>(run: (vars: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export const useSettleInvoice = () => useDashMutation((id: string) => api.post(`/dashboards/revenue/invoices/${id}/settle`));

export const useAlertStatus = () =>
  useDashMutation(({ id, status }: { id: string; status: "ACKNOWLEDGED" | "RESOLVED" }) => api.post(`/security/alerts/${id}/status`, { status }));

export const useStartLockdown = () =>
  useDashMutation((input: { reason: string; scope: string; drill: boolean }) => api.post("/security/lockdowns", input));

export const useEndLockdown = () => useDashMutation((id: string) => api.post(`/security/lockdowns/${id}/status`, { status: "ENDED" }));

export const useEventDecision = () =>
  useDashMutation(({ id, decision }: { id: string; decision: "Approved" | "Rejected" }) => api.post(`/events/${id}/approval`, { decision }));

export const useBookingStatus = () =>
  useDashMutation(({ id, status }: { id: string; status: string }) => api.post(`/bookings/${id}/status`, { status }));

export const useBookingPaid = () =>
  useDashMutation((id: string) => api.post(`/bookings/${id}/payment-status`, { paymentStatus: PaymentStatus.PAID }));
