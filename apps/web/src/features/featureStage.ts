import type { FlowKind } from "./flows";

export interface FeatureStage {
  kicker: string;
  lede: string;
  boardTitle: string;
  actionTitle: string;
  from?: string;
  to?: string;
}

const BY_FEATURE: Record<string, Partial<FeatureStage>> = {
  "vip-transport": {
    kicker: "Protocol movement",
    lede: "Dedicated VIP cars, drivers and convoy legs for protocol cases — not a generic shuttle form.",
    boardTitle: "VIP cars and movements",
    actionTitle: "Dispatch VIP movement",
    from: "VIP Gate 1",
    to: "VIP Lounge Deck",
  },
  "team-transport": {
    kicker: "Team logistics",
    lede: "Team buses and tunnel transfers with passenger manifests.",
    boardTitle: "Team movements",
    actionTitle: "Assign team transfer",
    from: "Team Entrance",
    to: "Changing Room A",
  },
  "event-transport": {
    kicker: "Event operations",
    lede: "Guest and media shuttles tied to a confirmed event pack.",
    boardTitle: "Event-linked trips",
    actionTitle: "Create event transfer",
    from: "Main Gate North",
    to: "Grand Event Hall",
  },
  "buggy-management": {
    kicker: "Campus mobility",
    lede: "On-campus buggies and their short-hop assignments.",
    boardTitle: "Buggy fleet",
    actionTitle: "Register buggy",
  },
  "shuttle-vehicle-management": {
    kicker: "Shuttle service",
    lede: "Recurring campus shuttles, stops and occupancy.",
    boardTitle: "Shuttle fleet",
    actionTitle: "Add shuttle",
  },
  "trip-management": {
    kicker: "Dispatch board",
    lede: "Every requested, live and completed trip in one queue.",
    boardTitle: "Trip queue",
    actionTitle: "New trip",
  },
  "gps-tracking": {
    kicker: "Live location",
    lede: "Vehicles on a trip with the last location dispatch recorded. No GPS device is connected.",
    boardTitle: "Vehicles in motion",
    actionTitle: "Start a tracked run",
  },
  "real-time-vehicle-location": {
    kicker: "Control room",
    lede: "Dispatched vehicles and their last recorded location, updated by dispatch.",
    boardTitle: "Live positions",
    actionTitle: "Dispatch for tracking",
  },
  "vehicle-maintenance": {
    kicker: "Workshop",
    lede: "Units held for service — they cannot take a new trip.",
    boardTitle: "Vehicles in workshop",
    actionTitle: "Log a unit",
  },
  "airport-pickup": {
    kicker: "Arrivals",
    lede: "Airport meet-and-greet linked to the VIP itinerary.",
    boardTitle: "Arrival cases",
    actionTitle: "Plan pickup",
  },
  "convoy-management": {
    kicker: "Convoy",
    lede: "Protocol guests and the vehicles and drivers assigned to them.",
    boardTitle: "Protocol guests",
    actionTitle: "Open convoy case",
  },
  "invitation-management": {
    kicker: "Protocol",
    lede: "Invitations, RSVP and accompanying party — not a blank profile form.",
    boardTitle: "Invitation book",
    actionTitle: "Add invitation",
  },
  "visitor-check-in": {
    kicker: "Reception",
    lede: "Expected guests waiting at the desk, with QR pass on check-in.",
    boardTitle: "Expected today",
    actionTitle: "Check in guest",
  },
  "visitor-check-out": {
    kicker: "Exit",
    lede: "On-site visitors whose pass must expire on departure.",
    boardTitle: "Currently on site",
    actionTitle: "Check out",
  },
  "qr-scanner": {
    kicker: "Access",
    lede: "Scans recorded at the gate desk — grant or deny with a reason.",
    boardTitle: "Recent scans",
    actionTitle: "Record scan",
  },
  "parking-reservation": {
    kicker: "Parking",
    lede: "Parking zones and arrivals logged against them.",
    boardTitle: "Parking zones",
    actionTitle: "Log arrival",
  },
  "service-request-management": {
    kicker: "Hospitality",
    lede: "Lounge requests from pending through delivered.",
    boardTitle: "Service queue",
    actionTitle: "Raise request",
  },
  "vvip-parking": {
    kicker: "Protocol parking",
    lede: "Reserved VIP bays and plate sessions for protocol arrivals.",
    boardTitle: "VIP parking occupancy",
    actionTitle: "Log VIP arrival",
  },
  "staff-parking": {
    kicker: "Staff bays",
    lede: "Staff parking occupancy and exit clearance.",
    boardTitle: "Staff parking",
    actionTitle: "Log staff vehicle",
  },
  "visitor-parking": {
    kicker: "Visitor bays",
    lede: "Guest plates, reserved visitor bays and exit.",
    boardTitle: "Visitor parking",
    actionTitle: "Log guest plate",
  },
  "football-field-setup": {
    kicker: "Pitch",
    lede: "Football pitches, hours and playability — not a generic space form.",
    boardTitle: "Football pitches",
    actionTitle: "Open a pitch",
  },
  "cricket-stadium-setup": {
    kicker: "Cricket",
    lede: "Cricket grounds with hours, capacity and inspection.",
    boardTitle: "Cricket grounds",
    actionTitle: "Open a ground",
  },
  "gym-access": {
    kicker: "Gym floor",
    lede: "Active members on the gym roll and live check-ins.",
    boardTitle: "Gym members",
    actionTitle: "Check in to gym",
  },
  "pool-access": {
    kicker: "Pool",
    lede: "Members with pool entitlement and lane check-ins.",
    boardTitle: "Pool members",
    actionTitle: "Check in to pool",
  },
  "vip-gate": {
    kicker: "Protocol gate",
    lede: "Face-first VIP readers and the live grant/deny log.",
    boardTitle: "VIP gate activity",
    actionTitle: "Present VIP credential",
  },
  "day-view": {
    kicker: "Operating day",
    lede: "Confirmed slots only, hour by hour — not the full diary.",
    boardTitle: "Confirmed day board",
    actionTitle: "Open day board",
  },
  "week-view": {
    kicker: "Seven-day grid",
    lede: "The week’s holds and confirmed events, one column per day.",
    boardTitle: "Week grid",
    actionTitle: "Open week",
  },
  "resource-timeline": {
    kicker: "Venue lanes",
    lede: "Every playing space as a row so clashes show before you confirm.",
    boardTitle: "Resource lanes",
    actionTitle: "Open timeline",
  },
  "open-tasks": {
    kicker: "Open work",
    lede: "Unfinished campus jobs. Completed tickets stay off this desk.",
    boardTitle: "Open tasks",
    actionTitle: "Work the queue",
  },
  "event-work-queue": {
    kicker: "Event operations",
    lede: "Tasks created when a booking is confirmed, grouped by event pack.",
    boardTitle: "Event work",
    actionTitle: "Open event queue",
  },
  "booking-approvals": {
    kicker: "Standard holds",
    lede: "Everyday pending bookings waiting for confirm or reject.",
    boardTitle: "Approval inbox",
    actionTitle: "Review holds",
  },
  "escalations": {
    kicker: "Priority inbox",
    lede: "Stadium, team, corporate and high-value holds for a senior decision.",
    boardTitle: "Escalations",
    actionTitle: "Review escalations",
  },
  "main-gate-management": {
    kicker: "Main gate",
    lede: "Public entries, device health and emergency open.",
    boardTitle: "Main gate devices",
    actionTitle: "Toggle main gate",
  },
};

