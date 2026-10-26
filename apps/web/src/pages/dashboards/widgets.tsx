import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CountUp, HOVER, itemVariants, popVariants } from "../../lib/motion";
import { Ico } from "./icons";

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const ReadOnlyContext = createContext(false);

export function useReadOnly() {
  return useContext(ReadOnlyContext);
}

export function useOutside(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open, onClose]);
  return ref;
}

function useTilt(span = 1) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const tilted = el.classList.contains("tilt");
      if (tilted) el.classList.remove("tilt");
      const spans = [...el.children] as HTMLElement[];
      const over = spans.some((s) => s.firstElementChild && (s.firstElementChild as HTMLElement).offsetWidth > s.clientWidth * span - 4);
      if (tilted) el.classList.add("tilt");
      setTilt(over);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [span]);
  return [ref, tilt] as const;
}

export function Card({
  title,
  icon,
  extra,
  className = "",
  id,
  sub,
  children,
}: {
  title: string;
  icon?: string;
  extra?: ReactNode;
  className?: string;
  id?: string;
  sub?: string;
  children: ReactNode;
}) {
  return (
    <motion.section id={id} className={`card ${className}`} variants={itemVariants} whileHover={HOVER}>
      <header className="card-h">
        <div className="card-t">
          <h3>
            {icon && <Ico name={icon} className="card-ico" />}
            {title}
          </h3>
          {sub && <p className="card-sub">{sub}</p>}
        </div>
        {extra}
      </header>
      <div className="card-b">{children}</div>
    </motion.section>
  );
}

