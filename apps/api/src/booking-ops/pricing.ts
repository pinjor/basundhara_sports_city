import { coversDay, minutes } from "../bookings/booking-time";
import { round2 } from "../finance/ledger";

export interface RuleLike {
  name: string;
  facilityId: string | null;
  dayOfWeek: string;
  startsAt: string;
  endsAt: string;
  adjustPercent: number;
}

/** Active rules that apply to a booking starting at `start` on `date` at `facilityId`. */
export function applicableRules<T extends RuleLike>(rules: T[], facilityId: string, date: Date, start: string): T[] {
  const at = minutes(start);
  return rules.filter(
    (rule) => (!rule.facilityId || rule.facilityId === facilityId) && coversDay(rule.dayOfWeek, date) && minutes(rule.startsAt) <= at && at < minutes(rule.endsAt),
  );
}

/** Base price moved by the sum of rule percentages, never below zero. */
export function adjustedPrice(base: number, rules: RuleLike[]): number {
  const percent = rules.reduce((total, rule) => total + rule.adjustPercent, 0);
  return Math.max(round2(base * (1 + percent / 100)), 0);
}
