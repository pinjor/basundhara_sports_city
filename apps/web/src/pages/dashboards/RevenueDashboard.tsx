import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RANGE_LABELS, useRevenueDash, useSettleInvoice, type RangeKey, type RevenueDash } from "../../api/dashboards";
import { apiErrorMessage } from "../../lib/apiError";
import { bdt, bdtShort, change, count, day, scale } from "./format";
import { Ico } from "./icons";
import { Badge, Bars, Card, Cols, DashStatus, Donut, Fields, KeyPick, Kpi, Line, Pick, RowMenu, Sheet, ViewAll, useReadOnly } from "./widgets";

type Invoice = RevenueDash["invoices"][number];

const tone: Record<string, "green" | "blue" | "red" | "grey" | "gold"> = { Paid: "green", Partial: "blue", Overdue: "red", Draft: "grey", Open: "gold" };
const COLORS = ["#f2b81d", "#3f97f4", "#9158ef", "#22c97a", "#f5a524", "#f0444a"];
const millions = (n: number) => `${n}M`;
const VIEWS = ["Monthly", "Quarterly"];

const quarters = (values: number[]) => [0, 3, 6, 9].map((i) => Math.round(values.slice(i, i + 3).reduce((a, b) => a + b, 0) * 10) / 10);
const settleable = (row: Invoice) => row.status === "ISSUED" && row.balance > 0;

