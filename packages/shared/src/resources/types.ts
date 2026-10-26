import type { Role } from "../roles";

export type FieldKind = "text" | "number" | "money" | "date" | "time" | "select" | "textarea" | "ref" | "bool" | "stamp";

export type ResourceModule = "finance" | "procurement" | "inventory" | "hrm" | "bookings" | "ticketing" | "security" | "projects";

export interface ResourceField {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: readonly string[];
  /** Entity key this field points at. The column is `key` and holds the target id. */
  ref?: string;
  /** Whole numbers only. Defaults to true for kind "number". */
  integer?: boolean;
  /** Shown in the register table. Defaults to true. */
  list?: boolean;
  /** Filled by the server (totals, stamps, computed status). Never accepted as input. */
  readOnly?: boolean;
}

export interface EntityDef {
  key: string;
  /** Prisma client delegate name, e.g. "invoice". */
  model: string;
  label: string;
  module: ResourceModule;
  /** Base REST path under /api, e.g. "finance/invoices". */
  path: string;
  /** Prefix for human references, e.g. INV -> INV-2026-0001. */
  prefix: string;
  workflow: string;
  titleKey: string;
  partyKey?: string;
  amountKey?: string;
  fields: ResourceField[];
  writeRoles: Role[];
}

export interface FeatureDef {
  key: string;
  blurb: string;
  /** Entity the feature registers. Omitted for report-only features. */
  entity?: string;
  /** Own endpoint when the feature narrows a shared entity (fixed values). */
  path?: string;
  /** Column values forced on create and used as list filters. */
  fixed?: Record<string, string | boolean>;
  /** Field keys shown for this feature, in order. Defaults to every entity field. */
  fields?: string[];
  /** Report shown with (or instead of) the register. */
  report?: string;
  /** Supporting registers shown under the main one (entity keys). */
  also?: string[];
}

export interface ReportParam {
  key: string;
  label: string;
  options?: readonly string[];
}

export interface ReportDef {
  key: string;
  label: string;
  module: ResourceModule;
  /** GET path under /api. */
  path: string;
  params?: ReportParam[];
}

export interface ReportColumn {
  key: string;
  label: string;
  kind?: "text" | "number" | "money" | "date" | "percent";
}

export interface ReportResult {
  title: string;
  columns: ReportColumn[];
  rows: Record<string, string | number | null>[];
  summary?: { label: string; value: string | number; kind?: ReportColumn["kind"] }[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
}
