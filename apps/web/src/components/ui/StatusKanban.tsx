import type { ReactNode } from "react";
import { Button } from "./Button";
import { statusLabel } from "./StatusBadge";

interface StatusKanbanProps<T> {
  columns: string[];
  items: T[];
  statusOf: (item: T) => string;
  keyFor: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  nextStatusFor: (item: T) => string | null;
  onAdvance: (item: T, nextStatus: string) => void;
  advancing?: boolean;
}

/** A linear status pipeline board (Section 2.3) — used where a module's data is a queue, not a table. */
export function StatusKanban<T>({
  columns,
  items,
  statusOf,
  keyFor,
  renderCard,
  nextStatusFor,
  onAdvance,
  advancing,
}: StatusKanbanProps<T>) {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
      style={{ ["--cols" as string]: columns.length }}
    >
      {columns.map((col) => {
        const colItems = items.filter((item) => statusOf(item) === col);
        return (
          <div key={col} className="panel min-w-0 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.16em] text-gold/70">{statusLabel(col)}</h4>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-dim">{colItems.length}</span>
            </div>
            <div className="space-y-2">
              {colItems.map((item) => {
                const next = nextStatusFor(item);
                return (
                  <div key={keyFor(item)} className="rounded-md border border-border-soft bg-surface-2 p-3 text-sm">
                    {renderCard(item)}
                    {next && (
                      <Button
                        variant="secondary"
                        className="mt-2 w-full justify-center text-xs"
                        onClick={() => onAdvance(item, next)}
                        disabled={advancing}
                      >
                        Advance to {statusLabel(next)}
                      </Button>
                    )}
                  </div>
                );
              })}
              {colItems.length === 0 && <p className="text-xs text-text-dimmer">Nothing here.</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
