"use client";

import { useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { SENT_KEY } from "./RfqWizard";

type Summary = { ref: string; email: string; rows: [string, string][] };

const read = (): string | null => {
  try {
    return sessionStorage.getItem(SENT_KEY);
  } catch {
    return null;
  }
};

/** Shows what was sent (kept in this tab's sessionStorage only). */
export function ThankYouSummary() {
  const params = useSearchParams();
  const raw = useSyncExternalStore(() => () => {}, read, () => null);
  const summary: Summary | null = raw ? JSON.parse(raw) : null;
  const ref = summary?.ref ?? params.get("ref");

  return (
    <div>
      {ref && (
        <p className="text-body-l text-ink-600">
          Your reference is <strong className="font-display font-semibold text-navy-900">{ref}</strong>
          {summary?.email ? (
            <>
              . A confirmation is on its way to <strong className="font-medium text-ink-900">{summary.email}</strong>.
            </>
          ) : (
            "."
          )}
        </p>
      )}
      {summary && (
        <div className="mt-10 rounded-card bg-white p-6 ring-1 ring-line md:p-8">
          <h2 className="text-h3">What you sent</h2>
          <dl className="mt-6 grid border-t border-line sm:grid-cols-[12rem_1fr]">
            {summary.rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="pt-3 text-small text-ink-600 sm:border-b sm:border-line sm:py-3 sm:pe-6">{k}</dt>
                <dd className="border-b border-line pb-3 text-ink-900 sm:py-3">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
