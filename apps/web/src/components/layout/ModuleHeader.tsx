import type { ReactNode } from "react";
import { useActiveFeature } from "../../hooks/useActiveFeature";
import { ModuleTabs } from "./ModuleTabs";

export function ModuleHeader({ purpose, action }: { purpose: string; action?: ReactNode }) {
  const { module } = useActiveFeature();
  return (
    <header className="feature-hero mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">All records</p>
          <h2 className="mt-1 font-display text-4xl font-semibold">{module?.label ?? "Records"}</h2>
          <p className="mt-2 max-w-2xl text-sm text-text-dim">{purpose}</p>
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
      {module && <div className="mt-4"><ModuleTabs path={module.path} /></div>}
    </header>
  );
}
