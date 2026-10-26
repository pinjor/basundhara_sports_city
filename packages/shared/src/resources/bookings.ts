import { Role } from "../roles";
import { BookingType, FacilityType } from "../enums";
import { choice, computed, date, money, num, optText, PAY_METHODS, ref, text, time } from "./fields";
import type { EntityDef, FeatureDef, ReportDef } from "./types";

export const WEEKDAYS = ["Daily", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
export const FREQUENCIES = ["Weekly", "Fortnightly", "Monthly"] as const;
export const COACH_SPORTS = ["Football", "Cricket", "Tennis", "Swimming", "Basketball", "Badminton", "Fitness"] as const;

const entity = (def: Omit<EntityDef, "module" | "writeRoles">): EntityDef => ({ ...def, module: "bookings", writeRoles: [Role.BOOKINGS_OFFICER] });
const facility = (required = true) => ref("facilityId", "Facility", "facility", { required });
const booking = () => ref("bookingId", "Booking", "booking");
const slotTimes = () => [time("timeSlotStart", "Start"), time("timeSlotEnd", "End")];

export const BOOKING_ENTITIES: EntityDef[] = [
  entity({
    key: "slot",
    model: "slot",
    label: "Slot",
    path: "booking-ops/slots",
    prefix: "SLT",
    workflow: "rule",
    titleKey: "reference",
    partyKey: "facilityId",
    amountKey: "priceBdt",
    fields: [facility(), choice("dayOfWeek", "Day", WEEKDAYS), ...slotTimes(), num("capacity", "Capacity"), money("priceBdt", "Price (BDT)")],
  }),
  entity({
    key: "recurringBookingRule",
    model: "recurringBookingRule",
    label: "Recurring booking",
    path: "booking-ops/recurring",
    prefix: "RBR",
    workflow: "rule",
    titleKey: "customerName",
    partyKey: "facilityId",
    amountKey: "amountBdt",
    fields: [
      facility(),
      text("customerName", "Customer"),
      choice("type", "Booking type", Object.values(BookingType)),
      choice("frequency", "Repeats", FREQUENCIES),
      date("startsOn", "First date"),
      date("endsOn", "Last date"),
      ...slotTimes(),
      money("amountBdt", "Amount per booking (BDT)"),
      computed("generated", "Bookings made", "number"),
      computed("skipped", "Skipped (clash)", "number"),
    ],
  }),
  entity({
    key: "waitlistEntry",
    model: "waitlistEntry",
    label: "Waiting list",
    path: "booking-ops/waitlist",
    prefix: "WTL",
    workflow: "waitlist",
    titleKey: "customerName",
    partyKey: "facilityId",
    fields: [facility(), text("customerName", "Customer"), text("phone", "Phone"), date("preferredDate", "Preferred date"), ...slotTimes(), money("amountBdt", "Quoted amount (BDT)")],
  }),
  entity({
    key: "coach",
    model: "coach",
    label: "Coach",
    path: "booking-ops/coaches",
    prefix: "COA",
    workflow: "active",
    titleKey: "name",
    partyKey: "sport",
    amountKey: "hourlyRateBdt",
    fields: [text("name", "Coach"), choice("sport", "Sport", COACH_SPORTS), text("phone", "Phone"), money("hourlyRateBdt", "Hourly rate (BDT)")],
  }),
  entity({
    key: "coachSession",
    model: "coachSession",
    label: "Coach session",
    path: "booking-ops/coach-sessions",
    prefix: "CSN",
    workflow: "request",
    titleKey: "customerName",
    partyKey: "coachId",
    amountKey: "amountBdt",
    fields: [ref("coachId", "Coach", "coach"), facility(), text("customerName", "Customer"), date("sessionDate", "Date"), ...slotTimes(), computed("amountBdt", "Amount (BDT)")],
  }),
  entity({
    key: "bookingAddOn",
    model: "bookingAddOn",
    label: "Equipment add-on",
    path: "booking-ops/add-ons",
    prefix: "ADD",
    workflow: "addOn",
    titleKey: "reference",
    partyKey: "bookingId",
    amountKey: "feeBdt",
    fields: [booking(), ref("equipmentId", "Equipment", "equipment"), num("quantity", "Quantity"), money("feeBdt", "Fee (BDT)")],
  }),
  entity({
    key: "pricingRule",
    model: "pricingRule",
    label: "Pricing rule",
    path: "booking-ops/pricing-rules",
    prefix: "PRR",
    workflow: "rule",
    titleKey: "name",
    partyKey: "dayOfWeek",
    fields: [
      text("name", "Rule"),
      choice("kind", "Kind", ["PEAK", "DYNAMIC"]),
      facility(false),
      choice("dayOfWeek", "Day", WEEKDAYS),
      time("startsAt", "From"),
      time("endsAt", "To"),
      num("adjustPercent", "Price change % (negative for discount)"),
    ],
  }),
  entity({
    key: "bookingDeposit",
    model: "bookingDeposit",
    label: "Deposit",
    path: "booking-ops/deposits",
    prefix: "BDP",
    workflow: "deposit",
    titleKey: "reference",
    partyKey: "bookingId",
    amountKey: "amountBdt",
    fields: [booking(), money("amountBdt", "Deposit (BDT)"), choice("method", "Method", PAY_METHODS), date("heldOn", "Received")],
  }),
  entity({
    key: "cancellationPolicy",
    model: "cancellationPolicy",
    label: "Cancellation policy",
    path: "booking-ops/cancellation-policies",
    prefix: "CNP",
    workflow: "rule",
    titleKey: "name",
    partyKey: "facilityType",
    fields: [text("name", "Policy"), choice("facilityType", "Facility type", ["All", ...Object.values(FacilityType)]), num("hoursBefore", "Notice (hours)"), num("refundPercent", "Refund %")],
  }),
  entity({
    key: "bookingPayment",
    model: "bookingPayment",
    label: "Payment",
    path: "booking-ops/payments",
    prefix: "BPY",
    workflow: "gatewayPayment",
    titleKey: "reference",
    partyKey: "bookingId",
    amountKey: "amountBdt",
    fields: [booking(), money("amountBdt", "Amount (BDT)"), choice("method", "Method", PAY_METHODS), optText("gatewayRef", "Gateway reference")],
  }),
];

export const BOOKING_FEATURES: FeatureDef[] = [
  { key: "slot-management", entity: "slot", blurb: "Bookable slots per facility and day. Overlapping active slots are blocked." },
  { key: "recurring-booking", entity: "recurringBookingRule", blurb: "Repeat a booking weekly, fortnightly or monthly. Creating the rule makes the bookings and skips clashes." },
  { key: "waiting-list", entity: "waitlistEntry", blurb: "Customers waiting for a full slot. Converting an offer makes the booking." },
  { key: "coach-booking", entity: "coachSession", also: ["coach"], blurb: "Sessions with a coach. A coach cannot be double-booked; the fee comes from the hourly rate." },
  { key: "equipment-add-on", entity: "bookingAddOn", blurb: "Equipment added to a booking. Issuing it marks the equipment deployed." },
  {
    key: "dynamic-pricing",
    entity: "pricingRule",
    path: "booking-ops/dynamic-pricing",
    fixed: { kind: "DYNAMIC" },
    report: "bookings.price-check",
    blurb: "Demand-based price changes. The price check shows today's adjusted rates.",
  },
  { key: "peak-hour-pricing", entity: "pricingRule", path: "booking-ops/peak-pricing", fixed: { kind: "PEAK" }, blurb: "Peak and off-peak windows that raise or lower the booking price." },
  { key: "deposit-management", entity: "bookingDeposit", blurb: "Deposits held against bookings. Holding one marks the booking deposit paid." },
  { key: "cancellation-policy", entity: "cancellationPolicy", blurb: "How much is refunded for cancelling with a given notice." },
  { key: "payment-integration", entity: "bookingPayment", blurb: "Gateway payments (sandbox). Capturing the full amount marks the booking paid." },
];

export const BOOKING_REPORTS: ReportDef[] = [{ key: "bookings.price-check", label: "Price check", module: "bookings", path: "booking-ops/reports/price-check" }];
