import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { LOCKDOWN_SCOPES, SECURITY_ZONES } from "@bsc/shared";
import { Link } from "react-router-dom";
import { useAlertStatus, useEndLockdown, useSecurityDash, useStartLockdown, type RangeKey, type SecurityAlert, type SecurityCamera, type SecurityDash } from "../../api/dashboards";
import { apiErrorMessage } from "../../lib/apiError";
import { timeAgo } from "../../lib/audit";
import { change, clock, count, day, scale, titleCase } from "./format";
import { Ico } from "./icons";
import { Badge, Card, Cols, DashStatus, Donut, Fields, KeyPick, Kpi, Line, Pick, Quick, Sheet, useReadOnly } from "./widgets";

const RANGES = { today: "Today", yesterday: "Yesterday" } satisfies Partial<Record<RangeKey, string>>;
type SecRange = keyof typeof RANGES;

const ALL = "All Zones";
const ZONES = [ALL, ...SECURITY_ZONES];
const FEEDS = 6;
const KIND_ICONS: Record<string, string> = { "Crowd Density High": "users", "Vehicle Without Pass": "car", "Perimeter Breach": "shield", "Camera Offline": "camera" };
const severityTone = (severity: string) => (severity === "Critical" || severity === "High" ? "red" : severity === "Medium" ? "orange" : "blue");
const camTone = (status: string) => (status === "ONLINE" ? "green" : status === "MAINTENANCE" ? "gold" : "red");
const alertBadge = (a: SecurityAlert) => (a.status === "OPEN" ? (severityTone(a.severity) === "red" ? "red" : "gold") : a.status === "ACKNOWLEDGED" ? "blue" : "green");

const CROWD_VIEWS = ["Occupancy now", "Entries", "Peak hour"];

/** 0 → blue, 0.5 → yellow, 1 → red; matches the `.heat-scale` legend. */
const heatColor = (level: number) => `hsl(${Math.round(220 - Math.min(1, Math.max(0, level)) * 220)} 70% ${level > 0 ? 38 : 18}%)`;

function crowdCells(view: string, crowd: SecurityDash["crowd"]) {
  if (view === "Occupancy now") {
    return crowd.live.map((z) => ({ zone: z.zone, level: z.capacity ? z.value / z.capacity : 0, label: `${count(z.value)} · ${z.capacity ? Math.round((z.value / z.capacity) * 100) : 0}%` }));
  }
  const rows = view === "Peak hour" ? crowd.peak.zones : crowd.entries;
  const max = Math.max(1, ...rows.map((z) => z.value));
  return rows.map((z) => ({ zone: z.zone, level: z.value / max, label: `${count(z.value)} entries` }));
}

function Shot({ src, alt, className }: { src: string | null | undefined; alt: string; className: string }) {
  if (src) return <img src={src} alt={alt} className={className} />;
  return <span className={`${className} shot-none`} role="img" aria-label={alt}><Ico name="camera" /></span>;
}

