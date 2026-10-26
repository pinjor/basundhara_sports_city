import { Prisma } from "@prisma/client";
import { ENTITIES, FEATURES, REPORTS, WORKFLOWS, entityDef, featurePath, resourceEndpoints } from "@bsc/shared";
import { relationOf } from "./resource.service";

const models = new Map(Prisma.dmmf.datamodel.models.map((model) => [model.name[0]!.toLowerCase() + model.name.slice(1), model]));

describe("resource registry", () => {
  it.each(ENTITIES.map((entity) => [entity.key, entity] as const))("%s matches its Prisma model", (_key, entity) => {
    const model = models.get(entity.model);
    expect(model).toBeDefined();
    const fields = new Map(model!.fields.map((field) => [field.name, field]));
    for (const column of ["id", "reference", "status", "createdById", "createdAt", "updatedAt"]) expect(fields.has(column)).toBe(true);
    for (const field of entity.fields) {
      expect({ entity: entity.key, field: field.key, exists: fields.has(field.key) }).toEqual({ entity: entity.key, field: field.key, exists: true });
      if (field.kind === "ref") {
        expect(field.ref).toBeDefined();
        expect({ entity: entity.key, relation: relationOf(field), exists: fields.get(relationOf(field))?.kind === "object" }).toEqual({
          entity: entity.key,
          relation: relationOf(field),
          exists: true,
        });
      }
    }
    expect(Object.keys(WORKFLOWS)).toContain(entity.workflow);
    expect(entity.fields.some((field) => field.key === entity.titleKey) || entity.titleKey === "reference").toBe(true);
  });

  it("has unique keys, prefixes and paths", () => {
    const unique = (values: string[]) => new Set(values).size === values.length;
    expect(unique(ENTITIES.map((entity) => entity.key))).toBe(true);
    expect(unique(ENTITIES.map((entity) => entity.prefix))).toBe(true);
    expect(unique(FEATURES.map((feature) => feature.key))).toBe(true);
    expect(unique(resourceEndpoints().map((endpoint) => endpoint.path))).toBe(true);
    expect(unique(REPORTS.map((report) => report.path))).toBe(true);
  });

  it("points every feature at a known entity, report and path", () => {
    const reportKeys = new Set(REPORTS.map((report) => report.key));
    for (const feature of FEATURES) {
      expect(feature.entity || feature.report).toBeTruthy();
      if (feature.entity) {
        expect(entityDef(feature.entity)).toBeDefined();
        expect(featurePath(feature)).toBeTruthy();
        for (const key of Object.keys(feature.fixed ?? {})) expect(entityDef(feature.entity)!.fields.some((field) => field.key === key)).toBe(true);
      }
      if (feature.report) expect(reportKeys.has(feature.report)).toBe(true);
      for (const extra of feature.also ?? []) expect(entityDef(extra)).toBeDefined();
    }
  });

  it("never nests a feature path under an entity id route", () => {
    const entityPaths = ENTITIES.map((entity) => entity.path);
    for (const endpoint of resourceEndpoints()) {
      for (const base of entityPaths) {
        if (endpoint.path !== base) expect(endpoint.path.startsWith(`${base}/`)).toBe(false);
      }
    }
    for (const report of REPORTS) for (const base of entityPaths) expect(report.path.startsWith(`${base}/`)).toBe(false);
  });
});
