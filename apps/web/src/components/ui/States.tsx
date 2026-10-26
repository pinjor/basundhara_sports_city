import type { ReactNode } from "react";
import { Button } from "./Button";

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="skeleton h-16 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="panel px-6 py-10 text-center">
      <p className="text-lg font-semibold text-text">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-sm text-text-dim">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-[var(--status-danger)] bg-[color-mix(in_srgb,var(--status-danger)_12%,transparent)] px-4 py-4" role="alert">
      <p className="text-sm text-[var(--status-danger)]">{message}</p>
      {onRetry && (
        <Button type="button" variant="secondary" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
