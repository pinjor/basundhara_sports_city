import { useEffect, useState, type ReactNode, type SVGProps } from "react";
import { Link, useLocation } from "react-router-dom";
import { ROLE_LABELS, Role, canAccessModule, findModuleByPath } from "@bsc/shared";
import { useAuthStore } from "../../store/auth";
import { signOut } from "../../lib/api";
import { useSearch } from "../../api/operations";
import { useI18n } from "../../lib/i18n";
import { usePrefs } from "../../lib/prefs";
import { displayName } from "../../lib/user";
import { Icon as Glyph } from "../ui/Icon";

function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      {children}
    </svg>
  );
}

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
      <path d="M8 3.5v3.2M16 3.5v3.2M3.5 10h17" />
    </Icon>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.2" />
      <path d="M16.2 16.2 20.5 20.5" />
    </Icon>
  );
}

function InboxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 6.5 12 13l8-6.5" />
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    </Icon>
  );
}

function ApprovalsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="6" y="3.5" width="12" height="17" rx="1.8" />
      <path d="M9 3.5h6v2.2H9zM9 11h6M9 14.5h4.5" />
    </Icon>
  );
}

function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8.2" r="3.1" />
      <path d="M5.5 19.2c.8-3.2 3-4.8 6.5-4.8s5.7 1.6 6.5 4.8" />
    </Icon>
  );
}

function ChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7 9.5 12 14.5 17 9.5" />
    </Icon>
  );
}

function SignOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M10 12h10.5M16.5 8.5 20.5 12l-4 3.5" />
      <path d="M13 6.2V5.2A2.2 2.2 0 0 0 10.8 3H5.2A2.2 2.2 0 0 0 3 5.2v13.6A2.2 2.2 0 0 0 5.2 21h5.6A2.2 2.2 0 0 0 13 18.8v-1" />
    </Icon>
  );
}

export function TopBar({ title, onMenu }: { title: string; onMenu?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const { t } = useI18n();
  const location = useLocation();
  const lang = usePrefs((s) => s.lang);
  const theme = usePrefs((s) => s.theme);
  const setLang = usePrefs((s) => s.setLang);
  const setTheme = usePrefs((s) => s.setTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [q, setQ] = useState("");
  const { data: results } = useSearch(q);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hits = (results
    ? [
        ...results.bookings.map((b) => ({ to: b.eventPack ? `/?view=events&event=${b.eventPack.id}` : "/bookings", label: `${b.customerName} · booking` })),
        ...results.facilities.map((f) => ({ to: "/facilities", label: `${f.name} · ${f.type}` })),
        ...results.members.map((m) => ({ to: "/membership", label: `${m.name} · member` })),
        ...results.visitors.map((v) => ({ to: v.eventPackId ? `/?view=events&event=${v.eventPackId}` : "/visitors", label: `${v.name} · visitor` })),
        ...results.vips.map((v) => ({ to: "/vip", label: `${v.name} · VIP` })),
        ...results.equipment.map((e) => ({ to: "/surfaces", label: `${e.name} · equipment` })),
        ...results.vehicles.map((v) => ({ to: "/fleet", label: `${v.type} · ${v.driverName ?? "vehicle"}` })),
      ]
    : []
  ).filter((hit) => {
    const path = hit.to.split("?")[0] || "/";
    const module = findModuleByPath(path);
    return module ? canAccessModule(user?.role, module.key) : false;
  });
  const showOpsLinks = canAccessModule(user?.role, "tasks") && canAccessModule(user?.role, "approvals");

  return (
    <header className="relative flex min-h-16 flex-wrap items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 sm:px-5 lg:flex-nowrap lg:py-0">
      {onMenu && (
        <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[var(--brand-gold)] lg:hidden" aria-label={t("shell.menu")} onClick={onMenu}>
          <Glyph name="menu" className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1 lg:flex-none lg:shrink">
        <p className="truncate text-[10px] uppercase tracking-[0.16em] text-text-dim">{location.pathname}</p>
        <h1 className="truncate font-display text-xl font-semibold uppercase leading-none tracking-wide text-[var(--brand-gold)]">{title}</h1>
      </div>

      <div className="relative min-w-0 basis-full lg:basis-auto lg:flex-1">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--primary-gold)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search.placeholder")}
          aria-label={t("search.placeholder")}
          className="topbar-search h-9 w-full rounded-full pl-10 pr-4 text-sm outline-none"
        />
        {q.trim().length >= 2 && (
          <div className="topbar-results absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-xl p-2">
            {hits.length === 0 ? (
              <p className="px-2 py-2 text-xs text-[var(--secondary-text)]">No matches.</p>
            ) : (
              hits.slice(0, 12).map((hit) => (
                <Link
                  key={`${hit.to}-${hit.label}`}
                  to={hit.to}
                  onClick={() => setQ("")}
                  className="block rounded-md px-2 py-1.5 text-sm text-[var(--primary-text)]"
                >
                  {hit.label}
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-1 text-[var(--primary-gold)] lg:shrink-0 lg:flex-nowrap">
        {showOpsLinks && (
          <>
            <Link to="/tasks" className="topbar-link inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm">
              <InboxIcon className="h-4 w-4" />
              Tasks
            </Link>
            <span className="h-5 w-px bg-[var(--divider)]" />
            <Link to="/approvals" className="topbar-link inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm">
              <ApprovalsIcon className="h-4 w-4" />
              Approvals
            </Link>
            <span className="h-5 w-px bg-[var(--divider)]" />
          </>
        )}
        <span className="px-2.5 font-display text-sm tabular-nums tracking-wide" suppressHydrationWarning>
          {now.toLocaleTimeString("en-GB", { hour12: false })}
        </span>
        <span className="h-5 w-px bg-[var(--divider)]" />
        <label className="text-xs text-[var(--brand-gold)]">
          <span className="sr-only">{t("lang.switch")}</span>
          <select aria-label={t("lang.switch")} className="min-h-10 rounded-md bg-transparent px-1" value={lang} onChange={(event) => setLang(event.target.value === "bn" ? "bn" : "en")}>
            <option value="en">EN</option>
            <option value="bn">বাং</option>
          </select>
        </label>
        <button type="button" className="topbar-link inline-flex h-10 w-10 items-center justify-center rounded-full" aria-label={theme === "dark" ? t("theme.light") : t("theme.dark")} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          <Glyph name={theme === "dark" ? "sun" : "moon"} className="h-4 w-4" />
        </button>
        <div className="relative">
          <button type="button" className="topbar-link flex items-center gap-2 rounded-full px-2 py-1 text-left" aria-expanded={menuOpen} aria-haspopup="menu" onClick={() => setMenuOpen((open) => !open)}>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-gold)]">
              <UserIcon className="h-4 w-4" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-medium text-[var(--primary-gold)]">{displayName(user, "Guest")}</span>
              <span className="block text-[11px] text-[var(--secondary-text)]">{ROLE_LABELS[(user?.role as Role) ?? Role.READ_ONLY_EXECUTIVE]}</span>
            </span>
            <ChevronIcon className="h-4 w-4 text-[var(--secondary-text)]" />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 top-full z-40 mt-2 min-w-44 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-1 shadow-[var(--shadow-pop)]">
              <Link role="menuitem" to="/tickets" className="block rounded-md px-3 py-2 text-sm" onClick={() => setMenuOpen(false)}>{t("nav.tickets")}</Link>
              <button role="menuitem" type="button" className="block w-full rounded-md px-3 py-2 text-left text-sm" onClick={signOut}>{t("shell.signout")}</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
