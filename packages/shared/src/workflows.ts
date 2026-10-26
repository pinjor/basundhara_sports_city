/**
 * Status machines shared by API and web. The API rejects any move not listed here;
 * the web only offers the moves listed here.
 */
export interface Workflow {
  initial: string;
  transitions: Record<string, readonly string[]>;
}

const flow = (initial: string, transitions: Record<string, readonly string[]>): Workflow => ({ initial, transitions });

export const WORKFLOWS = {
  active: flow("ACTIVE", { ACTIVE: ["INACTIVE"], INACTIVE: ["ACTIVE"] }),
  posting: flow("DRAFT", { DRAFT: ["POSTED", "CANCELLED"], POSTED: ["REVERSED"], REVERSED: [], CANCELLED: [] }),
  budget: flow("DRAFT", { DRAFT: ["APPROVED", "CANCELLED"], APPROVED: ["CLOSED"], CLOSED: [], CANCELLED: [] }),
  fund: flow("ACTIVE", { ACTIVE: ["FROZEN", "CLOSED"], FROZEN: ["ACTIVE", "CLOSED"], CLOSED: [] }),
  approval: flow("PENDING", { PENDING: ["APPROVED", "REJECTED"], APPROVED: [], REJECTED: [] }),
  expense: flow("DRAFT", { DRAFT: ["SUBMITTED"], SUBMITTED: ["APPROVED", "REJECTED"], APPROVED: ["PAID"], PAID: [], REJECTED: [] }),
  invoice: flow("DRAFT", { DRAFT: ["ISSUED", "VOID"], ISSUED: ["PAID", "VOID"], PAID: [], VOID: [] }),
  payment: flow("PENDING", { PENDING: ["CLEARED", "FAILED"], CLEARED: ["REVERSED"], FAILED: [], REVERSED: [] }),
  purchaseRequest: flow("DRAFT", {
    DRAFT: ["SUBMITTED"],
    SUBMITTED: ["APPROVED", "RETURNED"],
    RETURNED: ["SUBMITTED"],
    APPROVED: ["ORDERED", "CLOSED"],
    ORDERED: ["CLOSED"],
    CLOSED: [],
  }),
  sourcing: flow("OPEN", { OPEN: ["EVALUATION", "CANCELLED"], EVALUATION: ["AWARDED", "CANCELLED"], AWARDED: [], CANCELLED: [] }),
  quotation: flow("RECEIVED", { RECEIVED: ["SHORTLISTED", "REJECTED"], SHORTLISTED: ["ACCEPTED", "REJECTED"], ACCEPTED: [], REJECTED: [] }),
  selection: flow("PROPOSED", { PROPOSED: ["SELECTED", "REJECTED"], SELECTED: [], REJECTED: [] }),
  contract: flow("DRAFT", { DRAFT: ["ACTIVE"], ACTIVE: ["EXPIRED", "TERMINATED"], EXPIRED: [], TERMINATED: [] }),
  purchaseOrder: flow("DRAFT", { DRAFT: ["ISSUED", "CANCELLED"], ISSUED: ["RECEIVED", "CANCELLED"], RECEIVED: ["CLOSED"], CLOSED: [], CANCELLED: [] }),
  delivery: flow("SCHEDULED", { SCHEDULED: ["IN_TRANSIT", "DELAYED"], IN_TRANSIT: ["DELIVERED", "DELAYED"], DELAYED: ["IN_TRANSIT", "DELIVERED"], DELIVERED: [] }),
  match: flow("MATCHED", { MATCHED: ["APPROVED"], VARIANCE: ["APPROVED", "DISPUTED"], DISPUTED: ["APPROVED"], APPROVED: [] }),
  lot: flow("IN_STOCK", { IN_STOCK: ["DEPLETED", "EXPIRED"], DEPLETED: [], EXPIRED: [] }),
  employee: flow("ACTIVE", { ACTIVE: ["ON_LEAVE", "EXITED"], ON_LEAVE: ["ACTIVE", "EXITED"], EXITED: [] }),
  document: flow("VALID", { VALID: ["EXPIRED", "REVOKED"], EXPIRED: ["VALID"], REVOKED: [] }),
  candidate: flow("APPLIED", { APPLIED: ["INTERVIEW", "REJECTED"], INTERVIEW: ["OFFER", "REJECTED"], OFFER: ["HIRED", "REJECTED"], HIRED: [], REJECTED: [] }),
  progress: flow("PLANNED", { PLANNED: ["IN_PROGRESS", "CANCELLED"], IN_PROGRESS: ["COMPLETED", "CANCELLED"], COMPLETED: [], CANCELLED: [] }),
  attendance: flow("EXPECTED", { EXPECTED: ["CHECKED_IN", "ABSENT"], CHECKED_IN: ["CHECKED_OUT"], CHECKED_OUT: [], ABSENT: [] }),
  payroll: flow("DRAFT", { DRAFT: ["PROCESSED"], PROCESSED: ["POSTED", "DRAFT"], POSTED: [] }),
  schedule: flow("SCHEDULED", { SCHEDULED: ["COMPLETED", "CANCELLED", "NO_SHOW"], COMPLETED: [], CANCELLED: [], NO_SHOW: [] }),
  pass: flow("ACTIVE", { ACTIVE: ["SUSPENDED", "EXPIRED"], SUSPENDED: ["ACTIVE", "EXPIRED"], EXPIRED: [] }),
  issued: flow("ISSUED", { ISSUED: ["USED", "REVOKED"], USED: [], REVOKED: [] }),
  message: flow("DRAFT", { DRAFT: ["SENT"], SENT: [] }),
  recorded: flow("RECORDED", { RECORDED: [] }),
  waitlist: flow("WAITING", { WAITING: ["OFFERED", "EXPIRED"], OFFERED: ["CONVERTED", "EXPIRED"], CONVERTED: [], EXPIRED: [] }),
  request: flow("REQUESTED", { REQUESTED: ["CONFIRMED", "CANCELLED"], CONFIRMED: ["COMPLETED", "CANCELLED"], COMPLETED: [], CANCELLED: [] }),
  addOn: flow("REQUESTED", { REQUESTED: ["ISSUED", "CANCELLED"], ISSUED: ["RETURNED"], RETURNED: [], CANCELLED: [] }),
  deposit: flow("HELD", { HELD: ["APPLIED", "REFUNDED"], APPLIED: [], REFUNDED: [] }),
  gatewayPayment: flow("INITIATED", { INITIATED: ["CAPTURED", "FAILED"], CAPTURED: ["REFUNDED"], FAILED: [], REFUNDED: [] }),
  rule: flow("ACTIVE", { ACTIVE: ["PAUSED", "ENDED"], PAUSED: ["ACTIVE", "ENDED"], ENDED: [] }),
  dispatch: flow("PENDING", { PENDING: ["SENT"], SENT: ["DELIVERED", "FAILED"], DELIVERED: [], FAILED: ["SENT"] }),
  case: flow("OPEN", { OPEN: ["APPROVED", "REJECTED"], APPROVED: ["CLOSED"], REJECTED: ["CLOSED"], CLOSED: [] }),
  transfer: flow("REQUESTED", { REQUESTED: ["COMPLETED", "REJECTED"], COMPLETED: [], REJECTED: [] }),
  alert: flow("OPEN", { OPEN: ["ACKNOWLEDGED", "RESOLVED"], ACKNOWLEDGED: ["RESOLVED"], RESOLVED: [] }),
  incident: flow("Open", { Open: ["Investigating", "Resolved"], Investigating: ["Resolved"], Resolved: [] }),
  camera: flow("ONLINE", { ONLINE: ["OFFLINE", "MAINTENANCE"], OFFLINE: ["ONLINE", "MAINTENANCE"], MAINTENANCE: ["ONLINE"] }),
  lockdown: flow("ACTIVE", { ACTIVE: ["ENDED"], ENDED: [] }),
  project: flow("PLANNED", { PLANNED: ["IN_PROGRESS", "ON_HOLD"], IN_PROGRESS: ["ON_HOLD", "COMPLETED"], ON_HOLD: ["IN_PROGRESS"], COMPLETED: [] }),
} as const satisfies Record<string, Workflow>;

