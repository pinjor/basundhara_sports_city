import { useState } from "react";
import { useHrDash, type RangeKey } from "../../api/dashboards";
import { greeting, timeAgo } from "../../lib/audit";
import { change, count, day, initials, scale } from "./format";
import { Ico } from "./icons";
import { Card, Cols, DashStatus, Donut, KeyPick, Kpi, Quick, Sheet, ViewAll, useReadOnly } from "./widgets";

const RANGES = { month: "This Month", "last-month": "Last Month", quarter: "This Quarter" } satisfies Partial<Record<RangeKey, string>>;
type HrRange = keyof typeof RANGES;

const LEAVE_ICONS: Record<string, string> = { Annual: "plane", Sick: "heart", Casual: "calendar", Maternity: "baby" };
const DIST_COLORS = ["#f2b81d", "#f5d27a", "#fff1c4", "#4b4f58"];

export function HrDashboard() {
  const ro = useReadOnly();
  const [range, setRange] = useState<HrRange>("month");
  const [tab, setTab] = useState<"b" | "w">("b");
  const [detail, setDetail] = useState<"leave" | "dist" | null>(null);
  const { data, error, refetch } = useHrDash(range);

  if (!data) return <DashStatus error={error} onRetry={() => refetch()} />;

  const { kpis, headcount, attendance, leave, distribution, activities } = data;
  const people = tab === "b" ? data.birthdays : data.anniversaries;
  const head = scale(headcount.map((d) => d.count));
  const share = (n: number) => (attendance.total ? Math.round((n / attendance.total) * 1000) / 10 : 0);
  const notIn = Math.max(0, attendance.total - attendance.present - attendance.onLeave - attendance.absent);
  const hiresNote = `${kpis.newHiresChange >= 0 ? "+" : ""}${kpis.newHiresChange} vs last month`;
  const year = new Date().getFullYear();

  return (
    <div className="page p-hr">
      <header className="hero" style={{ backgroundImage: "linear-gradient(90deg, rgba(0,0,0,.9) 0%, rgba(0,0,0,.55) 34%, rgba(0,0,0,0) 62%), url(/dash/hero-hr.jpg)" }}>
        <p className="hello">{greeting()},</p>
        <h2 className="gold">Let’s Build Champions Together</h2>
        <p className="sub">Our People Power a Stronger Tomorrow</p>
        <div className="hero-brand">
          <b>Bashundhara Sports City</b>
          <small>People Build Champions</small>
        </div>
      </header>

      <div className="kpis c4">
        <Kpi variant="spark" icon="users" label="Total Employees" value={count(kpis.employees)} {...change(kpis.employeesDelta)} note={`${count(headcount.length)} departments`} to="/hrm?feature=employee-master" />
        <Kpi variant="spark" icon="calendar" label="Present Today" value={count(kpis.present)} note={`${kpis.presentPct}% attendance`} to="/hrm?feature=attendance-management" />
        <Kpi variant="spark" icon="plane" label="On Leave" value={count(kpis.onLeave)} note={`${kpis.onLeavePct}% of total`} to="/hrm?feature=leave-management" />
        <Kpi variant="spark" icon="userPlus" label="New Hires (This Month)" value={count(kpis.newHires)} {...change(kpis.newHiresDelta)} note={hiresNote} to="/hrm?feature=recruitment-management" />
      </div>

      <div className="row c-hr1">
        <Card title="Employee Headcount by Department" sub="Active employees at the end of the period" extra={<KeyPick options={RANGES} value={range} onChange={setRange} />}>
          <Cols key={range} labels={headcount.map((d) => d.department)} axis={head.axis} max={head.max} wide showValues series={[{ name: "Employees", color: "#f2b81d", values: headcount.map((d) => d.count) }]} />
        </Card>
        <Card title="Attendance Status" sub="Today">
          <Donut
            center={count(attendance.total)}
            caption="Total Employees"
            thick={16}
            parts={[
              { label: "Present", pct: share(attendance.present), color: "#f2b81d", value: `${count(attendance.present)} (${share(attendance.present)}%)` },
              { label: "On Leave", pct: share(attendance.onLeave), color: "#f5d27a", value: `${count(attendance.onLeave)} (${share(attendance.onLeave)}%)` },
              { label: "Absent", pct: share(attendance.absent), color: "#f0444a", value: `${count(attendance.absent)} (${share(attendance.absent)}%)` },
              { label: "Not checked in", pct: share(notIn), color: "#4b4f58", value: `${count(notIn)} (${share(notIn)}%)` },
            ]}
          />
        </Card>
      </div>

      <div className="row c-hr1">
        <Card title="Leave Overview" sub={`Approved leave in ${year}`} extra={<button type="button" className="view-all btn" onClick={() => setDetail("leave")}>View Details</button>}>
          <div className="leaves">
            {leave.map((l, i) => (
              <div key={l.type} className="leave">
                <span className="kpi-ico line" style={{ ["--a" as string]: "#f2b81d" }}><Ico name={LEAVE_ICONS[l.type] ?? "calendar"} /></span>
                <span>{l.type} Leave</span>
                <b>{count(l.days)}<small>Days</small></b>
                <div className="leave-bar">
                  <s><i style={{ width: `${l.share}%`, animationDelay: `${i * 70}ms` }} /></s>
                  <small>{l.share}%</small>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Employee Distribution" sub="By employment type" extra={<button type="button" className="view-all btn" onClick={() => setDetail("dist")}>View Details</button>}>
          <Donut
            center={count(kpis.employees)}
            caption="Total"
            thick={16}
            parts={distribution.map((d, i) => ({ label: d.type, pct: d.pct, color: DIST_COLORS[i % DIST_COLORS.length], value: `${d.pct}%` }))}
          />
        </Card>
      </div>

      <div className="row c-hr3">
        <Card title="Recent HR Activities" sub="Latest HR activities across the organization" extra={<ViewAll to="/hrm?feature=hr-reports" label="View All" />}>
          <ul className="list tight scroll">
            {activities.length === 0 && <li className="empty">No HR activity yet</li>}
            {activities.map((a) => (
              <li key={a.id}>
                <span className="li-ico"><Ico name="user" /></span>
                <div><b>{a.title}</b><small>{a.detail}</small></div>
                <span className="when">{timeAgo(a.at)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Upcoming Birthdays & Work Anniversaries" sub="Next 30 days" extra={<ViewAll to="/hrm?feature=employee-master" label="View All" />}>
          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === "b"} className={tab === "b" ? "on" : ""} onClick={() => setTab("b")}>Birthdays</button>
            <button type="button" role="tab" aria-selected={tab === "w"} className={tab === "w" ? "on" : ""} onClick={() => setTab("w")}>Work Anniversaries</button>
          </div>
          <ul className="list tight scroll fade-in" key={tab}>
            {people.length === 0 && <li className="empty">Nothing in the next 30 days</li>}
            {people.map((p) => (
              <li key={p.name + p.date}>
                <span className="ava sm ava-txt" aria-hidden>{initials(p.name)}</span>
                <div><b>{p.name}</b><small>{tab === "b" ? p.department : `${p.department} · ${p.years} year${p.years === 1 ? "" : "s"}`}</small></div>
                <span className="when date-gift">{p.inDays === 0 ? "Today" : day(p.date).slice(0, 6)}<Ico name={tab === "b" ? "gift" : "trophy"} /></span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Quick Actions" sub="Frequently used HR actions">
          <div className="qa">
            {!ro && <Quick icon="userPlus" label="Add Employee" to="/hrm?feature=employee-master" />}
            {!ro && <Quick icon="plane" label="Apply Leave" to="/hrm?feature=leave-management" />}
            <Quick icon="calendar" label="View Attendance" to="/hrm?feature=attendance-management" />
            <Quick icon="file" label="Generate Report" to="/hrm?feature=hr-reports" />
            {!ro && <Quick icon="cap" label="Schedule Training" to="/hrm?feature=training-management" />}
            <Quick icon="users" label="Employee Directory" to="/hrm?feature=employee-master" />
          </div>
        </Card>
      </div>

      <footer className="foot">
        <span>© {year} Bashundhara Sports City. All rights reserved.</span>
        <b>Sports Empowers People</b>
      </footer>

      <Sheet open={detail === "leave"} title={`Leave overview · ${year}`} onClose={() => setDetail(null)}>
        <ul className="list">
          {leave.map((l) => (
            <li key={l.type}>
              <span className="li-ico"><Ico name={LEAVE_ICONS[l.type] ?? "calendar"} /></span>
              <div><b>{l.type} Leave</b><small>{count(l.days)} days over {count(l.requests)} requests · {l.entitlement} days allowed per person</small></div>
              <span className="when">{l.share}% of leave</span>
            </li>
          ))}
        </ul>
      </Sheet>
      <Sheet open={detail === "dist"} title="Employment type" onClose={() => setDetail(null)}>
        <ul className="list">
          {distribution.map((d) => (
            <li key={d.type}>
              <span className="li-ico"><Ico name="users" /></span>
              <div><b>{d.type}</b><small>{count(d.count)} employees</small></div>
              <span className="when">{d.pct}%</span>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  );
}
