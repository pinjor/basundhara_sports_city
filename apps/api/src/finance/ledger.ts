/** Standard chart-of-accounts codes the posting rules rely on. Seeded; editable names, fixed codes. */
export const LEDGER = {
  CASH: "1000",
  RECEIVABLE: "1100",
  INVENTORY: "1200",
  PAYABLE: "2000",
  VAT: "2100",
  EQUITY: "3000",
  OTHER_INCOME: "4900",
  SALARIES: "5100",
  PROCUREMENT: "5400",
  OTHER_EXPENSE: "5900",
} as const;

export const STREAM_ACCOUNT: Record<string, string> = {
  EVENT: "4100",
  TICKET: "4200",
  MEMBERSHIP: "4300",
  SPONSORSHIP: "4400",
  RENTAL: "4500",
  OTHER: LEDGER.OTHER_INCOME,
};

export const EXPENSE_ACCOUNT: Record<string, string> = {
  Salaries: LEDGER.SALARIES,
  Utilities: "5200",
  Maintenance: "5300",
  Procurement: LEDGER.PROCUREMENT,
  Marketing: "5500",
  Security: "5600",
  Other: LEDGER.OTHER_EXPENSE,
};

export const CHART_OF_ACCOUNTS: { code: string; name: string; type: string }[] = [
  { code: LEDGER.CASH, name: "Cash and bank", type: "Asset" },
  { code: LEDGER.RECEIVABLE, name: "Accounts receivable", type: "Asset" },
  { code: LEDGER.INVENTORY, name: "Inventory", type: "Asset" },
  { code: LEDGER.PAYABLE, name: "Accounts payable", type: "Liability" },
  { code: LEDGER.VAT, name: "VAT payable", type: "Liability" },
  { code: LEDGER.EQUITY, name: "Owner's equity", type: "Equity" },
  { code: "4100", name: "Event revenue", type: "Income" },
  { code: "4200", name: "Ticket revenue", type: "Income" },
  { code: "4300", name: "Membership revenue", type: "Income" },
  { code: "4400", name: "Sponsorship revenue", type: "Income" },
  { code: "4500", name: "Rental revenue", type: "Income" },
  { code: LEDGER.OTHER_INCOME, name: "Other income", type: "Income" },
  { code: LEDGER.SALARIES, name: "Salaries and wages", type: "Expense" },
  { code: "5200", name: "Utilities", type: "Expense" },
  { code: "5300", name: "Maintenance and repairs", type: "Expense" },
  { code: LEDGER.PROCUREMENT, name: "Procurement and supplies", type: "Expense" },
  { code: "5500", name: "Marketing", type: "Expense" },
  { code: "5600", name: "Security services", type: "Expense" },
  { code: LEDGER.OTHER_EXPENSE, name: "Other expenses", type: "Expense" },
];

export const round2 = (value: number) => Math.round(value * 100) / 100;
