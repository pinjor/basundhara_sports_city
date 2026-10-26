import { useState } from "react";
import { useQueryText } from "../../hooks/useQueryText";
import { VisitorCategory, VisitorStatus, Role, type VisitorDto } from "@bsc/shared";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { useFeaturePreset } from "../../lib/featurePresets";
import { Button } from "../../components/ui/Button";
import { SelectInput, TextInput } from "../../components/ui/Field";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { StatTile } from "../../components/ui/StatTile";
import { useVisitors } from "../../api/visitors";
import { useAuthStore } from "../../store/auth";
import { VisitorFormModal } from "./VisitorFormModal";
import { VisitorDetailModal } from "./VisitorDetailModal";

export function VisitorsPage() {
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useQueryText();
  useFeaturePreset((preset) => {
    setCategory(preset.category ?? "");
    setStatus(preset.status ?? "");
    setSearch(preset.search ?? search);
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);

  const { data: visitors = [], isLoading } = useVisitors({ category: category || undefined, status: status || undefined, search: search || undefined });
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === Role.SUPER_ADMIN || role === Role.GATE_SECURITY_OFFICER;

  const byStatus = (s: string) => visitors.filter((v) => v.status === s).length;

  const columns: Column<VisitorDto>[] = [
    { header: "Visitor", accessor: (v) => <span className="font-medium">{v.name}</span> },
    { header: "Host", accessor: (v) => v.host },
    { header: "Category", accessor: (v) => v.category },
    { header: "Purpose", accessor: (v) => v.purpose },
    { header: "Escort", accessor: (v) => (v.escortRequired ? "Required" : "—") },
    { header: "Status", accessor: (v) => <StatusBadge status={v.status} /> },
  ];

  return (
    <div>
      <ModuleHeader
        purpose="Guest, contractor and school-visit registration — check-in, check-out, and the QR pass trail."
        action={canManage && <Button onClick={() => setCreateOpen(true)}>+ Register visitor</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total visitors" value={visitors.length} tone="gold" />
        <StatTile label="Expected" value={byStatus(VisitorStatus.EXPECTED)} tone="blue" />
        <StatTile label="Checked in" value={byStatus(VisitorStatus.CHECKED_IN)} tone="teal" />
        <StatTile label="Checked out" value={byStatus(VisitorStatus.CHECKED_OUT)} />
      </div>

      <div className="mb-4 grid gap-3 panel p-4 sm:grid-cols-3">
        <TextInput placeholder="Search visitors…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <SelectInput value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {Object.values(VisitorCategory).map((c) => <option key={c} value={c}>{c}</option>)}
        </SelectInput>
        <SelectInput value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.values(VisitorStatus).map((s) => <option key={s} value={s}>{s}</option>)}
        </SelectInput>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-dim">Loading visitors…</p>
      ) : (
        <DataTable columns={columns} rows={visitors} keyFor={(v) => v.id} onRowClick={(v) => setSelectedVisitorId(v.id)} />
      )}

      <VisitorFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <VisitorDetailModal visitorId={selectedVisitorId} onClose={() => setSelectedVisitorId(null)} />
    </div>
  );
}
