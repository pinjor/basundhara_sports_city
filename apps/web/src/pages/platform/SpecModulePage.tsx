import { Link } from "react-router-dom";
import { featureDef, featurePath } from "@bsc/shared";
import { useResourceTotals } from "../../api/resources";
import { useActiveFeature } from "../../hooks/useActiveFeature";
import { DeskHeader } from "../../components/ui/DeskHeader";
import { ResourceFeature } from "./ResourceFeature";

/** Module overview (one card per feature with its record count) or one feature's screen. */
export function SpecModulePage() {
  const { module, feature } = useActiveFeature();
  const features = module?.features ?? [];
  const path = module?.path ?? "";
  const endpoints = features.map((item) => {
    const def = featureDef(item.key);
    return def?.entity ? featurePath(def) : undefined;
  });
  const totals = useResourceTotals(feature ? [] : endpoints.filter((p): p is string => !!p));
  const totalFor = (endpoint: string | undefined) => {
    if (!endpoint) return undefined;
    const index = endpoints.filter((p): p is string => !!p).indexOf(endpoint);
    return totals[index]?.data?.total;
  };

  return (
    <div>
      <DeskHeader
        kicker={module?.label}
        title={feature?.label ?? module?.label ?? ""}
        lede={feature ? undefined : `${features.length} desks`}
        action={feature && <Link to={path} className="text-sm text-gold hover:text-gold-soft">Module overview</Link>}
      />
      {feature ? (
        <ResourceFeature key={feature.key} featureKey={feature.key} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((item, i) => {
            const total = totalFor(endpoints[i]);
            return (
              <Link key={item.key} to={`${path}?feature=${item.key}`} className="hub-card flex min-h-[4.5rem] items-center justify-between gap-3 rounded-xl p-4">
                <span className="min-w-0 font-display text-lg leading-tight text-text">{item.label}</span>
                <span className="shrink-0 text-right">
                  <span className="block font-display text-2xl leading-none text-gold">{endpoints[i] ? (total ?? "…") : "—"}</span>
                  <span className="text-[10px] uppercase tracking-wide text-gold/60">{endpoints[i] ? "records" : "report"}</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