export function Pick({ options, value, onChange, icon }: { options: string[]; value: string; onChange: (v: string) => void; icon?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  return (
    <div className="pick" ref={ref}>
      <button type="button" className="pill" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {icon && <Ico name={icon} className="pill-lead" />}
        {value}
        <Ico name="chevron" className="pill-ico" />
      </button>
      <AnimatePresence>
      {open && (
        <motion.ul className="pop" role="listbox" variants={popVariants} initial="hidden" animate="show" exit="exit">
          {options.map((o) => (
            <li key={o}>
              <button
                type="button"
                role="option"
                aria-selected={o === value}
                className={o === value ? "on" : ""}
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
              >
                {o}
              </button>
            </li>
          ))}
        </motion.ul>
      )}
      </AnimatePresence>
    </div>
  );
}

/** Pick bound to a keyed option list, showing labels. */
export function KeyPick<K extends string>({ options, value, onChange, icon }: { options: Record<K, string>; value: K; onChange: (k: K) => void; icon?: string }) {
  const entries = Object.entries(options) as [K, string][];
  return <Pick options={entries.map(([, label]) => label)} value={options[value]} icon={icon} onChange={(label) => onChange(entries.find(([, l]) => l === label)![0])} />;
}

/** Placeholder while a dashboard loads, or a retry prompt when it fails. */
export function DashStatus({ error, onRetry }: { error?: unknown; onRetry: () => void }) {
  return (
    <div className="dash-status" role={error ? "alert" : "status"}>
      {error ? (
        <>
          <Ico name="alert" />
          <p>Couldn’t load this dashboard.</p>
          <button type="button" className="panel-btn" onClick={onRetry}>Try again</button>
        </>
      ) : (
        <>
          <span className="dash-spin" aria-hidden />
          <p>Loading dashboard…</p>
        </>
      )}
    </div>
  );
}

export function ViewAll({ to, label = "View All" }: { to: string; label?: string }) {
  return (
    <Link to={to} className="view-all">
      {label}
    </Link>
  );
}

export function Badge({ tone, children }: { tone: "green" | "gold" | "red" | "blue" | "grey" | "orange"; children: ReactNode }) {
  return <span className={`badge b-${tone}`}>{children}</span>;
}

export type KpiProps = {
  variant: "stripe" | "spark" | "compact" | "mini";
  icon: string;
  label: string;
  value: string;
  delta?: string;
  down?: boolean;
  bad?: boolean;
  note?: string;
  spark?: number[];
  color?: string;
  to?: string;
  onClick?: () => void;
};

export function Kpi({ to, onClick, ...props }: KpiProps) {
  const card = <KpiCard {...props} />;
  if (to) return <Link to={to} className="kpi-link" aria-label={`${props.label}: ${props.value}`}>{card}</Link>;
  if (onClick) return <button type="button" className="kpi-link" onClick={onClick} aria-label={`${props.label}: ${props.value}`}>{card}</button>;
  return card;
}

function KpiCard({ variant, icon, label, value, delta, down, bad, note, spark, color = "#f2b81d" }: Omit<KpiProps, "to" | "onClick">) {
  const tone = bad ? "down" : "up";
  const arrow = down ? "arrowDown" : "arrowUp";
  const style = { ["--a" as string]: color };
  if (variant === "stripe")
    return (
      <motion.article className="kpi kpi-stripe" style={style} variants={itemVariants} whileHover={HOVER}>
        <span className="kpi-ico"><Ico name={icon} /></span>
        <div className="kpi-txt">
          <span className="kpi-l">{label}</span>
          <b className="kpi-v"><CountUp value={value} /></b>
          {delta ? (
            <>
              <em className={tone}><Ico name={down ? "arrowDown" : "trend"} className="kpi-arrow" />{down ? "-" : "+"}{delta}</em>
              <small>vs. previous period</small>
            </>
          ) : (
            <small>No earlier period to compare</small>
          )}
        </div>
      </motion.article>
    );
  if (variant === "spark")
    return (
      <motion.article className="kpi kpi-spark" style={style} variants={itemVariants} whileHover={HOVER}>
        <div className="kpi-top">
          <span className="kpi-ico line"><Ico name={icon} /></span>
          {delta && <span className={`chg ${tone}`}><Ico name={arrow} className="kpi-arrow" />{delta}</span>}
        </div>
        <span className="kpi-l">{label}</span>
        <div className="kpi-row">
          <b className="kpi-v"><CountUp value={value} /></b>
          {spark && <Spark values={spark} color={bad ? "#f0444a" : color} />}
        </div>
        {note && <small>{note}</small>}
      </motion.article>
    );
  return (
    <motion.article className={`kpi kpi-${variant}`} style={style} variants={itemVariants} whileHover={HOVER}>
      <span className="kpi-ico line"><Ico name={icon} /></span>
      <div className="kpi-txt">
        <b className="kpi-v"><CountUp value={value} /></b>
        <span className="kpi-l">{label}</span>
        {delta && <em className={tone}><Ico name={arrow} className="kpi-arrow" />{delta}</em>}
      </div>
      {spark && <Spark values={spark} color={color} />}
    </motion.article>
  );
}

export function Spark({ values, color = "#f2b81d" }: { values: number[]; color?: string }) {
  const id = useId().replace(/:/g, "");
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${26 - ((v - min) / (max - min || 1)) * 22}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="spark" aria-hidden>
      <defs>
        <linearGradient id={`sg${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,30 ${pts} 100,30`} fill={`url(#sg${id})`} />
      <polyline className="draw" pathLength={1} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" points={pts} />
    </svg>
  );
}

export type Series = { name: string; color: string; values: number[] };