export type WorkflowKey = keyof typeof WORKFLOWS;

export function nextStatuses(workflow: string, status: string): readonly string[] {
  return (WORKFLOWS as Record<string, Workflow>)[workflow]?.transitions[status] ?? [];
}

export function canTransition(workflow: string, from: string, to: string): boolean {
  return nextStatuses(workflow, from).includes(to);
}

/** Button label for moving a record into `status`. */
export const STATUS_ACTION: Record<string, string> = {
  POSTED: "Post",
  REVERSED: "Reverse",
  CANCELLED: "Cancel",
  APPROVED: "Approve",
  REJECTED: "Reject",
  CLOSED: "Close",
  FROZEN: "Freeze",
  ACTIVE: "Activate",
  INACTIVE: "Deactivate",
  SUBMITTED: "Submit",
  PAID: "Mark paid",
  ISSUED: "Issue",
  VOID: "Void",
  CLEARED: "Clear",
  FAILED: "Mark failed",
  RETURNED: "Return",
  ORDERED: "Mark ordered",
  EVALUATION: "Start evaluation",
  AWARDED: "Award",
  SHORTLISTED: "Shortlist",
  ACCEPTED: "Accept",
  SELECTED: "Select",
  EXPIRED: "Expire",
  TERMINATED: "Terminate",
  RECEIVED: "Receive",
  IN_TRANSIT: "Dispatch",
  DELAYED: "Mark delayed",
  DELIVERED: "Mark delivered",
  DISPUTED: "Dispute",
  DEPLETED: "Mark depleted",
  ON_LEAVE: "Set on leave",
  EXITED: "Mark exited",
  REVOKED: "Revoke",
  VALID: "Mark valid",
  INTERVIEW: "Interview",
  OFFER: "Make offer",
  HIRED: "Hire",
  IN_PROGRESS: "Start",
  COMPLETED: "Complete",
  CHECKED_IN: "Check in",
  CHECKED_OUT: "Check out",
  ABSENT: "Mark absent",
  PROCESSED: "Process",
  DRAFT: "Back to draft",
  NO_SHOW: "No show",
  SUSPENDED: "Suspend",
  USED: "Mark used",
  SENT: "Send",
  OFFERED: "Offer slot",
  CONVERTED: "Convert",
  CONFIRMED: "Confirm",
  APPLIED: "Apply",
  REFUNDED: "Refund",
  CAPTURED: "Capture",
  PAUSED: "Pause",
  ENDED: "End",
  ACKNOWLEDGED: "Acknowledge",
  RESOLVED: "Resolve",
  Investigating: "Investigate",
  Resolved: "Resolve",
  ONLINE: "Bring online",
  OFFLINE: "Mark offline",
  MAINTENANCE: "Maintenance",
  ON_HOLD: "Hold",
};
