import type { ReactNode } from "react";

export function DeskHeader({ kicker, title, lede, action }: { kicker: ReactNode; title: string; lede?: ReactNode; action?: ReactNode }) {
  return (
    <header className="feature-hero mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{kicker}</p>
        <h2 className="mt-1 font-display text-3xl font-semibold gold-foil">{title}</h2>
        {lede && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-dim">{lede}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </header>
  );
}
