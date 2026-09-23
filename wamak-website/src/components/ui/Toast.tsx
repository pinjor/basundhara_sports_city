"use client";

import { ui, useUi } from "@/lib/ui-store";
import { Icon } from "./Icon";

/** Confirms an RFQ-list addition and offers a shortcut to the list. */
export function Toast() {
  const { toast } = useUi();
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-24 z-40 flex justify-center xl:bottom-8">
      {toast && (
        <div
          key={toast.id}
          className="surface-navy pointer-events-auto flex w-full max-w-md animate-[toast-in_250ms_var(--ease-out-soft)] items-center gap-3 rounded-card py-3 ps-4 pe-2 shadow-[0_20px_40px_-24px_rgb(3_23_56/0.6)]"
        >
          <Icon name="check" size={20} className="shrink-0 text-jute-300" />
          <p className="flex-1 text-small text-ivory-50">{toast.message}</p>
          <button
            type="button"
            onClick={ui.openDrawer}
            className="inline-flex min-h-11 items-center rounded-control px-3 text-small font-semibold text-ivory-50 underline decoration-jute-300 underline-offset-4 hover:bg-navy-800"
          >
            View list
          </button>
          <button
            type="button"
            onClick={ui.dismissToast}
            aria-label="Dismiss"
            className="inline-grid size-11 place-items-center rounded-control text-navy-200 hover:bg-navy-800 hover:text-ivory-50"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
