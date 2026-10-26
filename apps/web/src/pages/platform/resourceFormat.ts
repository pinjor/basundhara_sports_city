import type { ReportColumn, ResourceField } from "@bsc/shared";
import type { ResourceRow } from "../../api/resources";
import { formatBdt, formatWhen } from "../../lib/money";
import type { Lang } from "../../lib/prefs";

export type FormValues = Record<string, string>;

/** Key the API uses for a reference field's label: `accountId` → `accountLabel`. */
export const refLabelKey = (field: ResourceField) => `${field.key.replace(/Id$/, "")}Label`;

export const editable = (field: ResourceField) => !field.readOnly && field.kind !== "stamp";

export function cellText(row: ResourceRow, field: ResourceField, lang: Lang): string {
  const value = field.kind === "ref" ? row[refLabelKey(field)] : row[field.key];
  if (value === null || value === undefined || value === "") return field.kind === "stamp" ? "Not yet" : "—";
  switch (field.kind) {
    case "money":
      return formatBdt(Number(value), lang);
    case "bool":
      return value ? "Yes" : "No";
    case "stamp":
      return formatWhen(String(value), lang);
    default:
      return String(value);
  }
}

export function reportCell(value: string | number | null | undefined, kind: ReportColumn["kind"], lang: Lang): string {
  if (value === null || value === undefined || value === "") return "—";
  if (kind === "money") return formatBdt(Number(value), lang);
  if (kind === "percent") return `${value}%`;
  if (kind === "number" && typeof value === "number") return value.toLocaleString("en-IN");
  return String(value);
}

/** Form values from an existing row, for editing. */
export function valuesFrom(row: ResourceRow, fields: ResourceField[]): FormValues {
  const values: FormValues = {};
  for (const field of fields.filter(editable)) {
    const value = row[field.key];
    values[field.key] = field.kind === "bool" ? (value ? "true" : "") : value === null || value === undefined ? "" : String(value);
  }
  return values;
}

/** Request body from form values. Blank optional fields are skipped on create and cleared on edit. */
export function bodyFrom(values: FormValues, fields: ResourceField[], editing: boolean): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const field of fields.filter(editable)) {
    const raw = (values[field.key] ?? "").trim();
    if (field.kind === "bool") {
      body[field.key] = raw === "true";
      continue;
    }
    if (!raw) {
      if (editing) body[field.key] = field.kind === "text" || field.kind === "textarea" ? "" : null;
      continue;
    }
    body[field.key] = field.kind === "number" || field.kind === "money" ? Number(raw) : raw;
  }
  return body;
}
