import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

/** Calm, clearly styled information panel (e.g. seasonal / regulatory conditions). */
export function Notice({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <aside aria-label={title} className={cn("flex gap-4 rounded-card border border-jute-300 bg-white p-5 md:p-6", className)}>
      <Icon name="info" className="mt-0.5 shrink-0 text-jute-700" />
      <div>
        <p className="font-display font-semibold text-navy-900">{title}</p>
        <div className="mt-2 text-small leading-relaxed text-ink-600">{children}</div>
      </div>
    </aside>
  );
}
