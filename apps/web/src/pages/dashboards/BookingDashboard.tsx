import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BOOKING_STATUS_TRANSITIONS, BookingStatus } from "@bsc/shared";
import { useBookingDash, useBookingPaid, useBookingStatus, type BookingRow, type RangeKey } from "../../api/dashboards";
import { apiErrorMessage } from "../../lib/apiError";
import { bdt, bdtShort, change, count, day, initials, scale, slotTime } from "./format";
import { Ico, facilityIcon } from "./icons";
import { Badge, Bars, Card, Cols, DashStatus, Donut, Fields, KeyPick, Kpi, Quick, Ring, RowMenu, Sheet, ViewAll, useReadOnly } from "./widgets";

const RANGES = { month: "This Month", "last-month": "Last Month" } satisfies Partial<Record<RangeKey, string>>;
type BookingRange = keyof typeof RANGES;

const statusTone: Record<string, "green" | "gold" | "grey" | "red"> = { Confirmed: "green", Pending: "gold", Completed: "grey", Cancelled: "red", "No-show": "red" };
const payTone = (status: string) => (status === "Paid" ? "green" : status === "Unpaid" ? "red" : "gold");
const ringColor = (pct: number) => (pct >= 80 ? "#22c97a" : pct >= 30 ? "#f2b81d" : "#8d919a");
const can = (row: BookingRow, to: string) => (BOOKING_STATUS_TRANSITIONS[row.status] ?? []).includes(to);