export function SecurityDashboard() {
  const { hash } = useLocation();
  const ro = useReadOnly();
  const [range, setRange] = useState<SecRange>("today");
  const [zone, setZone] = useState(ALL);
  const [zoom, setZoom] = useState(1);
  const [camId, setCamId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"all" | "map" | "lock" | "report" | "alerts" | null>(null);
  const [crowd, setCrowd] = useState(CROWD_VIEWS[0]);
  const [flash, setFlash] = useState("");
  const [alertId, setAlertId] = useState<string | null>(null);
  const [lockForm, setLockForm] = useState({ reason: "", scope: LOCKDOWN_SCOPES[0] as string, drill: true });
  const { data, error, refetch } = useSecurityDash(range);
  const alertStatus = useAlertStatus();
  const startLockdown = useStartLockdown();
  const endLockdown = useEndLockdown();

  useEffect(() => {
    const id = hash.replace("#", "");
    if (!id) return;
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setFlash(id);
    const t = window.setTimeout(() => setFlash(""), 1600);
    return () => window.clearTimeout(t);
  }, [hash, data === undefined]);

  if (!data) return <DashStatus error={error} onRetry={() => refetch()} />;

  const { kpis, cameras, alerts, events, incidents, flow, traffic, access, lockdown } = data;
  const f = (id: string) => (flash === id ? "flash" : "");
  const cam = cameras.find((c) => c.id === camId) ?? null;
  const alert = [...alerts, ...events].find((a) => a.id === alertId) ?? null;
  const feeds = cameras.filter((c) => c.imageUrl).slice(0, FEEDS);
  const pins = cameras.filter((c) => c.mapX !== null && c.mapY !== null);
  const openAlerts = alerts.filter((a) => a.status === "OPEN");
  const flowScale = scale(flow.people);
  const trafficScale = scale([...traffic.entries, ...traffic.exits]);
  const accessPct = (n: number) => (access.total ? Math.round((n / access.total) * 1000) / 10 : 0);
  const lockError = startLockdown.error ?? endLockdown.error;
  const peakHour = flow.people.reduce((top, v, i) => (v > (flow.people[top] ?? 0) ? i : top), 0);
  const crowdRows = crowdCells(crowd, data.crowd);
  const crowdNote =
    crowd === "Occupancy now"
      ? "People in each zone now, as a share of zone capacity."
      : crowd === "Peak hour"
        ? `Gate entries per zone during the busiest hour (${data.crowd.peak.label}), ${RANGES[range].toLowerCase()}.`
        : `Gate entries per zone, ${RANGES[range].toLowerCase()}.`;

  const openCamera = (c: SecurityCamera) => setCamId(c.id);
  const cameraOf = (a: SecurityAlert) => cameras.find((c) => c.id === a.camera?.id) ?? null;
  const move = (a: SecurityAlert, status: "ACKNOWLEDGED" | "RESOLVED") => alertStatus.mutate({ id: a.id, status }, { onSuccess: () => setAlertId(null) });
  const toggleLockdown = () => {
    const done = { onSuccess: () => setSheet(null) };
    if (lockdown) endLockdown.mutate(lockdown.id, done);
    else if (lockForm.reason.trim()) startLockdown.mutate({ ...lockForm, reason: lockForm.reason.trim() }, done);
  };

  const insights = [
    { icon: "alert", tone: openAlerts.length ? "red" : "green", text: openAlerts.length ? `${openAlerts.length} alert${openAlerts.length > 1 ? "s" : ""} waiting for acknowledgement.` : "No alerts waiting for acknowledgement." },
    { icon: "shield", tone: access.denied ? "red" : "green", text: `${count(access.denied)} access attempt${access.denied === 1 ? "" : "s"} denied ${RANGES[range].toLowerCase()}.` },
    { icon: "camera", tone: kpis.camerasOnline === kpis.cameras ? "green" : "blue", text: `${kpis.camerasOnline} of ${kpis.cameras} cameras online.` },
    ...(flow.people.some((v) => v > 0) ? [{ icon: "clock", tone: "blue", text: `Busiest hour for entries: ${flow.labels[peakHour]}.` }] : []),
    { icon: "activity", tone: incidents.length ? "purple" : "green", text: `${incidents.length} incident${incidents.length === 1 ? "" : "s"} still open.` },
  ];

  return (
    <div className="page p-sec">
      <header className="hero" style={{ backgroundImage: "linear-gradient(90deg, rgba(0,0,0,.85) 0%, rgba(0,0,0,.4) 34%, rgba(0,0,0,0) 60%), url(/dash/hero-security.jpg)" }}>
        <h2 className="gold upper">Security &amp; Surveillance</h2>
        <p className="sub">A Safer Environment for a Brighter Tomorrow</p>
      </header>

      {lockdown && (
        <div className="drill" role="status">
          <Ico name="lock" />
          <span>
            <b>{lockdown.drill ? "Lockdown drill active" : "Lockdown active"} · {lockdown.scope}</b>
            <small>{lockdown.reason} · started {timeAgo(lockdown.startedAt)}</small>
          </span>
          {!ro && <button type="button" className="panel-btn" disabled={endLockdown.isPending} onClick={() => endLockdown.mutate(lockdown.id)}>End lockdown</button>}
        </div>
      )}

      <div className="kpis c6">
        <Kpi variant="mini" icon="camera" label="Total Cameras" value={count(kpis.cameras)} onClick={() => setSheet("all")} />
        <Kpi variant="mini" icon="alert" label="Active Alerts" value={count(kpis.activeAlerts)} color="#f0444a" onClick={() => setSheet("alerts")} />
        <Kpi variant="mini" icon="users" label={`Entries ${RANGES[range]}`} value={count(kpis.people)} {...change(kpis.peopleDelta)} to="/security#people" />
        <Kpi variant="mini" icon="car" label="Vehicles Tracked" value={count(kpis.vehicles)} {...change(kpis.vehiclesDelta)} to="/security#vehicles" />
        <Kpi variant="mini" icon="shield" label="Cameras Online" value={`${kpis.uptime}%`} onClick={() => setSheet("report")} />
        <Kpi variant="mini" icon="siren" label="Critical Incidents" value={count(kpis.critical)} color="#f0444a" onClick={() => setSheet("alerts")} />
      </div>

      <div className="row c-sec1">
        <Card id="live" className={f("live")} title="Camera Feeds" extra={<button type="button" className="view-all" onClick={() => setSheet("all")}>View All</button>}>
          <div className="cams">
            {feeds.map((c) => (
              <button key={c.id} type="button" className="cam" onClick={() => openCamera(c)} aria-label={`Open ${c.name} camera`}>
                <Shot src={c.imageUrl} alt="" className="" />
                <span className="live"><i />{c.status === "ONLINE" ? "Online" : titleCase(c.status)}</span>
                <span className="cam-cap">{c.name}<Ico name="expand" /></span>
              </button>
            ))}
          </div>
        </Card>
        <Card
          id="perimeter"
          className={f("perimeter")}
          title="Site Map & Camera Locations"
          extra={
            <div className="card-x">
              <Pick options={ZONES} value={zone} onChange={setZone} />
              <button type="button" className="dots" aria-label="Expand map" onClick={() => setSheet("map")}><Ico name="expand" /></button>
            </div>
          }
        >
          <div className="map">
            <div className="map-view">
              <div className="map-layer" style={{ transform: `scale(${zoom})` }}>
                <img src="/dash/site-map.jpg" alt="Sports City site map" className="map-img" />
                {pins.map((p) => {
                  const label = `${p.reference} · ${p.name}${p.alert ? " · open alert" : ""}`;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      className={`map-pin ${p.alert ? "alert" : ""} ${zone !== ALL && p.zone !== zone ? "dim" : ""}`}
                      style={{ left: `${p.mapX}%`, top: `${p.mapY}%` }}
                      data-tip={label}
                      aria-label={label}
                      onClick={() => openCamera(p)}
                    >
                      <Ico name={p.alert ? "alert" : "camera"} />
                    </button>
                  );
                })}
              </div>
              <div className="map-zoom">
                <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(2, z + 0.25))}><Ico name="zoomIn" /></button>
                <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(1, z - 0.25))}><Ico name="zoomOut" /></button>
              </div>
              <button type="button" className="map-compass" aria-label="Reset view" onClick={() => setZoom(1)}><Ico name="compass" /></button>
            </div>
            <div className="zones" role="listbox" aria-label="Zones">
              {ZONES.map((z) => (
                <button key={z} type="button" role="option" aria-selected={z === zone} className={z === zone ? "on" : ""} onClick={() => setZone(z)}>{z}</button>
              ))}
            </div>
          </div>
        </Card>
        <Card id="incidents" className={f("incidents")} title="Recent Alerts" extra={<button type="button" className="view-all" onClick={() => setSheet("alerts")}>View All</button>}>
          <ul className="list tight scroll alerts">
            {openAlerts.map((a) => (
              <li key={a.id}>
                <button type="button" className={`al-row ${severityTone(a.severity)}`} onClick={() => setAlertId(a.id)}>
                  <Shot src={a.camera?.imageUrl} alt="" className="thumb" />
                  <div className="al-t">
                    <Ico name={KIND_ICONS[a.kind] ?? "alert"} className={`al-ico ${severityTone(a.severity)}`} />
                    <span><b>{a.kind}</b><small>{a.location}{a.camera ? ` · ${a.camera.reference}` : ""}</small></span>
                  </div>
                  <span className="when">{timeAgo(a.createdAt)}</span>
                </button>
              </li>
            ))}
            {openAlerts.length === 0 && <li className="empty">All alerts acknowledged</li>}
          </ul>
        </Card>
      </div>

      <div className="row c-sec2" id="analytics">
        <Card id="people" className={f("people")} title="Crowd Density Analysis" extra={<Pick options={CROWD_VIEWS} value={crowd} onChange={setCrowd} />}>
          <div className="heat">
            <p className="heat-note">{crowdNote}</p>
            <div className="heat-grid fade-in" key={crowd}>
              {crowdRows.length === 0 && <p className="empty">No zones with a set capacity yet</p>}
              {crowdRows.map((z) => (
                <div key={z.zone} className="heat-cell" style={{ background: heatColor(z.level) }} title={`${z.zone}: ${z.label}`}>
                  <span>{z.zone}</span>
                  <b>{z.label}</b>
                </div>
              ))}
            </div>
            <div className="heat-scale"><span>Low</span><i /><span>High</span></div>
          </div>
        </Card>
        <Card title="People Flow Trend" sub="Gate entries per hour" extra={<KeyPick options={RANGES} value={range} onChange={setRange} />}>
          <Line
            key={range}
            legend={false}
            labels={flow.labels}
            tick={4}
            axis={flowScale.axis}
            max={flowScale.max}
            fmt={(v) => `${count(v)} entries`}
            series={[{ name: "People", color: "#f2b81d", values: flow.people }]}
          />
        </Card>
        <Card id="vehicles" className={f("vehicles")} title="Vehicle Movement" sub={RANGES[range]}>
          <Cols
            key={range}
            labels={traffic.labels}
            tick={2}
            axis={trafficScale.axis}
            max={trafficScale.max}
            series={[
              { name: "Entries", color: "#f2b81d", values: traffic.entries },
              { name: "Exits", color: "#9a9ea8", values: traffic.exits },
            ]}
          />
        </Card>
        <Card id="access" className={f("access")} title="Access Control Status" sub={RANGES[range]}>
          <Donut
            center={count(access.total)}
            caption="Total Access"
            thick={16}
            stacked
            parts={[
              { label: "Granted", pct: accessPct(access.granted), color: "#22c97a", value: `${count(access.granted)} · ${accessPct(access.granted)}%` },
              { label: "Denied", pct: accessPct(access.denied), color: "#f0444a", value: `${count(access.denied)} · ${accessPct(access.denied)}%` },
              { label: "Other", pct: accessPct(access.other), color: "#f2b81d", value: `${count(access.other)} · ${accessPct(access.other)}%` },
            ]}
          />
        </Card>
        <Card title="Detection Summary" sub={RANGES[range]}>
          <ul className="list tight scroll">
            {[
              ["scan", "green", "Access scans", `${count(access.total)} at the gates`],
              ["alert", "orange", "Denied entries", `${count(access.denied)} turned away`],
              ["activity", "blue", "Open incidents", `${count(incidents.length)} being handled`],
              ["plate", "purple", "Vehicles", `${count(kpis.vehicles)} entered`],
            ].map(([icon, c, t, d]) => (
              <li key={t}>
                <span className={`li-ico sq ${c}`}><Ico name={icon} /></span>
                <div><b>{t}</b><small>{d}</small></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="row c-sec3">
        <Card title="Recent Security Events" extra={<button type="button" className="view-all" onClick={() => setSheet("alerts")}>View All</button>}>
          <div className="table-wrap">
            <table className="d">
              <thead>
                <tr>{["Time", "", "Camera", "Location", "Event Type", "Person/Vehicle", "Status"].map((h, i) => <th key={h + i}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {events.length === 0 && <tr><td colSpan={7} className="empty">No security events yet</td></tr>}
                {events.map((e) => (
                  <tr key={e.id} className="click" onClick={() => setAlertId(e.id)}>
                    <td>{clock(e.createdAt)}</td>
                    <td><Shot src={e.camera?.imageUrl} alt="" className="thumb sm" /></td>
                    <td>{e.camera?.reference ?? "—"}</td>
                    <td>{e.location}</td>
                    <td>{e.kind}</td>
                    <td>{e.subject ?? "N/A"}</td>
                    <td><Badge tone={alertBadge(e)}>{titleCase(e.status)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card id="reports" className={f("reports")} title="Security Insights">
          <ul className="list tight scroll insights">
            {insights.map((item) => (
              <li key={item.text}>
                <span className={`dot-ico ${item.tone}`}><Ico name={item.icon} /></span>
                <div><b>{item.text}</b></div>
              </li>
            ))}
          </ul>
        </Card>
        <Card id="settings" className={f("settings")} title="Quick Actions">
          <div className="qa tiles">
            <Quick icon="camera" label="View Cameras" onClick={() => setSheet("all")} />
            <Quick icon="bars" label="Generate Report" onClick={() => setSheet("report")} />
            {ro ? <Quick icon="pin" label="Site Map" onClick={() => setSheet("map")} /> : <Quick icon="lock" label={lockdown ? "End Lockdown" : "Lockdown Mode"} onClick={() => setSheet("lock")} />}
            <Quick icon="alert" label="Incident Management" to="/security?view=records" />
          </div>
        </Card>
      </div>

      <Sheet open={!!cam} title={cam ? `${cam.name} · ${cam.reference}` : ""} onClose={() => setCamId(null)} wide>
        {cam && (
          <>
            <div className="cam-big">
              <Shot src={cam.imageUrl} alt={cam.name} className="big-shot" />
              {cam.status === "ONLINE" && <span className="live"><i />Online</span>}
            </div>
            <div className="sheet-gap" />
            <Fields
              rows={[
                ["Camera", cam.reference],
                ["Zone", cam.zone],
                ["Location", cam.location ?? "—"],
                ["Status", <Badge key="s" tone={camTone(cam.status)}>{titleCase(cam.status)}</Badge>],
                ["Open alert", cam.alert ? "Yes" : "No"],
              ]}
            />
          </>
        )}
      </Sheet>
      <Sheet open={sheet === "all"} title={`All cameras · ${kpis.camerasOnline}/${kpis.cameras} online`} onClose={() => setSheet(null)} wide>
        <div className="cams all">
          {cameras.map((c) => (
            <button key={c.id} type="button" className="cam" onClick={() => { setSheet(null); openCamera(c); }}>
              <Shot src={c.imageUrl} alt="" className="" />
              <span className="live"><i />{c.status === "ONLINE" ? "Online" : titleCase(c.status)}</span>
              <span className="cam-cap">{c.name} · {c.reference}<Ico name="expand" /></span>
            </button>
          ))}
        </div>
      </Sheet>
      <Sheet open={sheet === "map"} title="Site map" onClose={() => setSheet(null)} wide>
        <img src="/dash/site-map.jpg" alt="Sports City site map" className="big-shot" />
      </Sheet>
      <Sheet open={sheet === "lock"} title="Lockdown mode" onClose={() => { setSheet(null); startLockdown.reset(); endLockdown.reset(); }}>
        <p className="sub">
          {lockdown
            ? `${lockdown.drill ? "A lockdown drill" : "A lockdown"} is running for ${lockdown.scope}. End it to return to normal monitoring.`
            : "The security team is notified and the lockdown is logged. Gate hardware is not connected, so gates must be closed by staff on site."}
        </p>
        {!lockdown && (
          <form className="lock-form" onSubmit={(e) => { e.preventDefault(); toggleLockdown(); }}>
            <label>
              <span>Reason</span>
              <input required maxLength={200} value={lockForm.reason} placeholder="e.g. Suspicious package at Gate 3" onChange={(e) => setLockForm((s) => ({ ...s, reason: e.target.value }))} />
            </label>
            <label>
              <span>Scope</span>
              <select value={lockForm.scope} onChange={(e) => setLockForm((s) => ({ ...s, scope: e.target.value }))}>
                {LOCKDOWN_SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="lock-check">
              <input type="checkbox" checked={lockForm.drill} onChange={(e) => setLockForm((s) => ({ ...s, drill: e.target.checked }))} />
              <span>Drill only (practice, not a real threat)</span>
            </label>
          </form>
        )}
        <div className="sheet-gap" />
        <div className="sheet-actions">
          {lockdown ? (
            <button type="button" className="btn-gold" disabled={endLockdown.isPending} onClick={toggleLockdown}><Ico name="check" className="pop-ico" />End lockdown</button>
          ) : (
            <button type="button" className="panel-btn danger" disabled={startLockdown.isPending || !lockForm.reason.trim()} onClick={toggleLockdown}>
              <Ico name="lock" className="pop-ico" />{lockForm.drill ? "Start lockdown drill" : "Start lockdown"}
            </button>
          )}
          <button type="button" className="panel-btn" onClick={() => setSheet(null)}><Ico name="x" className="pop-ico" />Cancel</button>
        </div>
        {lockError && <p className="act-err" role="alert">{apiErrorMessage(lockError, "Could not change lockdown.")}</p>}
      </Sheet>
      <Sheet open={sheet === "alerts"} title="Alerts & incidents" onClose={() => setSheet(null)}>
        <ul className="list tight alerts">
          {alerts.length === 0 && <li className="empty">No open alerts</li>}
          {alerts.map((a) => (
            <li key={a.id}>
              <button type="button" className={`al-row wide ${severityTone(a.severity)}`} onClick={() => { setSheet(null); setAlertId(a.id); }}>
                <Shot src={a.camera?.imageUrl} alt="" className="thumb" />
                <div className="al-t">
                  <Ico name={KIND_ICONS[a.kind] ?? "alert"} className={`al-ico ${severityTone(a.severity)}`} />
                  <span><b>{a.kind}</b><small>{a.location}{a.camera ? ` · ${a.camera.reference}` : ""} · {timeAgo(a.createdAt)}</small></span>
                </div>
                <Badge tone={alertBadge(a)}>{titleCase(a.status)}</Badge>
              </button>
            </li>
          ))}
        </ul>
        <div className="sheet-gap" />
        <p className="panel-h">Open incidents</p>
        <ul className="list tight">
          {incidents.length === 0 && <li className="empty">No open incidents</li>}
          {incidents.map((i) => (
            <li key={i.id}>
              <span className={`li-ico ${severityTone(i.severity)}`}><Ico name="siren" /></span>
              <div><b>{i.title}</b><small>{i.severity} · {i.status} · {timeAgo(i.createdAt)}</small></div>
            </li>
          ))}
        </ul>
        <div className="sheet-gap" />
        <div className="sheet-actions">
          <Link to="/security?view=records" className="btn-gold"><Ico name="file" className="pop-ico" />{ro ? "View incidents" : "Log or update incidents"}</Link>
        </div>
      </Sheet>
      <Sheet open={!!alert} title={alert ? `${alert.kind} · ${alert.reference}` : ""} onClose={() => { setAlertId(null); alertStatus.reset(); }} wide>
        {alert && (
          <>
            <div className="cam-big">
              <Shot src={alert.camera?.imageUrl} alt={alert.location} className="big-shot" />
            </div>
            <div className="sheet-gap" />
            <Fields
              rows={[
                ["Location", alert.location],
                ["Camera", alert.camera ? `${alert.camera.name} · ${alert.camera.reference}` : "—"],
                ["Severity", <Badge key="v" tone={severityTone(alert.severity) === "red" ? "red" : "gold"}>{alert.severity}</Badge>],
                ["Person / vehicle", alert.subject ?? "N/A"],
                ["Detected", `${clock(alert.createdAt)} · ${day(alert.createdAt)}`],
                ["Status", <Badge key="s" tone={alertBadge(alert)}>{titleCase(alert.status)}</Badge>],
              ]}
            />
            <div className="sheet-actions">
              {alert.status === "OPEN" && !ro && (
                <button type="button" className="btn-gold" disabled={alertStatus.isPending} onClick={() => move(alert, "ACKNOWLEDGED")}><Ico name="check" className="pop-ico" />Acknowledge</button>
              )}
              {alert.status !== "RESOLVED" && !ro && (
                <button type="button" className="panel-btn" disabled={alertStatus.isPending} onClick={() => move(alert, "RESOLVED")}><Ico name="flag" className="pop-ico" />Resolve</button>
              )}
              {cameraOf(alert) && (
                <button type="button" className="panel-btn" onClick={() => { const c = cameraOf(alert)!; setAlertId(null); openCamera(c); }}><Ico name="camera" className="pop-ico" />View camera</button>
              )}
              <button type="button" className="panel-btn" onClick={() => { setAlertId(null); setSheet("alerts"); }}><Ico name="bars" className="pop-ico" />All alerts</button>
            </div>
            {alertStatus.isError && <p className="act-err" role="alert">{apiErrorMessage(alertStatus.error, "Could not update the alert.")}</p>}
          </>
        )}
      </Sheet>
      <Sheet open={sheet === "report"} title={`Security report · ${day(data.window.from)}`} onClose={() => setSheet(null)}>
        <Fields
          rows={[
            ["Cameras online", `${kpis.camerasOnline} of ${kpis.cameras}`],
            ["Active alerts", count(kpis.activeAlerts)],
            ["Acknowledged alerts", count(kpis.acknowledgedAlerts)],
            ["Critical incidents", count(kpis.critical)],
            ["Gate entries", count(kpis.people)],
            ["Vehicles tracked", count(kpis.vehicles)],
            ["Access granted / denied", `${count(access.granted)} / ${count(access.denied)}`],
            ["Lockdown", lockdown ? `Active since ${clock(lockdown.startedAt)}` : "None"],
          ]}
        />
        <div className="sheet-gap" />
        <button type="button" className="panel-btn no-print" onClick={() => window.print()}><Ico name="download" className="pop-ico" />Print report</button>
      </Sheet>
    </div>
  );
}
