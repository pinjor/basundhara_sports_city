import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { NAV, ROLE_LABELS, Role, canAccessModule, findModuleByPath } from "@bsc/shared";
import { useSearch, type SearchResults } from "../../api/operations";
import { useAuthStore } from "../../store/auth";
import { signOut as endSession } from "../../lib/api";
import { BrandLogo } from "../../components/BrandLogo";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "../../api/notifications";
import { useDashPrefs } from "../../api/settings";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { PageMotion, popVariants } from "../../lib/motion";
import { initials } from "./format";
import { Ico } from "./icons";
import { useOutside } from "./widgets";
import { displayName } from "../../lib/user";
import "./dash.css";

export type DashItem = { label: string; to: string; icon: string; section?: string };

const FINANCE: DashItem[] = [
  { label: "Dashboard", to: "/finance", icon: "home" },
  { label: "Accounts", to: "/finance?feature=chart-of-accounts", icon: "bank", section: "Modules" },
  { label: "Finance", to: "/finance?feature=revenue-management", icon: "wallet" },
  { label: "Reports", to: "/finance?feature=financial-reports", icon: "bars" },
  { label: "Budget Management", to: "/finance?feature=budget-management", icon: "pie" },
  { label: "Invoices", to: "/finance?feature=invoice-management", icon: "file" },
  { label: "Payments", to: "/finance?feature=payment-tracking", icon: "card" },
  { label: "Receivables", to: "/finance?feature=receivable-management", icon: "download" },
  { label: "Payables", to: "/finance?feature=payable-management", icon: "upload" },
  { label: "Settings", to: "/finance?view=settings", icon: "gear", section: "System" },
  { label: "Help & Support", to: "/finance?view=help", icon: "help" },
];

const HR: DashItem[] = [
  { label: "Dashboard", to: "/hrm", icon: "home" },
  { label: "Employees", to: "/hrm?feature=employee-master", icon: "users" },
  { label: "Attendance", to: "/hrm?feature=attendance-management", icon: "calendar" },
  { label: "Leave Management", to: "/hrm?feature=leave-management", icon: "calCheck" },
  { label: "Recruitment", to: "/hrm?feature=recruitment-management", icon: "userPlus" },
  { label: "Performance", to: "/hrm?feature=performance-management", icon: "target" },
  { label: "Training & Development", to: "/hrm?feature=training-management", icon: "cap" },
  { label: "Payroll", to: "/hrm?feature=payroll-integration", icon: "money" },
  { label: "Reports", to: "/hrm?feature=hr-reports", icon: "bars" },
  { label: "Settings", to: "/hrm?view=settings", icon: "gear" },
];

const BOOKING: DashItem[] = [
  { label: "Dashboard", to: "/bookings", icon: "home" },
  { label: "Booking", to: "/bookings?feature=online-booking", icon: "calendar" },
  { label: "All Bookings", to: "/bookings?view=records", icon: "file" },
  { label: "Tickets", to: "/ticketing", icon: "ticket" },
  { label: "Members", to: "/membership", icon: "users" },
  { label: "Venues", to: "/facilities", icon: "stadium" },
  { label: "Events", to: "/ticketing/events", icon: "star" },
  { label: "Reports", to: "/ticketing/reports", icon: "trend" },
  { label: "Settings", to: "/bookings?view=settings", icon: "gear" },
];

const SECURITY: DashItem[] = [
  { label: "Dashboard", to: "/security", icon: "camera" },
  { label: "Camera Monitoring", to: "/security#live", icon: "camera" },
  { label: "Crowd Analytics", to: "/security#analytics", icon: "sparkle" },
  { label: "Recent Alerts", to: "/security#incidents", icon: "alert" },
  { label: "Incidents & Registers", to: "/security?view=records", icon: "file" },
  { label: "Access Control", to: "/security#access", icon: "lock" },
  { label: "People Tracking", to: "/security#people", icon: "pin" },
  { label: "Vehicle Monitoring", to: "/security#vehicles", icon: "car" },
  { label: "Perimeter Security", to: "/security#perimeter", icon: "shield" },
  { label: "Reports", to: "/security#reports", icon: "report" },
  { label: "Settings", to: "/security?view=settings", icon: "gear" },
];

