import { Link, NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { BrandLogo } from "../../components/BrandLogo";
import { useI18n } from "../../lib/i18n";
import { usePrefs } from "../../lib/prefs";

export function PublicShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const lang = usePrefs((s) => s.lang);
  const setLang = usePrefs((s) => s.setLang);
  const link = "rounded-md px-3 py-2 text-sm text-text-dim hover:bg-hover hover:text-text";
  return (
    <div className="app-shell min-h-screen">
      <a href="#content" className="sr-only-focusable absolute left-3 top-3 z-50 rounded bg-[var(--brand-gold)] px-3 py-2 text-sm text-[var(--text-on-gold)]">
        Skip to content
      </a>
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/tickets" className="mr-auto flex items-center gap-3">
            <BrandLogo size="sm" align="start" />
            <span className="hidden font-display text-lg uppercase tracking-wide text-[var(--brand-gold)] sm:block">ABG Sports City</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Tickets">
            <NavLink to="/tickets" end className={link}>{t("nav.home")}</NavLink>
            <NavLink to="/tickets/book" className={link}>{t("nav.book")}</NavLink>
            <NavLink to="/tickets/events" className={link}>{t("nav.events")}</NavLink>
            <NavLink to="/tickets/my" className={link}>{t("nav.my")}</NavLink>
            <NavLink to="/tickets/help" className={link}>{t("nav.help")}</NavLink>
          </nav>
          <label className="text-xs text-text-dim">
            <span className="sr-only">{t("lang.switch")}</span>
            <select
              className="rounded-md border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-2 py-2 text-sm"
              value={lang}
              onChange={(event) => setLang(event.target.value === "bn" ? "bn" : "en")}
            >
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
            </select>
          </label>
          <Link to="/login" className="rounded-md border border-[var(--border-gold)] px-3 py-2 text-sm text-[var(--brand-gold)]">{t("nav.signin")}</Link>
        </div>
      </header>
      <main id="content" className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
