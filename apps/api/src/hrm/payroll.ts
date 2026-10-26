import { round2 } from "../finance/ledger";

/** Employee provident fund contribution, share of gross. */
export const PROVIDENT_FUND_RATE = 0.05;
/** Monthly salary above which income tax is withheld, BDT. */
export const TAX_FREE_MONTHLY = 30_000;
/** Flat withholding on the taxable part of monthly salary. */
export const TAX_RATE = 0.1;

export interface PayslipFigures {
  gross: number;
  deductions: number;
  net: number;
}

export function payslipFor(gross: number): PayslipFigures {
  const providentFund = gross * PROVIDENT_FUND_RATE;
  const tax = Math.max(gross - TAX_FREE_MONTHLY, 0) * TAX_RATE;
  const deductions = round2(providentFund + tax);
  return { gross: round2(gross), deductions, net: round2(gross - deductions) };
}
