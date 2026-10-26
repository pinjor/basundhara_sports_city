import { Role, entityDef, featureCanCreate, featureDef, featureFields, featurePath, reportDef, type EntityDef } from "@bsc/shared";
import { useActiveFeature } from "../../hooks/useActiveFeature";
import { useAuthStore } from "../../store/auth";
import { ReportView } from "./ReportView";
import { ResourceRegister } from "./ResourceRegister";

function useCanWrite() {
  const role = useAuthStore((s) => s.user?.role);
  return (entity: EntityDef) => role === Role.SUPER_ADMIN || (!!role && entity.writeRoles.includes(role as Role));
}

/** One module feature from the shared registry: its report, its register and any supporting registers. */
export function ResourceFeature({ featureKey }: { featureKey: string }) {
  const canWrite = useCanWrite();
  const feature = featureDef(featureKey);
  if (!feature) return <p className="text-sm text-text-dim">This feature is not on the module list.</p>;

  const entity = feature.entity ? entityDef(feature.entity) : undefined;
  const path = featurePath(feature);
  const report = feature.report ? reportDef(feature.report) : undefined;
  const supporting = (feature.also ?? []).map(entityDef).filter((e): e is EntityDef => !!e);

  return (
    <div>
      <p className="mb-4 max-w-3xl text-sm text-text-dim">{feature.blurb}</p>
      {report && <ReportView report={report} />}
      {entity && path && (
        <ResourceRegister
          key={path}
          entity={entity}
          path={path}
          fields={featureFields(feature)}
          canWrite={canWrite(entity)}
          canCreate={featureCanCreate(feature)}
          title={report || supporting.length ? `${entity.label}s` : undefined}
        />
      )}
      {supporting.map((also) => (
        <ResourceRegister key={also.path} entity={also} path={also.path} fields={also.fields} canWrite={canWrite(also)} title={`${also.label}s`} />
      ))}
    </div>
  );
}

/** Whether a feature key is served by the registry rather than a bespoke screen. */
export const isRegistryFeature = (key: string | null | undefined) => {
  const feature = key ? featureDef(key) : undefined;
  return !!feature && !!(feature.entity || feature.report);
};

/** The active registry feature, shown above a bespoke screen that hosts several features. */
export function FeatureStrip() {
  const { feature } = useActiveFeature();
  if (!feature || !isRegistryFeature(feature.key)) return null;
  return (
    <section className="mb-8 border-b border-[var(--border-strong)] pb-6">
      <h2 className="mb-2 text-xl font-semibold text-text">{feature.label}</h2>
      <ResourceFeature key={feature.key} featureKey={feature.key} />
    </section>
  );
}
