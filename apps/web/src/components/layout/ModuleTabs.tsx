import { Link, useLocation } from "react-router-dom";

/** Switches a module between its feature desks and the full record manager (`?view=records`). */
export function ModuleTabs({ path }: { path: string }) {
  const { search } = useLocation();
  const records = new URLSearchParams(search).get("view") === "records";
  const tab = (on: boolean) =>
    `inline-flex min-h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors ${
      on ? "border-gold bg-gold/10 text-gold" : "border-[var(--border-strong)] text-text-dim hover:border-gold/60 hover:text-text"
    }`;
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Module view">
      <Link to={path} className={tab(!records)} aria-current={!records ? "page" : undefined}>Desks</Link>
      <Link to={`${path}?view=records`} className={tab(records)} aria-current={records ? "page" : undefined}>All records</Link>
    </nav>
  );
}
