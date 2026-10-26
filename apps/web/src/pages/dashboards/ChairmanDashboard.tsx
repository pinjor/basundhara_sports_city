import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ROLE_LABELS, Role } from "@bsc/shared";
import { useAuthStore } from "../../store/auth";
import { BrandLogo } from "../../components/BrandLogo";
import { Account, Bell, DashClock } from "./DashFrame";
import { useDashPrefs } from "../../api/settings";
import { AnimatePresence, motion } from "framer-motion";
import { CountUp, EASE, HOVER, itemVariants, pageVariants } from "../../lib/motion";
import { useChairmanDash, useEventDecision, type ChairEvent, type ChairProject, type ChairmanDash } from "../../api/dashboards";
import { apiErrorMessage } from "../../lib/apiError";
import { timeAgo } from "../../lib/audit";
import { displayName } from "../../lib/user";
import { bdtCrore, count, day, scale, slotTime, titleCase } from "./format";
import { Ico, facilityIcon } from "./icons";
import { Badge, Bars, Card, Cols, DashStatus, Donut, Fields, Line, Pick, Sheet, ViewAll } from "./widgets";

type Art = { src: string; credit?: string };
const VENUE_ART: [RegExp, Art][] = [
  [/stadium/i, { src: "/dash/chair-strip.jpg" }],
  [/football|turf|futsal/i, { src: "/dash/cam-stadium.jpg" }],
  [/pool|swim|aquatic/i, { src: "/dash/fac-aquatic.jpg", credit: "Photo: EKranharst · CC BY-SA 3.0 · Wikimedia Commons" }],
  [/tennis|padel|squash|badminton/i, { src: "/dash/fac-tennis.jpg" }],
  [/cricket/i, { src: "/dash/fac-cricket.jpg", credit: "Photo: Javs1233 · CC BY-SA 4.0 · Wikimedia Commons" }],
  [/training|gym/i, { src: "/dash/cam-futsal.jpg" }],
  [/hall|court|arena|indoor/i, { src: "/dash/fac-indoor.jpg", credit: "Photo: Rhinen · CC BY-SA 4.0 · Wikimedia Commons" }],
];
const venueArt = (type: string): Art => VENUE_ART.find(([pattern]) => pattern.test(type))?.[1] ?? { src: "/dash/chair-hero.jpg" };
const LIVE_LIST = 7;

const VIEWS = ["Monthly", "Quarterly"];
const SEGMENT_COLORS = ["#f2b81d", "#d99a12", "#b07a10", "#ffd977", "#8a5f0b", "#5b4a26"];
const EVENT_ART: [RegExp, string][] = [[/football|futsal|soccer/i, "/dash/ev-football.jpg"], [/swim|aquatic/i, "/dash/ev-swim.jpg"], [/athlet|run|track/i, "/dash/ev-athletics.jpg"]];
const eventArt = (title: string) => EVENT_ART.find(([pattern]) => pattern.test(title))?.[1] ?? "/dash/ev-corporate.jpg";
const crore = (millions: number) => Math.round(millions * 10) / 100;
const pending = (e: ChairEvent) => e.kind === "pack" && e.approvalStatus === "Pending";
const approvalTone = (status: string) => (status === "Approved" ? "green" : status === "Rejected" ? "red" : "gold");
const monthYear = (iso: string | null) => (iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }) : "—");

const MLink = motion.create(Link);

function ChKpi({ icon, label, value, delta, to, children }: { icon: string; label: string; value?: string; delta?: number | null; to: string; children?: ReactNode }) {
  return (
    <MLink to={to} className="ch-kpi" aria-label={`${label}${value ? `: ${value}` : ""}`} variants={itemVariants} whileHover={HOVER}>
      <span className="ch-kpi-ico"><Ico name={icon} /></span>
      <span className="ch-kpi-t">
        <span className="ch-kpi-l">{label}<small>(Year to Date)</small></span>
        {value && <b className="ch-kpi-v"><CountUp value={value} /></b>}
        {delta !== undefined && delta !== null && <em className={delta < 0 ? "down" : ""}><Ico name={delta < 0 ? "arrowDown" : "arrowUp"} />{Math.abs(delta)}%<small>vs. last year</small></em>}
        {children}
      </span>
    </MLink>
  );
}

function OccRing({ pct }: { pct: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <span className="ch-ring">
      <svg viewBox="0 0 100 100" aria-hidden>
        <defs>
          <linearGradient id="chRing" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#ffe08a" />
            <stop offset="1" stopColor="#c8890f" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#2a2418" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="url(#chRing)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 50 50)" className="seg" />
      </svg>
      <b>{pct > 0 && pct < 1 ? "<1" : Math.round(pct)}%</b>
    </span>
  );
}