export function BookingDashboard() {
  const navigate = useNavigate();
  const ro = useReadOnly();
  const [range, setRange] = useState<BookingRange>("month");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, error, refetch } = useBookingDash(range);
  const setStatus = useBookingStatus();
  const markPaid = useBookingPaid();

  if (!data) return <DashStatus error={error} onRetry={() => refetch()} />;

  const { kpis, trend, tickets, status, venues, popular, occupancy, recent, insights } = data;
  const open = recent.find((b) => b.id === openId) ?? null;
  const failure = setStatus.error ?? markPaid.error;
  const busy = setStatus.isPending || markPaid.isPending;
  const totalStatus = status.Pending + status.Confirmed + status.Completed + status.Cancelled;
  const share = (n: number) => (totalStatus ? Math.round((n / totalStatus) * 1000) / 10 : 0);
  const trendScale = scale([...trend.bookings, ...trend.revenue.map((v) => v / 1000)]);
  const ticketScale = scale([...tickets.online, ...tickets.onsite]);
  const topVenue = Math.max(1, ...venues.map((v) => v.pct));
  const topSport = Math.max(1, ...popular.map((p) => p.pct));

  const actions = (b: BookingRow) => {
    const base = [{ label: "View booking", icon: "eye", onClick: () => setOpenId(b.id) }];
    const desk = { label: "Open in records", icon: "external", onClick: () => navigate(`/bookings?view=records&q=${encodeURIComponent(b.customer)}`) };
    if (ro) return [...base, desk];
    return [
      ...base,
      ...(can(b, BookingStatus.CONFIRMED) ? [{ label: "Approve", icon: "check", onClick: () => setStatus.mutate({ id: b.id, status: BookingStatus.CONFIRMED }) }] : []),
      ...(!b.paid && b.status !== BookingStatus.CANCELLED ? [{ label: "Mark as paid", icon: "card", onClick: () => markPaid.mutate(b.id) }] : []),
      ...(can(b, BookingStatus.CANCELLED) ? [{ label: "Cancel booking", icon: "x", onClick: () => setStatus.mutate({ id: b.id, status: BookingStatus.CANCELLED }) }] : []),
      desk,
    ];
  };

  return (
    <div className="page p-book">
      <header className="hero" style={{ backgroundImage: "linear-gradient(90deg, rgba(0,0,0,.88) 0%, rgba(0,0,0,.45) 30%, rgba(0,0,0,0) 55%), url(/dash/hero-booking.jpg)" }}>
        <h2 className="gold upper">Booking &amp; Ticketing</h2>
        <p className="sub">Play. Book. Experience.</p>
        <div className="hero-script">
          More<br />Than Sports
          <small>A City of Possibilities</small>
        </div>
      </header>

      <div className="kpis c6">
        <Kpi variant="compact" icon="calendar" label={`Bookings (${RANGES[range]})`} value={count(kpis.bookings)} {...change(kpis.bookingsDelta)} to="/bookings?view=records" />
        <Kpi variant="compact" icon="ticket" label="Tickets Sold Today" value={count(kpis.ticketsToday)} to="/ticketing" />
        <Kpi variant="compact" icon="users" label="Active Members" value={count(kpis.activeMembers)} {...change(kpis.membersDelta)} to="/membership" />
        <Kpi variant="compact" icon="coins" label="Revenue Today" value={bdtShort(kpis.revenueToday)} to="/ticketing/reports" />
        <Kpi variant="compact" icon="pie" label="Occupancy (Next 7 Days)" value={`${kpis.occupancy}%`} to="/facilities" />
        <Kpi variant="compact" icon="star" label="Upcoming Events" value={count(kpis.upcomingEvents)} to="/ticketing/events" />
      </div>

      <div className="row c-bk1">
        <Card title="Booking Trend" sub="Bookings and revenue (৳ thousands) by week" extra={<KeyPick options={RANGES} value={range} onChange={setRange} />}>
          <Cols
            key={range}
            labels={trend.labels}
            axis={trendScale.axis}
            max={trendScale.max}
            wide
            series={[{ name: "Bookings", color: "#f2b81d", values: trend.bookings }]}
            line={{ name: "Revenue (৳K)", color: "#ffffff", values: trend.revenue.map((v) => Math.round(v / 100) / 10) }}
          />
        </Card>
        <Card title="Ticket Sales Trend" sub={RANGES[range]}>
          <Cols
            key={range}
            labels={tickets.labels}
            axis={ticketScale.axis}
            max={ticketScale.max}
            series={[
              { name: "Online", color: "#f2b81d", values: tickets.online },
              { name: "On-site", color: "#6b6f79", values: tickets.onsite },
            ]}
          />
        </Card>
        <Card title="Booking Status" sub="All bookings">
          <Donut
            center={count(totalStatus)}
            caption="Total Bookings"
            thick={16}
            parts={[
              { label: "Pending", pct: share(status.Pending), color: "#f2b81d", value: count(status.Pending) },
              { label: "Confirmed", pct: share(status.Confirmed), color: "#22c97a", value: count(status.Confirmed) },
              { label: "Completed", pct: share(status.Completed), color: "#3f97f4", value: count(status.Completed) },
              { label: "Cancelled", pct: share(status.Cancelled), color: "#f0444a", value: count(status.Cancelled) },
            ]}
          />
        </Card>
        <Card title="Revenue by Venue" sub={RANGES[range]}>
          {venues.length === 0 ? <p className="sub">No bookings in this period.</p> : (
            <Bars key={range} rows={venues.map((v) => ({ label: v.label, value: `${v.pct}%`, pct: (v.pct / topVenue) * 100 }))} />
          )}
        </Card>
      </div>

      <div className="row c-bk2">
        <Card title="Venue Occupancy" sub="Booked hours, next 7 days">
          <div className="rings">
            {occupancy.map((f) => (
              <Ring key={f.id} pct={Math.round(f.pct)} color={ringColor(f.pct)} label={f.name} to="/bookings?feature=availability-calendar" />
            ))}
          </div>
        </Card>
        <Card title="Most Popular Sports Facilities" sub={`Share of bookings · ${RANGES[range]}`}>
          {popular.length === 0 ? <p className="sub">No bookings in this period.</p> : (
            <Bars key={range} rank rows={popular.map((p) => ({ label: p.label, icon: facilityIcon(p.label), value: `${p.pct}%`, pct: (p.pct / topSport) * 100 }))} />
          )}
        </Card>
        <Link to="/ticketing/events" className="promo" style={{ backgroundImage: "url(/dash/player.jpg)" }} aria-label="Upcoming events">
          <p>Sports<br /><span>brings us</span><br />together</p>
        </Link>
        <Card title="Insights" icon="sparkle">
          <ul className="list ai scroll">
            {insights.map((item) => (
              <li key={item.title}>
                <button type="button" className="ai-row" onClick={() => navigate(item.to)}>
                  <Ico name={item.icon} className="ai-ico" />
                  <span><b>{item.title}</b><small>{item.text}</small></span>
                  <Ico name="chevronR" className="chev" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="row c-bk3">
        <Card title="Recent Bookings" extra={<ViewAll to="/bookings?view=records" label="View All →" />}>
          <div className="table-wrap">
            <table className="d">
              <thead>
                <tr>{["#", "Booking ID", "Customer Name", "Venue", "Date & Time", "Amount", "Payment Status", "Approval Status", "Actions"].map((h) => <th key={h} className={h === "Actions" ? "act" : ""}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {recent.length === 0 && <tr><td colSpan={9} className="empty">No bookings yet</td></tr>}
                {recent.map((b, i) => (
                  <tr key={b.id}>
                    <td>{i + 1}</td>
                    <td>{b.reference}</td>
                    <td><span className="who"><span className="ava-txt" aria-hidden>{initials(b.customer)}</span>{b.customer}</span></td>
                    <td>{b.venue}</td>
                    <td className="dt">{day(b.date)}<br />{slotTime(b.time)}</td>
                    <td>{bdt(b.amount)}</td>
                    <td><Badge tone={payTone(b.paymentStatus)}>{b.paymentStatus}</Badge></td>
                    <td><Badge tone={statusTone[b.status] ?? "grey"}>{b.status}</Badge></td>
                    <td className="act">
                      <RowMenu items={actions(b)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {failure && !open && <p className="act-err" role="alert">{apiErrorMessage(failure, "Could not update the booking.")}</p>}
        </Card>
        <div className="stack">
          <Card title="Booking Overview">
            <div className="overview">
              {([
                ["Pending", "orange", "hourglass"],
                ["Confirmed", "green", "check"],
                ["Completed", "green", "flag"],
                ["Cancelled", "red", "x"],
              ] as const).map(([k, c, icon]) => (
                <Link key={k} to={`/bookings?view=records&status=${k}`} className="ov">
                  <span className={`li-ico ${c}`}><Ico name={icon} /></span>
                  <div><b key={status[k]} className="fade-in">{count(status[k])}</b><small>{k} Bookings</small></div>
                </Link>
              ))}
            </div>
          </Card>
          <Card title="Quick Actions">
            <div className="qa">
              {!ro && <Quick icon="check" label="Approve Bookings" to="/bookings?view=records&status=Pending" />}
              {!ro && <Quick icon="ticket" label="Generate Ticket" to="/ticketing" />}
              {ro && <Quick icon="users" label="Members" to="/membership" />}
              {ro && <Quick icon="star" label="Upcoming Events" to="/ticketing/events" />}
              <Quick icon="download" label="Export Bookings" to="/bookings?view=records" />
              <Quick icon="calendar" label="View Venue Schedule" to="/bookings?feature=availability-calendar" />
            </div>
          </Card>
        </div>
      </div>

      <Sheet open={!!open} title={open ? `Booking ${open.reference}` : ""} onClose={() => { setOpenId(null); setStatus.reset(); markPaid.reset(); }}>
        {open && (
          <Fields
            rows={[
              ["Customer", open.customer],
              ["Venue", open.venue],
              ["Date & time", `${day(open.date)} · ${slotTime(open.time)}`],
              ["Amount", bdt(open.amount)],
              ["Payment", <Badge key="p" tone={payTone(open.paymentStatus)}>{open.paymentStatus}</Badge>],
              ["Approval", <Badge key="a" tone={statusTone[open.status] ?? "grey"}>{open.status}</Badge>],
            ]}
          />
        )}
        {open && (
          <div className="sheet-actions">
            {actions(open)
              .filter((a) => a.label !== "View booking")
              .map((a, i) => (
                <button key={a.label} type="button" disabled={busy && a.label !== "Open booking desk"} className={i === 0 && a.label !== "Open booking desk" ? "btn-gold" : "panel-btn"} onClick={a.onClick}>
                  <Ico name={a.icon} className="pop-ico" />
                  {a.label}
                </button>
              ))}
          </div>
        )}
        {open && failure && <p className="act-err" role="alert">{apiErrorMessage(failure, "Could not update the booking.")}</p>}
      </Sheet>
    </div>
  );
}