export function Line({
  series,
  labels,
  axis,
  max,
  legend = true,
  fmt = (v: number) => String(v),
  tick = 1,
}: {
  series: Series[];
  labels: string[];
  axis: string[];
  max: number;
  legend?: boolean;
  fmt?: (v: number) => string;
  tick?: number;
}) {
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const x = (i: number) => (i / (labels.length - 1)) * 100;
  const y = (v: number) => (1 - Math.min(v, max) / max) * 100;
  return (
    <div className="chart">
      {legend && (
        <div className="legend">
          {series.map((s) => (
            <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>
          ))}
        </div>
      )}
      <div className="cols">
        <div className="cols-ax">
          {axis.map((a, n) => <span key={a + n}>{a}</span>)}
        </div>
        <div className="cols-main">
          <div
            className="cols-plot line-plot"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setHover(Math.round(((e.clientX - r.left) / r.width) * (labels.length - 1)));
            }}
            onMouseLeave={() => setHover(null)}
          >
            {axis.map((a, n) => <i key={a + n} className="grid-ln" style={{ top: `${(n / (axis.length - 1)) * 100}%` }} />)}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="cols-line" aria-hidden>
              <defs>
                {series.map((s, n) => (
                  <linearGradient key={s.name} id={`lg${gid}${n}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor={s.color} stopOpacity="0.34" />
                    <stop offset="1" stopColor={s.color} stopOpacity="0" />
                  </linearGradient>
                ))}
              </defs>
              {series.map((s, n) => {
                const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
                return (
                  <g key={s.name}>
                    <polygon points={`0,100 ${pts} 100,100`} fill={`url(#lg${gid}${n})`} className="fade-in" />
                    <polyline className="draw" pathLength={1} points={pts} fill="none" stroke={s.color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                  </g>
                );
              })}
            </svg>
            {series.map((s) =>
              s.values.map((v, i) => (
                <i key={s.name + i} className={`ln-dot ${hover === i ? "on" : ""}`} style={{ left: `${x(i)}%`, top: `${y(v)}%`, background: s.color }} />
              )),
            )}
            {hover !== null && (
              <div className="tip" style={{ left: `${x(hover)}%` }}>
                <b>{labels[hover]}</b>
                {series.map((s) => (
                  <span key={s.name}><i style={{ background: s.color }} />{s.name}: {fmt(s.values[hover])}</span>
                ))}
              </div>
            )}
          </div>
          <div className="cols-x spread">
            {labels.map((label, i) => <span key={label + i}>{i % tick === 0 ? label : ""}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export type Part = { label: string; pct: number; color: string; value?: string };

export function Donut({
  parts,
  center,
  caption,
  thick = 14,
  legend = true,
  gap = 0.6,
  stacked = false,
}: {
  parts: Part[];
  center: string;
  caption: string;
  thick?: number;
  legend?: boolean;
  gap?: number;
  stacked?: boolean;
}) {
  const r = 50 - thick / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="donut">
      <div className="donut-svg">
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#1d2027" strokeWidth={thick} />
          {parts.map((p, i) => {
            const len = Math.max((p.pct / 100) * c - gap, 0.1);
            const off = -(acc / 100) * c;
            acc += p.pct;
            return (
              <circle
                key={p.label}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={p.color}
                strokeWidth={thick}
                strokeDasharray={`${len} ${c}`}
                strokeDashoffset={off}
                transform="rotate(-90 50 50)"
                className="seg"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <title>{`${p.label}: ${p.value ?? `${p.pct}%`}`}</title>
              </circle>
            );
          })}
        </svg>
        <span className="donut-c">
          <b>{center}</b>
          <small>{caption}</small>
        </span>
      </div>
      {legend && (
        <ul className={`donut-l ${stacked ? "two" : ""}`}>
          {parts.map((p) => (
            <li key={p.label}>
              <i style={{ background: p.color }} />
              <span>{p.label}</span>
              <b>{p.value ?? `${p.pct}%`}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Cols({
  labels,
  series,
  axis,
  max,
  line,
  showValues = false,
  legend = true,
  wide = false,
  tick = 1,
}: {
  labels: string[];
  series: Series[];
  axis?: string[];
  max?: number;
  line?: Series;
  showValues?: boolean;
  legend?: boolean;
  wide?: boolean;
  tick?: number;
}) {
  const top = max ?? Math.max(...series.flatMap((s) => s.values), ...(line?.values ?? []), 1);
  const [xRef, tilt] = useTilt(tick);
  const linePts = line?.values.map((v, i) => `${((i + 0.5) / labels.length) * 100},${100 - (v / top) * 100}`).join(" ");
  return (
    <div className="chart">
      {legend && (series.length > 1 || line) && (
        <div className="legend">
          {series.map((s) => (
            <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>
          ))}
          {line && <span><i className="ln" style={{ background: line.color }} />{line.name}</span>}
        </div>
      )}
      <div className="cols">
        {axis && (
          <div className="cols-ax">
            {axis.map((a, n) => <span key={a + n}>{a}</span>)}
          </div>
        )}
        <div className="cols-main">
          <div className="cols-plot">
            {axis && axis.map((a, n) => <i key={a + n} className="grid-ln" style={{ top: `${(n / (axis.length - 1)) * 100}%` }} />)}
            {labels.map((label, i) => (
              <div key={label + i} className="col-g">
                {series.map((s, n) => (
                  <div
                    key={s.name}
                    className={`col-b ${wide ? "wide" : ""}`}
                    data-tip={`${label} · ${s.name}: ${s.values[i]}`}
                    style={{ height: `${(s.values[i] / top) * 100}%`, background: s.color, animationDelay: `${i * 35 + n * 15}ms` }}
                  >
                    {showValues && <span className="col-v">{s.values[i]}</span>}
                  </div>
                ))}
              </div>
            ))}
            {linePts && line && (
              <>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="cols-line" aria-hidden>
                  <polyline className="draw" fill="none" stroke={line.color} strokeWidth="2" vectorEffect="non-scaling-stroke" points={linePts} />
                </svg>
                {line.values.map((v, i) => (
                  <i
                    key={i}
                    className="ln-dot on line-pt"
                    data-tip={`${labels[i]} · ${line.name}: ${v}`}
                    style={{ left: `${((i + 0.5) / labels.length) * 100}%`, top: `${100 - (v / top) * 100}%`, background: line.color }}
                  />
                ))}
              </>
            )}
          </div>
          <div ref={xRef} className={`cols-x ${tick > 1 ? "ticked" : ""} ${tilt ? "tilt" : ""}`}>
            {labels.map((label, i) => <span key={label + i} title={label}><em>{i % tick === 0 ? label : ""}</em></span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Bars({ rows, rank = false }: { rows: { label: string; value: string; pct: number; color?: string; icon?: string }[]; rank?: boolean }) {
  return (
    <div className="hbar">
      {rows.map((row, i) => (
        <div key={row.label} className={rank ? "rank" : ""} data-tip={`${row.label}: ${row.value}`}>
          {rank && <span className="rank-n">{i + 1}</span>}
          {row.icon && <Ico name={row.icon} className="hbar-ico" />}
          <span className="hbar-l">{row.label}</span>
          <s><i style={{ width: `${row.pct}%`, background: row.color ?? "#f2b81d", animationDelay: `${i * 60}ms` }} /></s>
          <span className="hbar-v">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Ring({ pct, color, label, to }: { pct: number; color: string; label: string; to?: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const body = (
    <>
      <div className="ring-svg">
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#24272e" strokeWidth="9" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 50 50)" className="seg" />
        </svg>
        <b>{pct}%</b>
      </div>
      <span>{label}</span>
    </>
  );
  if (to) return <Link to={to} className="rng" data-tip={`${label}: ${pct}% · open schedule`}>{body}</Link>;
  return <div className="rng" data-tip={`${label}: ${pct}%`}>{body}</div>;
}

export function Quick({ icon, label, to, onClick }: { icon: string; label: string; to?: string; onClick?: () => void }) {
  const body = (
    <>
      <Ico name={icon} className="q-ico" />
      <span>{label}</span>
      <Ico name="chevronR" className="q-go" />
    </>
  );
  if (to) return <Link to={to} className="quick">{body}</Link>;
  return <button type="button" className="quick" onClick={onClick}>{body}</button>;
}

export function RowMenu({ items }: { items: { label: string; icon: string; onClick: () => void }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  return (
    <div className="pick" ref={ref}>
      <button type="button" className="dots" aria-label="Row actions" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Ico name="dots" strokeWidth={3} />
      </button>
      <AnimatePresence>
      {open && (
        <motion.ul className="pop right" variants={popVariants} initial="hidden" animate="show" exit="exit">
          {items.map((it) => (
            <li key={it.label}>
              <button type="button" onClick={() => { setOpen(false); it.onClick(); }}>
                <Ico name={it.icon} className="pop-ico" />
                {it.label}
              </button>
            </li>
          ))}
        </motion.ul>
      )}
      </AnimatePresence>
    </div>
  );
}

export function Sheet({ open, title, onClose, children, wide = false }: { open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ro = useReadOnly();
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, onClose]);
  return createPortal(
    <AnimatePresence>
    {open && (
    <motion.div className="sheet-bg" onMouseDown={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.18 } }}>
      <motion.div
        className={`sheet ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 380, damping: 32 } }}
        exit={{ opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.16 } }}
      >
        <header>
          <h3>{title}</h3>
          <button type="button" className="dots" aria-label="Close" onClick={onClose} autoFocus><Ico name="x" /></button>
        </header>
        <div className="sheet-b">
          {ro && <p className="ro-note"><Ico name="lock" />View only · changes are made by the department team</p>}
          {children}
        </div>
      </motion.div>
    </motion.div>
    )}
    </AnimatePresence>,
    document.querySelector(".dash") ?? document.body,
  );
}

export function Fields({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="fields">
      {rows.map(([k, v]) => (
        <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
      ))}
    </dl>
  );
}
