import { useState, type ReactNode } from "react";
import { useI18n } from "../../lib/i18n";

export function ChartPanel({
  title,
  caption,
  children,
  table,
}: {
  title: string;
  caption?: string;
  children: ReactNode;
  table: { columns: string[]; rows: (string | number)[][] };
}) {
  const { t } = useI18n();
  const [asTable, setAsTable] = useState(false);
  return (
    <section className="panel p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-text">{title}</h2>
          {caption && <p className="mt-0.5 text-xs text-text-dim">{caption}</p>}
        </div>
        <button type="button" className="rounded-md px-2 py-1 text-xs text-[var(--brand-gold)] hover:bg-hover" onClick={() => setAsTable((value) => !value)}>
          {asTable ? t("common.chart") : t("common.table")}
        </button>
      </div>
      {asTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-text-dim">
                {table.columns.map((column) => (
                  <th key={column} className="px-2 py-2 font-medium">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.length === 0 ? (
                <tr><td className="px-2 py-4 text-text-dim" colSpan={table.columns.length}>{t("common.empty")}</td></tr>
              ) : (
                table.rows.map((row, index) => (
                  <tr key={index} className="border-t border-[var(--border-subtle)]">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-2 py-2 tabular-nums">{cell}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

export function BarChart({ series, label }: { series: { label: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...series.map((item) => item.value));
  if (series.length === 0) return <p className="py-8 text-center text-sm text-text-dim">No recorded values yet.</p>;
  const width = 100;
  const height = 100;
  const slot = width / series.length;
  return (
    <svg viewBox={`0 0 ${width} ${height + 18}`} className="chart-in h-52 w-full" role="img" aria-label={label}>
      {[0.25, 0.5, 0.75, 1].map((mark) => (
        <line key={mark} x1="0" x2={width} y1={height - mark * height} y2={height - mark * height} stroke="var(--border-subtle)" strokeWidth="0.4" />
      ))}
      {series.map((item, index) => {
        const barHeight = (item.value / max) * (height - 4);
        const barWidth = Math.min(slot * 0.55, 16);
        const x = index * slot + (slot - barWidth) / 2;
        const tick = /^\d{4}-\d{2}-\d{2}/.test(item.label) ? item.label.slice(5, 10) : item.label;
        return (
          <g key={item.label}>
            <rect x={x} y={height - barHeight} width={barWidth} height={barHeight} rx="1" fill="url(#goldBar)" />
            <text x={x + barWidth / 2} y={height + 10} textAnchor="middle" fontSize="3.2" fill="var(--text-secondary)">{tick}</text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="goldBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-gold-bright)" />
          <stop offset="100%" stopColor="var(--brand-gold)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function DonutChart({ series, label }: { series: { label: string; value: number; color: string }[]; label: string }) {
  const total = series.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <p className="py-8 text-center text-sm text-text-dim">No recorded values yet.</p>;
  let cursor = 0;
  const radius = 16;
  const circ = 2 * Math.PI * radius;
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 42 42" className="chart-in h-36 w-36" role="img" aria-label={label}>
        <circle cx="21" cy="21" r={radius} fill="none" stroke="var(--surface-secondary)" strokeWidth="6" />
        {series.map((item) => {
          const length = (item.value / total) * circ;
          const dash = `${length} ${circ - length}`;
          const offset = circ * 0.25 - cursor;
          cursor += length;
          return <circle key={item.label} cx="21" cy="21" r={radius} fill="none" stroke={item.color} strokeWidth="6" strokeDasharray={dash} strokeDashoffset={offset} />;
        })}
        <text x="21" y="22" textAnchor="middle" fontSize="5" fill="var(--text-primary)" fontFamily="Rajdhani, sans-serif">{total}</text>
      </svg>
      <ul className="space-y-1 text-sm">
        {series.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
            <span>{item.label}</span>
            <span className="tabular-nums text-text-dim">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 64},${18 - (value / max) * 16}`).join(" ");
  return (
    <svg viewBox="0 0 64 20" className="h-8 w-16" aria-hidden>
      <polyline fill="none" stroke="var(--brand-gold)" strokeWidth="1.6" points={points} />
    </svg>
  );
}
