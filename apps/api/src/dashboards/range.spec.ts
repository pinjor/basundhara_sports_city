import { bucketSum, delta, monthBuckets, parseRange, trendBuckets, weekBuckets, windowFor } from "./range";

const NOW = new Date("2026-10-18T09:30:00.000Z");
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("dashboard ranges", () => {
  it("rejects unknown ranges and falls back when missing", () => {
    expect(parseRange(undefined, "month")).toBe("month");
    expect(() => parseRange("decade", "month")).toThrow();
  });

  it("builds today and the day before", () => {
    const w = windowFor("today", NOW);
    expect([w.from, w.to, w.prevFrom, w.prevTo]).toEqual([day("2026-10-18"), day("2026-10-19"), day("2026-10-17"), day("2026-10-18")]);
  });

  it("compares month-to-date with the same days of last month", () => {
    const w = windowFor("month", NOW);
    expect([w.from, w.to, w.prevFrom, w.prevTo]).toEqual([day("2026-10-01"), day("2026-10-19"), day("2026-09-01"), day("2026-09-19")]);
  });

  it("compares year-to-date with the same span last year", () => {
    const w = windowFor("year", NOW);
    expect([w.from, w.prevFrom, w.prevTo]).toEqual([day("2026-01-01"), day("2025-01-01"), day("2025-10-19")]);
  });

  it("rolls twelve whole months", () => {
    const w = windowFor("last12", NOW);
    expect([w.from, w.prevFrom, w.prevTo]).toEqual([day("2025-11-01"), day("2024-11-01"), day("2025-11-01")]);
    expect(monthBuckets(w.from, w.to).map((b) => b.label)).toEqual(["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"]);
  });

  it("cuts the last week bucket at the window end", () => {
    const buckets = weekBuckets(day("2026-10-01"), day("2026-10-19"));
    expect(buckets.map((b) => b.label)).toEqual(["W1", "W2", "W3"]);
    expect(buckets[2]!.to).toEqual(day("2026-10-19"));
  });

  it("sums rows into buckets and skips rows outside", () => {
    const buckets = monthBuckets(day("2026-09-01"), day("2026-11-01"));
    const rows = [{ at: day("2026-09-03"), v: 5 }, { at: day("2026-10-30"), v: 2 }, { at: day("2026-12-01"), v: 9 }];
    expect(bucketSum(buckets, rows, (r) => r.at, (r) => r.v)).toEqual([5, 2]);
  });

  it("trends daily for short windows, at least a week, and monthly for long ones", () => {
    const today = trendBuckets(windowFor("today", NOW));
    expect(today.map((b) => b.label)).toEqual(["12 Oct", "13 Oct", "14 Oct", "15 Oct", "16 Oct", "17 Oct", "18 Oct"]);
    expect(trendBuckets(windowFor("month", NOW))).toHaveLength(18);
    expect(trendBuckets(windowFor("year", NOW)).map((b) => b.label)).toEqual(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"]);
  });

  it("reports change only when there is a baseline", () => {
    expect(delta(120, 100)).toBe(20);
    expect(delta(5, 0)).toBeNull();
  });
});
