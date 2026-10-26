const VERBS: Record<string, string> = {
  CREATE: "created",
  CREATE_WITH_PRICES: "created with prices",
  UPDATE: "updated",
  DELETE: "deleted",
  SET_STATUS: "status changed",
  SET_SALES_STATUS: "sales status changed",
  RENEW: "renewed",
  ENTRY: "entry logged",
  EXIT: "exit logged",
  CHECK_IN: "checked in",
};

export function auditEntity(text: string) {
  const spaced = text.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const words = (text: string) => text.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/[_-]+/g, " ").trim();

export function auditVerb(action: string) {
  if (VERBS[action]) return VERBS[action];
  const [kind, value] = action.split(":");
  if (value !== undefined) {
    const subject = words(kind.replace(/_?change$/i, ""));
    const outcome = words(value);
    if (subject === "status" || subject === "approval") return `marked ${outcome}`;
    if (subject.endsWith(" status")) return `${subject.slice(0, -7)} marked ${outcome}`;
    return `${subject} ${outcome}`;
  }
  if (action.startsWith("STATUS_")) return `marked ${action.slice(7).toLowerCase().replace(/_+/g, " ")}`;
  return action.toLowerCase().replace(/[_-]+/g, " ");
}

export function auditLine(entityType: string, action: string) {
  return `${auditEntity(entityType)} ${auditVerb(action)}`;
}

export function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}