export function RevenueDashboard() {
  const navigate = useNavigate();
  const ro = useReadOnly();
  const [range, setRange] = useState<RangeKey>("year");
  const [view, setView] = useState("Monthly");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, error, refetch } = useRevenueDash(range);
  const settle = useSettleInvoice();

  if (!data) return <DashStatus error={error} onRetry={() => refetch()} />;

  const { kpis, trend, sources, comparison, invoices, insights } = data;
  const open = invoices.find((r) => r.id === openId) ?? null;
  const markPaid = (id: string) => settle.mutate(id);
  const trendScale = scale([...trend.revenue, ...trend.invoiced], millions);
  const compare = view === "Monthly"
    ? { labels: comparison.labels, current: comparison.current, previous: comparison.previous.slice(0, comparison.labels.length) }
    : { labels: ["Q1", "Q2", "Q3", "Q4"], current: quarters(comparison.current), previous: quarters(comparison.previous) };
  const compareScale = scale([...compare.current, ...compare.previous], millions);
  const topSource = sources[0]?.amount ?? 0;

  return (
    <div className="page p-rev">
      <div className="title-row">
        <div>
          <h2 className="dash-title"><span>Revenue</span> Dashboard</h2>
          <p className="sub">Track revenue performance, monitor income streams and drive sustainable growth.</p>
        </div>
        <div className="date-pick">
          <KeyPick options={RANGE_LABELS} value={range} onChange={setRange} icon="calendar" />
        </div>
      </div>

      <div className="kpis c4">
        <Kpi variant="stripe" icon="coins" label="Total Revenue" value={bdt(kpis.revenue)} {...change(kpis.revenueDelta)} color="#f2b81d" to="/finance?feature=revenue-management" />
        <Kpi variant="stripe" icon="bars" label="Total Invoices" value={count(kpis.invoices)} {...change(kpis.invoicesDelta)} color="#f0444a" to="/finance?feature=invoice-management" />
        <Kpi variant="stripe" icon="card" label="Received Amount" value={bdt(kpis.received)} {...change(kpis.receivedDelta)} color="#22c97a" to="/finance?feature=payment-tracking" />
        <Kpi variant="stripe" icon="hourglass" label="Outstanding Amount" value={bdt(kpis.outstanding)} color="#3f97f4" to="/finance?feature=receivable-management" />
      </div>

      <div className="row c-rev1">
        <Card title="Revenue Trend" icon="bars" sub={RANGE_LABELS[range]}>
          <Line
            key={range}
            labels={trend.labels}
            axis={trendScale.axis}
            max={trendScale.max}
            tick={Math.ceil(trend.labels.length / 12)}
            fmt={(v) => `৳ ${v}M`}
            series={[
              { name: "Revenue", color: "#f2b81d", values: trend.revenue },
              { name: "Invoiced", color: "#f0444a", values: trend.invoiced },
            ]}
          />
        </Card>
        <Card title="Revenue by Source" icon="pie" sub={RANGE_LABELS[range]}>
          {sources.length === 0 ? (
            <p className="sub">No revenue posted in this period.</p>
          ) : (
            <Donut
              key={range}
              center={bdtShort(kpis.revenue)}
              caption="Total Revenue"
              thick={17}
              parts={sources.map((s, i) => ({ label: s.label, pct: s.pct, color: COLORS[i % COLORS.length], value: `${s.pct}%` }))}
            />
          )}
        </Card>
      </div>

      <div className="row c-rev2">
        <Card title="Top Revenue Categories" icon="bars" sub={RANGE_LABELS[range]}>
          {sources.length === 0 ? (
            <p className="sub">No revenue posted in this period.</p>
          ) : (
            <Bars key={range} rows={sources.map((s, i) => ({ label: s.label, value: bdtShort(s.amount), pct: (s.amount / topSource) * 100, color: COLORS[i % COLORS.length] }))} />
          )}
        </Card>
        <Card title="Monthly Revenue Comparison" icon="trend" extra={<Pick options={VIEWS} value={view} onChange={setView} />}>
          <Cols
            key={view}
            labels={compare.labels}
            axis={compareScale.axis}
            max={compareScale.max}
            series={[
              { name: String(comparison.currentYear - 1), color: "#6b6f79", values: compare.previous },
              { name: String(comparison.currentYear), color: "#f2b81d", values: compare.current },
            ]}
          />
        </Card>
        <Card title="Key Insights" icon="bulb">
          <ul className="list insights scroll">
            {insights.length === 0 && <li className="empty">Not enough data for insights yet</li>}
            {insights.map((item) => (
              <li key={item.title}>
                <Ico name={item.tone === "red" ? "arrowDown" : "growth"} className={`ins-ico ${item.tone === "gold" ? "red" : item.tone}`} />
                <div><b>{item.title}</b><small>{item.text}</small></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Recent Invoices" icon="file" extra={<ViewAll to="/finance?feature=invoice-management" />}>
        <div className="table-wrap">
          <table className="d">
            <thead>
              <tr>{["Invoice No.", "Client / Customer", "Service", "Invoice Date", "Due Date", "Amount", "Status", "Action"].map((h) => <th key={h} className={h === "Action" ? "act" : ""}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr><td colSpan={8} className="empty">No invoices yet</td></tr>
              )}
              {invoices.map((row) => (
                <tr key={row.id}>
                  <td>{row.reference}</td>
                  <td>{row.party}</td>
                  <td>{row.service}</td>
                  <td>{day(row.issuedOn)}</td>
                  <td>{day(row.dueOn)}</td>
                  <td>{bdt(row.total)}</td>
                  <td><Badge tone={tone[row.state] ?? "grey"}>{row.state}</Badge></td>
                  <td className="act">
                    <RowMenu
                      items={[
                        { label: "View details", icon: "eye", onClick: () => setOpenId(row.id) },
                        ...(settleable(row) && !ro ? [{ label: "Mark as paid", icon: "check", onClick: () => markPaid(row.id) }] : []),
                        { label: "Open invoice desk", icon: "external", onClick: () => navigate("/finance?feature=invoice-management") },
                        { label: "Payment tracking", icon: "card", onClick: () => navigate("/finance?feature=payment-tracking") },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {settle.isError && !open && <p className="act-err" role="alert">{apiErrorMessage(settle.error, "Could not record the payment.")}</p>}
      </Card>

      <Sheet open={!!open} title={open?.reference ?? ""} onClose={() => { setOpenId(null); settle.reset(); }}>
        {open && (
          <Fields
            rows={[
              ["Client", open.party],
              ["Service", open.service],
              ["Invoice date", day(open.issuedOn)],
              ["Due date", day(open.dueOn)],
              ["Amount", bdt(open.total)],
              ["Balance due", bdt(open.balance)],
              ["Status", <Badge key="s" tone={tone[open.state] ?? "grey"}>{open.state}</Badge>],
            ]}
          />
        )}
        {open && (
          <div className="sheet-actions">
            {settleable(open) && !ro && (
              <button type="button" className="btn-gold" disabled={settle.isPending} onClick={() => markPaid(open.id)}>
                <Ico name="check" className="pop-ico" />{settle.isPending ? "Recording…" : `Record ${bdt(open.balance)} received`}
              </button>
            )}
            <button type="button" className="panel-btn" onClick={() => navigate("/finance?feature=invoice-management")}><Ico name="external" className="pop-ico" />Open invoice desk</button>
          </div>
        )}
        {open && settle.isError && <p className="act-err" role="alert">{apiErrorMessage(settle.error, "Could not record the payment.")}</p>}
      </Sheet>
    </div>
  );
}
