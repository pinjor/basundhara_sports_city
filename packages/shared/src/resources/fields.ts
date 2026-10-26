import type { ResourceField } from "./types";

type Opt = Partial<Pick<ResourceField, "required" | "list" | "readOnly" | "integer">>;

export const text = (key: string, label: string, opt: Opt = {}): ResourceField => ({ key, label, kind: "text", required: true, ...opt });
export const optText = (key: string, label: string): ResourceField => text(key, label, { required: false });
export const num = (key: string, label: string, opt: Opt = {}): ResourceField => ({ key, label, kind: "number", required: true, integer: true, ...opt });
export const decimal = (key: string, label: string, opt: Opt = {}): ResourceField => num(key, label, { integer: false, ...opt });
export const money = (key: string, label: string, opt: Opt = {}): ResourceField => ({ key, label, kind: "money", required: true, ...opt });
export const date = (key: string, label: string, opt: Opt = {}): ResourceField => ({ key, label, kind: "date", required: true, ...opt });
export const time = (key: string, label: string, opt: Opt = {}): ResourceField => ({ key, label, kind: "time", required: true, ...opt });
export const choice = (key: string, label: string, options: readonly string[], opt: Opt = {}): ResourceField => ({
  key,
  label,
  kind: "select",
  options,
  required: true,
  ...opt,
});
export const ref = (key: string, label: string, entity: string, opt: Opt = {}): ResourceField => ({ key, label, kind: "ref", ref: entity, required: true, ...opt });
export const flag = (key: string, label: string): ResourceField => ({ key, label, kind: "bool", required: false });
export const stamp = (key: string, label: string): ResourceField => ({ key, label, kind: "stamp", readOnly: true, required: false });
export const computed = (key: string, label: string, kind: ResourceField["kind"] = "money"): ResourceField => ({ key, label, kind, readOnly: true, required: false });
export const notes = (): ResourceField => ({ key: "notes", label: "Notes", kind: "textarea", required: false, list: false });

export const PERIODS = ["2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4", "FY2026", "FY2027"] as const;
export const DEPARTMENTS = ["Operations", "Finance", "HR", "Security", "Facilities", "Events", "Hospitality", "IT", "Marketing"] as const;
export const PAY_METHODS = ["Bank", "Cash", "Card", "bKash", "Sandbox"] as const;