const BY_KIND: Record<FlowKind, FeatureStage> = {
  "zone-setup": { kicker: "Master data", lede: "Campus, complex and zone records with capacity and status.", boardTitle: "Location register", actionTitle: "Create location" },
  "zone-map": { kicker: "Map operations", lede: "Click a live zone to read occupancy and change its state.", boardTitle: "Mapped zones", actionTitle: "Update zone" },
  "facility-setup": { kicker: "Venues", lede: "Playable spaces attached to a zone, with hours and availability.", boardTitle: "Venue register", actionTitle: "Open a space" },
  "facility-status": { kicker: "Availability", lede: "Walk a facility through available, reserved, in use or closed.", boardTitle: "Facility status", actionTitle: "Change status" },
  "booking-create": { kicker: "Reservations", lede: "Holds, confirmation and QR — then the event pack opens.", boardTitle: "Booking diary", actionTitle: "New booking" },
  "booking-advance": { kicker: "Lifecycle", lede: "Pending holds waiting to become live events.", boardTitle: "Bookings in play", actionTitle: "Advance booking" },
  "booking-pay": { kicker: "Settlement", lede: "Collect deposit or balance and issue the confirmation QR.", boardTitle: "Unpaid / open bills", actionTitle: "Take payment" },
  "member-create": { kicker: "Membership", lede: "Applications joining the live roll with a digital credential.", boardTitle: "Member roll", actionTitle: "Enrol member" },
  "member-checkin": { kicker: "Recreation", lede: "Active members at gym, pool and classes.", boardTitle: "Members", actionTitle: "Check in" },
  "member-lifecycle": { kicker: "Account", lede: "Freeze, renew or expire — access entitlement follows.", boardTitle: "Memberships", actionTitle: "Change status" },
  "gate-setup": { kicker: "Access points", lede: "Gates, turnstiles and barriers on the campus map.", boardTitle: "Access points", actionTitle: "Register gate" },
  "gate-scan": { kicker: "Validation", lede: "Credential, membership and visit rules decide grant or deny.", boardTitle: "Access log", actionTitle: "Present credential" },
  "gate-toggle": { kicker: "Control room", lede: "Take a reader online, offline or emergency-open.", boardTitle: "Device status", actionTitle: "Toggle gate" },
  "gate-log": { kicker: "Investigation", lede: "Every grant and denial with method and reason.", boardTitle: "Access investigation", actionTitle: "Refresh log" },
  "visitor-journey": { kicker: "Visitors", lede: "Invitation through checkout on one guest record.", boardTitle: "Visitor book", actionTitle: "Register visit" },
  "visitor-checkin": { kicker: "Reception", lede: "Expected list for the desk.", boardTitle: "Expected visitors", actionTitle: "Check in" },
  "visitor-checkout": { kicker: "Muster", lede: "Who is still on site.", boardTitle: "On-site visitors", actionTitle: "Check out" },
  "vip-journey": { kicker: "Protocol case", lede: "Classification, arrival, lounge, seat and departure as one case.", boardTitle: "VIP / VVIP book", actionTitle: "Open protocol case" },
  "lounge-setup": { kicker: "Hospitality rooms", lede: "VIP, VVIP and hospitality lounges with capacity.", boardTitle: "Lounges", actionTitle: "Set up lounge" },
  "lounge-party": { kicker: "Live hospitality", lede: "Who is inside versus capacity.", boardTitle: "Lounge occupancy", actionTitle: "Adjust party" },
  "service-request": { kicker: "Service", lede: "Refreshment and premium requests against a lounge.", boardTitle: "Service requests", actionTitle: "New request" },
  "outlet-setup": { kicker: "F&B outlets", lede: "Restaurants, concessions and production kitchens.", boardTitle: "Outlets", actionTitle: "Register outlet" },
  "order-flow": { kicker: "Kitchen", lede: "Orders from received through delivered.", boardTitle: "Kitchen tickets", actionTitle: "Place order" },
  "parking-setup": { kicker: "Parking master", lede: "Facilities, zones and bay types.", boardTitle: "Parking zones", actionTitle: "Add zone" },
  "parking-cycle": { kicker: "Sessions", lede: "Entry, occupancy and exit for a plate.", boardTitle: "Parking occupancy", actionTitle: "Vehicle session" },
  "fleet-setup": { kicker: "Fleet master", lede: "Vehicles, drivers and workshop status.", boardTitle: "Fleet register", actionTitle: "Register vehicle" },
  "trip-run": { kicker: "Dispatch", lede: "Request, assign, run and complete a movement.", boardTitle: "Trips", actionTitle: "Dispatch trip" },
  "surface-close": { kicker: "Grounds", lede: "Playable versus closed — bookings cannot confirm on a closed surface.", boardTitle: "Playing surfaces", actionTitle: "Set closure" },
  "equipment-flow": { kicker: "Assets", lede: "Kits, stock and quarantine.", boardTitle: "Equipment", actionTitle: "Update kit" },
};

export function featureStage(featureKey: string | undefined, kind: FlowKind): FeatureStage {
  const base = BY_KIND[kind];
  const extra = featureKey ? BY_FEATURE[featureKey] : undefined;
  return { ...base, ...extra };
}