export function ChairmanDashboard() {
  const user = useAuthStore((s) => s.user);
  const admin = user?.role === Role.SUPER_ADMIN;
  const { hash } = useLocation();
  const prefs = useDashPrefs();
  const { data, error, refetch } = useChairmanDash();

  useEffect(() => {
    const id = hash.replace("#", "");
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [hash, data === undefined]);

  return (
    <div className={`dash chair${prefs.compact ? " compact" : ""}`}>
      <header className="ch-top">
        <Link to="/chairman" className="ch-brand" aria-label="Chairman dashboard home">
          <BrandLogo size="sm" />
        </Link>
        <div className="ch-title">
          <h1>The Chairman Dashboard</h1>
          <p className="ch-sub">Bashundhara Sports City</p>
          <p className="ch-tag">People <i /> Sports <i /> Excellence <i /> A Brighter Bangladesh</p>
        </div>
        <div className="ch-strip" aria-hidden style={{ backgroundImage: "url(/dash/chair-strip.jpg)" }} />
        <div className="ch-tools">
          {admin && (
            <Link to="/" className="dash-back"><Ico name="home" /><span>Admin view</span></Link>
          )}
          <DashClock />
          <Bell badge={prefs.desktop} />
          <Account name={displayName(user, "Chairman")} email={user?.email ?? ""} role={admin ? ROLE_LABELS[Role.SUPER_ADMIN] : "Chairman"} home={admin ? "/" : "/chairman"} />
        </div>
      </header>
      {data ? <ChairBody data={data} /> : <DashStatus error={error} onRetry={() => refetch()} />}
    </div>
  );
}

function ChairBody({ data }: { data: ChairmanDash }) {
  const [venueType, setVenueType] = useState<string | null>(null);
  const [rev, setRev] = useState("Monthly");
  const [vis, setVis] = useState("Monthly");
  const [slotId, setSlotId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [project, setProject] = useState<ChairProject | null>(null);
  const [sheet, setSheet] = useState<"approve" | "finance" | "projects" | null>(null);
  const decide = useEventDecision();

  const { kpis, campus, venues, schedule, events, utilization, segments, highlights, projects, maintenance, finance } = data;
  const venue = venues.find((v) => v.type === venueType) ?? null;
  const art = venue ? venueArt(venue.type) : null;
  const slot = schedule.find((s) => s.id === slotId) ?? null;
  const event = events.find((e) => e.id === eventId) ?? null;
  const waiting = events.filter(pending);
  const decideOn = (id: string, decision: "Approved" | "Rejected") => decide.mutate({ id, decision });

  const revSeries = rev === "Monthly" ? data.revenue.monthly : data.revenue.quarterly;
  const revValues = revSeries.values.map(crore);
  const revScale = scale(revValues, (n) => `${n} Cr`);
  const revPeak = revValues.indexOf(Math.max(...revValues));
  const visSeries = vis === "Monthly" ? data.visitors.monthly : data.visitors.quarterly;
  const visScale = scale(visSeries.values);
  const visPeak = visSeries.values.indexOf(Math.max(...visSeries.values));
  const decisionError = decide.isError ? apiErrorMessage(decide.error, "Could not record the decision.") : null;

  return (
    <motion.main className="ch-body" variants={pageVariants} initial="hidden" animate="show">
      <section className="ch-kpis" aria-label="Headline figures">
        <ChKpi icon="users" label="Total Visitors" value={count(kpis.visitors)} delta={kpis.visitorsDelta} to="/chairman/booking" />
        <ChKpi icon="calendar" label="Total Events" value={count(kpis.events)} delta={kpis.eventsDelta} to="/chairman/booking" />
        <ChKpi icon="coins" label="Revenue" value={bdtCrore(kpis.revenue)} delta={kpis.revenueDelta} to="/chairman/revenue" />
        <ChKpi icon="pie" label="Operational Cost" value={bdtCrore(kpis.cost)} delta={kpis.costDelta} to="/chairman/revenue" />
        <ChKpi icon="growth" label="Net Surplus" value={bdtCrore(kpis.surplus)} delta={kpis.surplusDelta} to="/chairman/revenue" />
        <MLink to="/chairman/booking" className="ch-kpi ch-occ" aria-label={`Overall occupancy: ${kpis.occupancy}%`} variants={itemVariants} whileHover={HOVER}>
          <OccRing pct={kpis.occupancy} />
          <span className="ch-kpi-t">
            <span className="ch-kpi-l">Overall Occupancy<small>(Facilities)</small></span>
            <span className="ch-target">Booked hours, ±30 days</span>
          </span>
        </MLink>
        <ChKpi icon="user" label="Member Count" value={count(kpis.members)} delta={kpis.membersDelta} to="/membership">
          <small className="ch-kpi-n">Active members</small>
        </ChKpi>
      </section>

      <div className="ch-row ch-r1">
        <motion.section className="ch-hero" aria-label="Sports City overview" variants={itemVariants}>
          <AnimatePresence initial={false}>
            <motion.div
              key={art?.src ?? "hero"}
              className="ch-hero-bg"
              style={{ backgroundImage: `url(${art?.src ?? "/dash/chair-hero.jpg"})` }}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1, transition: { opacity: { duration: 0.6 }, scale: { duration: 6, ease: EASE } } }}
              exit={{ opacity: 0, transition: { duration: 0.6 } }}
            />
          </AnimatePresence>
          <div className="ch-hero-copy">
            <h2>A World-Class<br />Sports Destination</h2>
            <p>For a Stronger Bangladesh</p>
          </div>
          <div className="ch-live">
            <p className="ch-live-h">
              <i className="ch-dot" />
              <span>
                Bashundhara Sports City
                <small>{venue ? `${venue.type} · ${venue.available} free · ${venue.inUse} busy${venue.maintenance ? ` · ${venue.maintenance} in maintenance` : ""}` : `${count(campus.onSite)} on site now`}</small>
              </span>
            </p>
            <ul>
              {venues.slice(0, LIVE_LIST).map((v) => (
                <li key={v.type}>
                  <button type="button" className={venueType === v.type ? "on" : ""} aria-pressed={venueType === v.type} onClick={() => setVenueType(venueType === v.type ? null : v.type)}>
                    <Ico name={facilityIcon(v.type)} />
                    {v.type}{v.count > 1 ? ` (${v.count})` : ""}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <dl className="ch-stats">
            <div><dt><CountUp value={String(campus.facilities)} /></dt><dd>Sports Facilities</dd></div>
            <div><dt><CountUp value={count(campus.capacity)} /></dt><dd>Total Capacity</dd></div>
            <div><dt>{campus.stadiums}</dt><dd>Stadiums, Grounds &amp; Event Halls</dd></div>
            <div><dt>{campus.zones}</dt><dd>Mapped Zones</dd></div>
          </dl>
          {art?.credit && <p className="ch-credit">{art.credit}</p>}
        </motion.section>

        <Card title="Today's Schedule" icon="clock" className="ch-card" extra={<ViewAll to="/chairman/booking" />}>
          <ul className="ch-sched">
            {schedule.length === 0 && <li className="empty">Nothing scheduled today</li>}
            {schedule.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => setSlotId(s.id)}>
                  <span className="ch-sched-ico"><Ico name={facilityIcon(s.kind)} /></span>
                  <span className="ch-sched-t">
                    <small>{slotTime(s.start)} - {slotTime(s.end)}</small>
                    <b>{s.title}</b>
                    <small>({s.venue})</small>
                  </span>
                  <span className={`ch-state ${s.state === "Ongoing" ? "on" : ""}`}>{s.state}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Upcoming Major Events" icon="star" className="ch-card" extra={<ViewAll to="/chairman/booking" />}>
          <ul className="ch-events">
            {events.length === 0 && <li className="empty">No upcoming events</li>}
            {events.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => setEventId(e.id)}>
                  <img src={eventArt(e.title)} alt="" loading="lazy" />
                  <span>
                    <b>{e.title}</b>
                    <small><Ico name="calendar" />{day(e.date)}</small>
                    <small><Ico name="pin" />{e.venue}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="ch-row ch-r2">
        <Card title="Revenue Overview" sub={rev === "Monthly" ? "(Last 12 Months)" : "(Quarterly)"} className="ch-card" extra={<Pick options={VIEWS} value={rev} onChange={setRev} />}>
          {revValues.some((v) => v > 0) && <div className="ch-peak"><b>৳ {revValues[revPeak]} Cr</b><small>{revSeries.labels[revPeak]}</small></div>}
          <Cols key={rev} labels={revSeries.labels} axis={revScale.axis} max={revScale.max} series={[{ name: "Revenue (Cr)", color: "#e9a816", values: revValues }]} legend={false} />
        </Card>
        <Card title="Visitor Trend" sub={vis === "Monthly" ? "(Last 12 Months)" : "(Quarterly)"} className="ch-card" extra={<Pick options={VIEWS} value={vis} onChange={setVis} />}>
          {visSeries.values.some((v) => v > 0) && <div className="ch-peak"><b>{count(visSeries.values[visPeak] ?? 0)}</b><small>{visSeries.labels[visPeak]}</small></div>}
          <Line key={vis} labels={visSeries.labels} axis={visScale.axis} max={visScale.max} legend={false} fmt={(n) => `${count(n)} visitors`} series={[{ name: "Visitors", color: "#f2b81d", values: visSeries.values }]} />
        </Card>
        <Card title="Facility Utilization" sub="(Booked hours, ±30 days)" className="ch-card" extra={<ViewAll to="/chairman/booking" />}>
          <Bars rows={utilization.map((u) => ({ label: u.type, pct: Math.min(100, u.pct), icon: facilityIcon(u.type), value: `${u.pct}%`, color: "linear-gradient(90deg, #8a5f0b, #f2b81d)" }))} />
        </Card>
        <Card title="Revenue by Segment" sub="(Year to Date)" className="ch-card" extra={<ViewAll to="/chairman/revenue" />}>
          <Donut center={bdtCrore(kpis.revenue)} caption="Total Revenue" thick={16} parts={segments.map((seg, i) => ({ label: seg.label, pct: seg.pct, color: SEGMENT_COLORS[i % SEGMENT_COLORS.length], value: `${seg.pct}%` }))} />
        </Card>
      </div>

      <div className="ch-row ch-r3">
        <Card title="Key Highlights" icon="sparkle" className="ch-card">
          <ul className="ch-high">
            {highlights.length === 0 && <li className="empty">No highlights yet</li>}
            {highlights.map((h) => (
              <li key={h.id}>
                <span className="ch-sched-ico"><Ico name="bell" /></span>
                <span><b>{h.title}</b><small>{h.body}</small></span>
                <time dateTime={h.at}>{timeAgo(h.at)}</time>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Ongoing Projects" icon="building" className="ch-card" extra={<button type="button" className="view-all" onClick={() => setSheet("projects")}>View All</button>}>
          <div className="ch-proj">
            <p className="ch-proj-h"><span>Project</span><span>Progress</span><span>Completion</span></p>
            {projects.length === 0 && <p className="empty">No ongoing projects</p>}
            {projects.map((p) => (
              <button key={p.id} type="button" onClick={() => setProject(p)}>
                <span>{p.name}</span>
                <span className="ch-bar"><motion.i initial={{ width: 0 }} animate={{ width: `${p.progress}%` }} transition={{ duration: 1.1, ease: EASE, delay: 0.4 }} /><em>{p.progress}%</em></span>
                <span>{monthYear(p.dueOn)}</span>
              </button>
            ))}
          </div>
        </Card>
        <Card id="maintenance" title="Facility Status" icon="wrench" className="ch-card">
          <ul className="ch-maint">
            {maintenance.map((m) => (
              <li key={m.id}>
                <span>{m.name}</span>
                <span className={`ch-st ${m.status === "Maintenance" ? "warn" : "ok"}`}><i />{m.status === "Maintenance" ? "Under Maintenance" : "Operational"}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Quick Actions" icon="crown" className="ch-card">
          <div className="ch-qa">
            <button type="button" onClick={() => setSheet("approve")}>
              <Ico name="calCheck" />
              <span>Approve Event</span>
              {waiting.length > 0 && <i className="ch-badge">{waiting.length}</i>}
            </button>
            <Link to="/chairman/revenue"><Ico name="file" /><span>View Reports</span></Link>
            <button type="button" onClick={() => setSheet("finance")}><Ico name="bars" /><span>Financial Summary</span></button>
            <button type="button" onClick={() => setSheet("projects")}><Ico name="report" /><span>Project Updates</span></button>
            <Link to="/membership"><Ico name="users" /><span>Member Insights</span></Link>
            <Link to="/chairman?view=settings"><Ico name="gear" /><span>Settings</span></Link>
          </div>
        </Card>
      </div>

      <Sheet open={!!slot} title={slot?.title ?? ""} onClose={() => setSlotId(null)}>
        {slot && (
          <>
            <Fields
              rows={[
                ["Time", `${slotTime(slot.start)} - ${slotTime(slot.end)}`],
                ["Venue", slot.venue],
                ["Led by", slot.lead],
                ["Status", <Badge key="s" tone={slot.state === "Ongoing" ? "gold" : slot.state === "Done" ? "grey" : "blue"}>{slot.state}</Badge>],
              ]}
            />
            <div className="sheet-actions">
              <Link to="/chairman/booking" className="panel-btn"><Ico name="external" className="pop-ico" />Open booking overview</Link>
            </div>
          </>
        )}
      </Sheet>

      <Sheet open={!!event} title={event?.title ?? ""} onClose={() => { setEventId(null); decide.reset(); }} wide>
        {event && (
          <>
            <img src={eventArt(event.title)} alt={event.title} className="big-shot" />
            <div className="sheet-gap" />
            <Fields
              rows={[
                ["Date", day(event.date)],
                ["Venue", event.venue],
                [event.kind === "match" ? "Tickets" : "Audience", event.audience],
                ["Status", <Badge key="s" tone={approvalTone(event.approvalStatus)}>{event.approvalStatus === "Pending" ? "Pending approval" : event.approvalStatus}</Badge>],
              ]}
            />
            <div className="sheet-actions">
              {pending(event) && (
                <>
                  <button type="button" className="btn-gold" disabled={decide.isPending} onClick={() => decideOn(event.id, "Approved")}><Ico name="check" className="pop-ico" />Approve event</button>
                  <button type="button" className="panel-btn danger" disabled={decide.isPending} onClick={() => decideOn(event.id, "Rejected")}><Ico name="x" className="pop-ico" />Reject</button>
                </>
              )}
              <Link to="/chairman/booking" className="panel-btn"><Ico name="ticket" className="pop-ico" />Ticket sales</Link>
            </div>
            {decisionError && <p className="act-err" role="alert">{decisionError}</p>}
          </>
        )}
      </Sheet>

      <Sheet open={sheet === "approve"} title="Events awaiting approval" onClose={() => { setSheet(null); decide.reset(); }}>
        {waiting.length === 0 ? (
          <p className="sub">All upcoming events are decided.</p>
        ) : (
          <ul className="ch-approve">
            {waiting.map((e) => (
              <li key={e.id}>
                <img src={eventArt(e.title)} alt="" />
                <span><b>{e.title}</b><small>{day(e.date)} · {e.venue}</small></span>
                <button type="button" className="btn-gold" disabled={decide.isPending} onClick={() => decideOn(e.id, "Approved")}><Ico name="check" className="pop-ico" />Approve</button>
              </li>
            ))}
          </ul>
        )}
        {decisionError && <p className="act-err" role="alert">{decisionError}</p>}
      </Sheet>

      <Sheet open={sheet === "finance"} title="Financial summary · Year to date" onClose={() => setSheet(null)}>
        <Fields
          rows={[
            ["Revenue", bdtCrore(finance.revenue)],
            ["Operational cost", bdtCrore(finance.cost)],
            ["Net surplus", bdtCrore(finance.surplus)],
            ["Largest segment", finance.topSegment ? `${finance.topSegment.label} · ${finance.topSegment.pct}%` : "—"],
            ["Best month", finance.bestMonth ? `${finance.bestMonth.label} ${finance.bestMonth.year} · ৳ ${crore(finance.bestMonth.amount)} Cr` : "—"],
          ]}
        />
        <div className="sheet-actions">
          <Link to="/chairman/revenue" className="btn-gold"><Ico name="external" className="pop-ico" />Open revenue dashboard</Link>
        </div>
      </Sheet>

      <Sheet open={sheet === "projects"} title="Project updates" onClose={() => setSheet(null)} wide>
        <div className="ch-proj wide">
          <p className="ch-proj-h"><span>Project</span><span>Progress</span><span>Completion</span><span>Budget</span></p>
          {projects.map((p) => (
            <button key={p.id} type="button" onClick={() => { setSheet(null); setProject(p); }}>
              <span>{p.name}</span>
              <span className="ch-bar"><i style={{ width: `${p.progress}%` }} /><em>{p.progress}%</em></span>
              <span>{monthYear(p.dueOn)}</span>
              <span>{bdtCrore(p.budget)}</span>
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={!!project} title={project?.name ?? ""} onClose={() => setProject(null)}>
        {project && (
          <>
            <div className="ch-bar big"><i style={{ width: `${project.progress}%` }} /><em>{project.progress}%</em></div>
            <div className="sheet-gap" />
            <Fields
              rows={[
                ["Reference", project.reference],
                ["Owner", project.owner],
                ["Budget", bdtCrore(project.budget)],
                ["Expected completion", day(project.dueOn)],
                ["Status", <Badge key="s" tone={project.status === "ON_HOLD" ? "red" : project.progress >= 60 ? "green" : "gold"}>{titleCase(project.status)}</Badge>],
              ]}
            />
          </>
        )}
      </Sheet>
    </motion.main>
  );
}