const CHAIR: DashItem[] = [
  { label: "Chairman Overview", to: "/chairman", icon: "crown" },
  { label: "Revenue & Finance", to: "/chairman/revenue", icon: "wallet", section: "Departments" },
  { label: "People & HR", to: "/chairman/hr", icon: "users" },
  { label: "Booking & Ticketing", to: "/chairman/booking", icon: "ticket" },
  { label: "Security", to: "/chairman/security", icon: "shield" },
  { label: "Settings", to: "/chairman?view=settings", icon: "gear", section: "System" },
  { label: "Help & Support", to: "/chairman?view=help", icon: "help" },
];

const MODULE_ICONS: Record<string, string> = {
  "ticketing-overview": "ticket",
  "ticketing-events": "star",
  "ticketing-orders": "file",
  "ticketing-payments": "card",
  "ticketing-scan": "scan",
  "ticketing-reports": "report",
  calendar: "calendar",
  approvals: "calCheck",
  tasks: "check",
  zones: "pin",
  facilities: "stadium",
  surfaces: "layers",
  bookings: "calendar",
  membership: "swim",
  gates: "lock",
  visitors: "users",
  vip: "crown",
  lounges: "building",
  outlets: "plate",
  parking: "car",
  fleet: "compass",
  finance: "money",
  procurement: "box",
  hrm: "userPlus",
};

const BACK_OFFICE = new Set(["finance", "procurement", "hrm"]);

function adminModules(): DashItem[] {
  let last = "";
  return NAV.flatMap((group) =>
    group.modules.map((mod) => {
      const section = BACK_OFFICE.has(group.key) ? "Back Office" : group.label;
      const item = { label: mod.label, to: mod.path, icon: MODULE_ICONS[mod.key] ?? "layers", section: section !== last ? section : undefined };
      last = section;
      return item;
    }),
  );
}

const ADMIN: DashItem[] = [
  { label: "Overview", to: "/", icon: "home" },
  { label: "Event Operations", to: "/?view=events", icon: "activity" },
  { label: "Executive Overview", to: "/chairman", icon: "crown", section: "Dashboards" },
  { label: "Revenue & Finance", to: "/chairman/revenue", icon: "wallet" },
  { label: "People & HR", to: "/chairman/hr", icon: "users" },
  { label: "Booking & Ticketing", to: "/chairman/booking", icon: "ticket" },
  { label: "Security Centre", to: "/security", icon: "shield" },
  ...adminModules(),
  { label: "Settings", to: "/?view=settings", icon: "gear", section: "System" },
  { label: "Help & Support", to: "/?view=help", icon: "help" },
];

type Spec = { items: DashItem[]; home: string; search: string; art: string; artPos: string; side: string };

const SPEC: Record<string, Spec> = {
  [Role.FINANCE_CONTROLLER]: {
    items: FINANCE,
    home: "/finance",
    search: "Search here...",
    art: "/dash/rail-revenue.jpg",
    artPos: "center bottom",
    side: "16.5vw",
  },
  [Role.HR_MANAGER]: {
    items: HR,
    home: "/hrm",
    search: "Search HR desks...",
    art: "/dash/rail-hr.jpg",
    artPos: "center bottom",
    side: "15.5vw",
  },
  [Role.BOOKINGS_OFFICER]: {
    items: BOOKING,
    home: "/bookings",
    search: "Search bookings, members, venues...",
    art: "/dash/rail-booking.jpg",
    artPos: "54% bottom",
    side: "15vw",
  },
  [Role.SECURITY_MANAGER]: {
    items: SECURITY,
    home: "/security",
    search: "Search security pages...",
    art: "/dash/rail-security.jpg",
    artPos: "28% bottom",
    side: "16vw",
  },
  [Role.CHAIRMAN]: {
    items: CHAIR,
    home: "/chairman",
    search: "Search departments, venues, members...",
    art: "/dash/rail-booking.jpg",
    artPos: "54% bottom",
    side: "15.5vw",
  },
  [Role.SUPER_ADMIN]: {
    items: ADMIN,
    home: "/",
    search: "Search modules, dashboards...",
    art: "/dash/rail-revenue.jpg",
    artPos: "center bottom",
    side: "16vw",
  },
};

function onItem(to: string, pathname: string, search: string, hash: string) {
  const url = new URL(to, "http://local");
  if (url.hash) return pathname === url.pathname && hash === url.hash;
  if (url.search) {
    const current = new URLSearchParams(search);
    return pathname === url.pathname && [...url.searchParams].every(([k, v]) => current.get(k) === v);
  }
  return pathname === url.pathname && !search && !hash;
}

