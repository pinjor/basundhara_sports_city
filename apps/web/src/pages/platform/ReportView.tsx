import { useState } from "react";
import type { ReportDef } from "@bsc/shared";
import { useReport } from "../../api/resources";
import { ErrorState, LoadingSkeleton } from "../../components/ui/States";
import { apiErrorMessage } from "../../lib/apiError";
import { useI18n } from "../../lib/i18n";
import { reportCell } from "./resourceFormat";

const SELECT = "mt-1 min-h-11 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3";
const PREVIEW_ROWS = 100;
const label = (option: string) => option.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

/** A server report: optional filters, summary tiles and a table. */
export function ReportView({ report }: { report: ReportDef }) {
  const { lang } = useI18n();
  const [params, setParams] = useState<Record<string, string>>(() =>
    Object.fromEntries((report.params ?? []).filter((p) => p.options?.length).map((p) => [p.key, p.options![0]!])),
  );
  const [showAll, setShowAll] = useState(false);
  const result = useReport(report.path, params);

  return (
    <section className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h3 className="text-lg font-semibold text-text">{result.data?.title ?? report.label}</h3>
        {(report.params ?? []).filter((p) => p.options?.length).map((param) => (
          <label key={param.key} className="w-full text-sm sm:w-56">
            {param.label}
            <select value={params[param.key] ?? ""} onChange={(e) => setParams((current) => ({ ...current, [param.key]: e.target.value }))} className={SELECT}>
              {param.options!.map((option) => <option key={option} value={option}>{label(option)}</option>)}
            </select>
          </label>
        ))}
      </div>
      {result.isLoading && <LoadingSkeleton />}
      {result.isError && <ErrorState message={apiErrorMessage(result.error, "Could not load the report.")} onRetry={() => void result.refetch()} />}
      {result.data && (
        <>
          {!!result.data.summary?.length && (
            <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {result.data.summary.map((item) => (
                <div key={item.label} className="panel min-w-0 p-3">
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-text-dim">{item.label}</dt>
                  <dd className="mt-1 truncate font-display text-xl text-gold">{reportCell(item.value, item.kind, lang)}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--border-strong)]">
            <table className="w-full min-w-[640px] border-collapse whitespace-nowrap text-sm">
              <thead>
                <tr className="border-b border-[var(--border-strong)] text-left text-xs uppercase tracking-[0.14em] text-text-dim">
                  {result.data.columns.map((column) => <th key={column.key} className="px-3 py-3 font-medium">{column.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {result.data.rows.length === 0 ? (
                  <tr><td colSpan={result.data.columns.length} className="px-3 py-8 text-center text-text-dim">Nothing to report yet.</td></tr>
                ) : result.data.rows.slice(0, showAll ? undefined : PREVIEW_ROWS).map((row, i) => (
                  <tr key={i} className="border-b border-[var(--border-strong)] last:border-0">
                    {result.data.columns.map((column) => <td key={column.key} className="px-3 py-3">{reportCell(row[column.key], column.kind, lang)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.data.rows.length > PREVIEW_ROWS && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 min-h-9 text-sm text-gold hover:text-gold-soft">
              {showAll ? "Show fewer rows" : `Show all ${result.data.rows.length} rows`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
