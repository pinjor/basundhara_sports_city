import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

type Item = { q: string; a: ReactNode };

/**
 * Accordion built on <details>/<summary>: keyboard operable and announced
 * as expandable by default, and it works without JavaScript.
 */
export function Accordion({ items, className, headingLevel: H = "h3" }: { items: Item[]; className?: string; headingLevel?: "h2" | "h3" }) {
  return (
    <div className={cn("border-t border-line", className)}>
      {items.map((item) => (
        <details key={item.q} className="group border-b border-line">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 [&::-webkit-details-marker]:hidden">
            <H className="text-[1.125rem] leading-snug font-semibold tracking-[-0.01em]">{item.q}</H>
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-navy-900 transition-colors group-hover:border-navy-900">
              <Icon name="plus" size={18} className="transition-transform duration-200 group-open:rotate-45" />
            </span>
          </summary>
          <div className="measure pe-14 pb-6 text-ink-600">{item.a}</div>
        </details>
      ))}
    </div>
  );
}
