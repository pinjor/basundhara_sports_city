import { leaveDays, shiftWindow } from "./hrm.hooks";
import { payslipFor } from "./payroll";

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("leaveDays", () => {
  it("counts both ends", () => {
    expect(leaveDays(day("2026-10-01"), day("2026-10-01"))).toBe(1);
    expect(leaveDays(day("2026-10-01"), day("2026-10-05"))).toBe(5);
  });

  it("spans month ends", () => {
    expect(leaveDays(day("2026-10-30"), day("2026-11-02"))).toBe(4);
  });
});

describe("shiftWindow", () => {
  it("keeps day shifts as they are", () => {
    expect(shiftWindow("06:00", "14:00")).toEqual([360, 840]);
  });

  it("runs night shifts past midnight", () => {
    expect(shiftWindow("22:00", "06:00")).toEqual([1320, 1800]);
  });
});

describe("payslipFor", () => {
  it("withholds provident fund only under the tax-free line", () => {
    expect(payslipFor(25_000)).toEqual({ gross: 25_000, deductions: 1_250, net: 23_750 });
  });

  it("adds tax on the part above the tax-free line", () => {
    expect(payslipFor(50_000)).toEqual({ gross: 50_000, deductions: 4_500, net: 45_500 });
  });

  it("pays nothing on a zero salary", () => {
    expect(payslipFor(0)).toEqual({ gross: 0, deductions: 0, net: 0 });
  });
});