function withView(home: string, view: string) {
  return `${home}?view=${view}`;
}

/** Short two-note tone; browsers only allow it after the user has interacted with the page. */
function chime() {
  try {
    const ctx = new AudioContext();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + i * 0.16 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.16 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.16);
      osc.stop(ctx.currentTime + i * 0.16 + 0.32);
    });
    window.setTimeout(() => void ctx.close(), 800);
  } catch {
    /* audio unavailable */
  }
}

export function Bell({ badge }: { badge: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  const navigate = useNavigate();
  const { data: notes = [], isSuccess: loaded } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unread = notes.filter((n) => !n.read).length;
  const { sound } = useDashPrefs();
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!loaded) return;
    const ids = notes.filter((n) => !n.read).map((n) => n.id);
    const fresh = seen.current ? ids.filter((id) => !seen.current!.has(id)) : [];
    seen.current = new Set([...(seen.current ?? []), ...ids]);
    if (sound && fresh.length) chime();
  }, [notes, sound, loaded]);
  return (
    <div className="pick" ref={ref}>
      <button type="button" className="dash-bell" aria-label={`Notifications, ${unread} unread`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Ico name="bell" />
        {badge && unread > 0 && <i className="dot">{unread}</i>}
      </button>
      <AnimatePresence>
      {open && (
        <motion.div className="pop right pop-panel" variants={popVariants} initial="hidden" animate="show" exit="exit" style={{ transformOrigin: "top right" }}>
          <div className="panel-top">
            <p className="panel-h">Notifications</p>
            {unread > 0 && (
              <button type="button" className="link-btn" onClick={() => markAll.mutate()}>
                Mark all read
              </button>
            )}
          </div>
          <ul>
            {notes.length === 0 && <li className="empty">You're all caught up</li>}
            {notes.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`note ${n.read ? "" : "unread"}`}
                  onClick={() => {
                    if (!n.read) markRead.mutate(n.id);
                    setOpen(false);
                    if (n.href) navigate(n.href);
                  }}
                >
                  <b>{n.title}</b>
                  <span>{n.body}</span>
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

export function DashClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const day = now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  const time = now.toLocaleTimeString("en-GB", { hour12: false });
  return (
    <time className="dash-date dash-clock" dateTime={now.toISOString()} aria-label={`${day}, ${time}`}>
      <Ico name="calendar" />
      <span className="clock-day">{day}</span>
      <b className="clock-time">{time}</b>
    </time>
  );
}

export function Account({ name, email, role, home }: { name: string; email: string; role: string; home: string }) {
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  const navigate = useNavigate();
  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };
  const signOut = () => {
    setOpen(false);
    endSession();
    navigate("/login", { replace: true });
  };
  return (
    <div className="pick acct-wrap" ref={ref}>
      <button type="button" className={`dash-user ${open ? "on" : ""}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="dash-ava">{initials(name)}</span>
        <span className="dash-who">
          <b>{name}</b>
          {role !== name && <small>{role}</small>}
        </span>
        <Ico name="chevron" className="pill-ico" />
      </button>
      <AnimatePresence>
      {open && (
        <motion.div className="pop right pop-panel acct-pop" role="menu" aria-label="My account" variants={popVariants} initial="hidden" animate="show" exit="exit" style={{ transformOrigin: "top right" }}>
          <div className="acct">
            <span className="acct-ava">{initials(name)}</span>
            <div className="acct-id">
              <b>{name}</b>
              {role !== name && <span>{role}</span>}
              <small><Ico name="mail" />{email}</small>
            </div>
          </div>
          <div className="acct-actions">
            <button type="button" role="menuitem" onClick={() => go(home)}><Ico name="home" className="pop-ico" />Dashboard</button>
            <button type="button" role="menuitem" onClick={() => go(withView(home, "settings"))}><Ico name="gear" className="pop-ico" />Account settings</button>
            <button type="button" role="menuitem" onClick={() => go(withView(home, "help"))}><Ico name="help" className="pop-ico" />Help &amp; Support</button>
            <button type="button" role="menuitem" className="danger" onClick={signOut}><Ico name="logout" className="pop-ico" />Sign out</button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

const RAIL_KEY = "bsc-rail-mini";

const DRILL_ROLE: Record<string, string> = {
  revenue: Role.FINANCE_CONTROLLER,
  hr: Role.HR_MANAGER,
  booking: Role.BOOKINGS_OFFICER,
  security: Role.SECURITY_MANAGER,
};

type Hit = { to: string; label: string; kind: string };
const SEARCHABLE = ["/bookings", "/facilities", "/membership", "/visitors", "/vip", "/surfaces", "/fleet"];

function recordHits(results: SearchResults | undefined, role: string): Hit[] {
  if (!results) return [];
  const rec = (path: string, q?: string) => `${path}?view=records${q ? `&q=${encodeURIComponent(q)}` : ""}`;
  const hits: Hit[] = [
    ...results.bookings.map((b) => ({ to: rec("/bookings", b.customerName), label: b.customerName, kind: `Booking${b.facility ? ` · ${b.facility.name}` : ""}` })),
    ...results.facilities.map((f) => ({ to: rec("/facilities", f.name), label: f.name, kind: "Facility" })),
    ...results.members.map((m) => ({ to: rec("/membership", m.name), label: m.name, kind: "Member" })),
    ...results.visitors.map((v) => ({ to: rec("/visitors", v.name), label: v.name, kind: "Visitor" })),
    ...results.vips.map((v) => ({ to: rec("/vip", v.name), label: v.name, kind: "VIP guest" })),
    ...results.equipment.map((e) => ({ to: rec("/surfaces"), label: e.name, kind: "Equipment" })),
    ...results.vehicles.map((v) => ({ to: rec("/fleet"), label: v.driverName ?? v.type, kind: `Vehicle · ${v.type}` })),
  ];
  return hits.filter((hit) => {
    const module = findModuleByPath(hit.to.split("?")[0]);
    return module ? canAccessModule(role, module.key) : false;
  });
}

function DashSearch({ query, setQuery, placeholder, pages, role, onGo }: { query: string; setQuery: (q: string) => void; placeholder: string; pages: DashItem[]; role: string; onGo: (to: string) => void }) {
  const [debounced, setDebounced] = useState(query);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 220);
    return () => clearTimeout(id);
  }, [query]);
  const canRecords = SEARCHABLE.some((path) => {
    const module = findModuleByPath(path);
    return module ? canAccessModule(role, module.key) : false;
  });
  const { data, isFetching } = useSearch(canRecords ? debounced : "");
  const term = query.trim();
  const pageHits = term ? pages.slice(0, 5) : [];
  const searchRecords = canRecords && term.length >= 2;
  const records = searchRecords ? recordHits(data, role).slice(0, 8) : [];
  const first = pageHits[0]?.to ?? records[0]?.to;
  const show = focused && term.length > 0;
  return (
    <form
      className="dash-search"
      role="search"
      onFocus={() => setFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false); }}
      onSubmit={(e) => {
        e.preventDefault();
        if (term && first) onGo(first);
      }}
    >
      <Ico name="search" />
      <input value={query} placeholder={placeholder} onChange={(e) => setQuery(e.target.value)} aria-label="Search pages and records" />
      {query && (
        <button type="button" className="search-x" aria-label="Clear search" onClick={() => setQuery("")}><Ico name="x" /></button>
      )}
      {show && (
        <div className="dash-hits" role="listbox" aria-label="Search results">
          {pageHits.length > 0 && <p className="dash-hits-h">Pages</p>}
          {pageHits.map((p) => (
            <button key={p.to + p.label} type="button" role="option" aria-selected={false} onClick={() => onGo(p.to)}>
              <Ico name={p.icon} /><span>{p.label}</span>
            </button>
          ))}
          {searchRecords && <p className="dash-hits-h">Records</p>}
          {records.map((r, i) => (
            <button key={`${r.to}-${r.label}-${i}`} type="button" role="option" aria-selected={false} onClick={() => onGo(r.to)}>
              <span>{r.label}</span><em>{r.kind}</em>
            </button>
          ))}
          {searchRecords && records.length === 0 && <p className="dash-hits-empty">{isFetching || debounced !== query ? "Searching…" : "No matching records you can open."}</p>}
          {!searchRecords && pageHits.length === 0 && <p className="dash-hits-empty">{canRecords ? "Type at least 2 letters to search records." : "No page matches."}</p>}
        </div>
      )}
    </form>
  );
}

export function dashSpec(role: string) {
  return SPEC[role] ?? SPEC[Role.FINANCE_CONTROLLER];
}

export function DashFrame({ children, light = false, roleKey, photo: photoProp }: { children: ReactNode; light?: boolean; roleKey?: string; photo?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const role = roleKey ?? user?.role ?? Role.FINANCE_CONTROLLER;
  const spec = SPEC[role] ?? SPEC[Role.FINANCE_CONTROLLER];
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mini, setMini] = useState(() => localStorage.getItem(RAIL_KEY) === "1");
  const [query, setQuery] = useState("");
  const prefs = useDashPrefs();
  const toggleMini = () =>
    setMini((m) => {
      localStorage.setItem(RAIL_KEY, m ? "0" : "1");
      return !m;
    });
  const drill = role === Role.CHAIRMAN ? SPEC[DRILL_ROLE[pathname.split("/")[2] ?? ""] ?? ""] : undefined;
  const art = drill ?? spec;
  const items = spec.items.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));
  const view = new URLSearchParams(search).get("view");
  const activeTo = (
    spec.items.find((i) => onItem(i.to, pathname, search, hash)) ??
    spec.items.find((i) => !i.to.includes("#") && new URL(i.to, "http://local").pathname === pathname)
  )?.to;
  const photo = photoProp ?? (!light && !view && role !== Role.FINANCE_CONTROLLER);
  const name = displayName(user);
  const roleLabel = ROLE_LABELS[role as Role] ?? role;

  return (
    <div className={`dash${photo ? " photo" : ""}${light ? " is-light" : ""}${prefs.compact ? " compact" : ""}${mini ? " mini" : ""}`} style={{ ["--side" as string]: spec.side }}>
      {open && <button type="button" className="dash-scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <aside className={`dash-side${open ? " open" : ""}${spec.items.length > 14 ? " long" : ""}`}>
        <img src={art.art} alt="" className="dash-art" style={{ objectPosition: art.artPos }} />
        <div className="dash-brand">
          <Link to={spec.home} aria-label="Dashboard home" onClick={() => setOpen(false)}>
            <BrandLogo size="sm" />
          </Link>
          <button type="button" className="dash-close" aria-label="Close menu" onClick={() => setOpen(false)}><Ico name="x" /></button>
        </div>
        <LayoutGroup id="rail">
        <nav className="dash-nav" aria-label="Dashboard">
          {items.map((item) => (
            <div key={item.to + item.label}>
              {item.section && !query && <p className="dash-sec">{item.section}</p>}
              <Link
                to={item.to}
                title={mini ? item.label : undefined}
                className={`dash-link ${item.to === activeTo ? "on" : ""}`}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
              >
                {item.to === activeTo && (
                  <motion.i layoutId="rail-pill" className="dash-pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                )}
                <Ico name={item.icon} />
                <span>{item.label}</span>
              </Link>
            </div>
          ))}
          {items.length === 0 && <p className="dash-empty">No menu item matches.</p>}
        </nav>
        </LayoutGroup>
        <p className="dash-mark">People<br />Build<br />Champions</p>
      </aside>
      <div className="dash-main">
        <button
          type="button"
          className="rail-tog"
          aria-label={mini ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!mini}
          title={mini ? "Expand sidebar" : "Collapse sidebar"}
          onClick={toggleMini}
        >
          <Ico name="chevron" />
        </button>
        <header className="dash-top">
          <button type="button" className="dash-menu" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Ico name="menu" />
          </button>
          <DashSearch query={query} setQuery={setQuery} placeholder={spec.search} pages={items} role={role} onGo={(to) => { navigate(to); setQuery(""); }} />
          <div className="dash-tools">
            {role === Role.CHAIRMAN && pathname !== "/chairman" && (
              <Link to="/chairman" className="dash-back"><Ico name="crown" /><span>Chairman view</span></Link>
            )}
            <DashClock />
            <Bell badge={prefs.desktop} />
            <Account name={name} email={user?.email ?? ""} role={roleLabel} home={spec.home} />
          </div>
        </header>
        <div className={`dash-body ${light ? "light" : ""}`}>
          <PageMotion id={pathname + search} className="dash-anim">{children}</PageMotion>
        </div>
      </div>
    </div>
  );
}
