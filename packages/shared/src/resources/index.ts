import { FINANCE_ENTITIES, FINANCE_FEATURES, FINANCE_REPORTS } from "./finance";
import { BOOKING_ENTITIES, BOOKING_FEATURES, BOOKING_REPORTS } from "./bookings";
import { HRM_ENTITIES, HRM_FEATURES, HRM_REPORTS } from "./hrm";
import { TICKETING_ENTITIES, TICKETING_FEATURES, TICKETING_REPORTS } from "./ticketing";
import { INVENTORY_ENTITIES, INVENTORY_FEATURES, INVENTORY_REPORTS } from "./inventory";
import { PROCUREMENT_ENTITIES, PROCUREMENT_FEATURES, PROCUREMENT_REPORTS } from "./procurement";
import { PROJECT_ENTITIES } from "./projects";
import { SECURITY_ENTITIES } from "./security";
import type { EntityDef, FeatureDef, ReportDef, ResourceField } from "./types";

export * from "./types";
export { PERIODS, DEPARTMENTS, PAY_METHODS } from "./fields";
export * from "./finance";
export * from "./procurement";
export * from "./inventory";
export * from "./hrm";
export * from "./bookings";
export * from "./ticketing";
export * from "./security";
export * from "./projects";

export const ENTITIES: EntityDef[] = [...FINANCE_ENTITIES, ...PROCUREMENT_ENTITIES, ...INVENTORY_ENTITIES, ...HRM_ENTITIES, ...BOOKING_ENTITIES, ...TICKETING_ENTITIES, ...SECURITY_ENTITIES, ...PROJECT_ENTITIES];
export const FEATURES: FeatureDef[] = [...FINANCE_FEATURES, ...PROCUREMENT_FEATURES, ...INVENTORY_FEATURES, ...HRM_FEATURES, ...BOOKING_FEATURES, ...TICKETING_FEATURES];
export const REPORTS: ReportDef[] = [...FINANCE_REPORTS, ...PROCUREMENT_REPORTS, ...INVENTORY_REPORTS, ...HRM_REPORTS, ...BOOKING_REPORTS, ...TICKETING_REPORTS];

const ENTITY_BY_KEY = new Map(ENTITIES.map((entity) => [entity.key, entity]));
const FEATURE_BY_KEY = new Map(FEATURES.map((feature) => [feature.key, feature]));
const REPORT_BY_KEY = new Map(REPORTS.map((report) => [report.key, report]));

export function entityDef(key: string): EntityDef | undefined {
  return ENTITY_BY_KEY.get(key);
}

export function featureDef(key: string): FeatureDef | undefined {
  return FEATURE_BY_KEY.get(key);
}

export function reportDef(key: string): ReportDef | undefined {
  return REPORT_BY_KEY.get(key);
}

/** REST path a feature reads and writes. */
export function featurePath(feature: FeatureDef): string | undefined {
  if (feature.path) return feature.path;
  return feature.entity ? entityDef(feature.entity)?.path : undefined;
}

/** Fields a feature shows, in order, with fixed columns removed. */
export function featureFields(feature: FeatureDef): ResourceField[] {
  const entity = feature.entity ? entityDef(feature.entity) : undefined;
  if (!entity) return [];
  const fixed = new Set(Object.keys(feature.fixed ?? {}));
  const all = entity.fields.filter((field) => !fixed.has(field.key));
  if (!feature.fields) return all;
  return feature.fields.map((key) => all.find((field) => field.key === key)).filter((field): field is ResourceField => Boolean(field));
}

/** A feature can add records only when its form covers every required input of the entity. */
export function featureCanCreate(feature: FeatureDef): boolean {
  const entity = feature.entity ? entityDef(feature.entity) : undefined;
  if (!entity) return false;
  const shown = new Set(featureFields(feature).map((field) => field.key));
  const fixed = feature.fixed ?? {};
  return entity.fields.every((field) => !field.required || field.readOnly || field.kind === "stamp" || field.key in fixed || shown.has(field.key));
}

export interface ResourceEndpoint {
  path: string;
  entity: EntityDef;
  fixed: Record<string, string | boolean>;
}

/** One endpoint per distinct path: the entity's own path plus every narrowed feature path. */
export function resourceEndpoints(): ResourceEndpoint[] {
  const seen = new Map<string, ResourceEndpoint>();
  for (const entity of ENTITIES) seen.set(entity.path, { path: entity.path, entity, fixed: {} });
  for (const feature of FEATURES) {
    const entity = feature.entity ? entityDef(feature.entity) : undefined;
    const path = featurePath(feature);
    if (!entity || !path || seen.has(path)) continue;
    seen.set(path, { path, entity, fixed: feature.fixed ?? {} });
  }
  return [...seen.values()];
}
