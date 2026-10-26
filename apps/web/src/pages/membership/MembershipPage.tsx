import { useState } from "react";
import { useQueryText } from "../../hooks/useQueryText";
import { MembershipTier, MemberStatus, Role, type MemberDto } from "@bsc/shared";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { useFeaturePreset } from "../../lib/featurePresets";
import { Button } from "../../components/ui/Button";
import { SelectInput, TextInput } from "../../components/ui/Field";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { StatTile } from "../../components/ui/StatTile";
import { useMembers } from "../../api/members";
import { useAuthStore } from "../../store/auth";
import { MemberFormModal } from "./MemberFormModal";
import { MemberDetailModal } from "./MemberDetailModal";

export function MembershipPage() {
  const [tier, setTier] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useQueryText();
  useFeaturePreset((preset) => {
    setTier(preset.tier ?? "");
    setStatus(preset.status ?? "");
    setSearch(preset.search ?? search);
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const { data: members = [], isLoading } = useMembers({ tier: tier || undefined, status: status || undefined, search: search || undefined });
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === Role.SUPER_ADMIN || role === Role.BOOKINGS_OFFICER;

  const byStatus = (s: string) => members.filter((m) => m.status === s).length;

  const columns: Column<MemberDto>[] = [
    { header: "Member", accessor: (m) => <span className="font-medium">{m.name}</span> },
    { header: "Email", accessor: (m) => m.email },
    { header: "Tier", accessor: (m) => m.tier },
    { header: "Expiry", accessor: (m) => new Date(m.expiryDate).toLocaleDateString() },
    { header: "Check-ins", accessor: (m) => m.checkInCount },
    { header: "Status", accessor: (m) => <StatusBadge status={m.status} /> },
  ];

  return (
    <div>
      <ModuleHeader
        purpose="Gym, pool and club membership — passes, check-ins, lockers and renewals."
        action={canManage && <Button onClick={() => setCreateOpen(true)}>+ New member</Button>}
      />

      <div className="stat-row mb-6">
        <StatTile label="Total members" value={members.length} tone="gold" />
        <StatTile label="Active" value={byStatus(MemberStatus.ACTIVE)} tone="teal" />
        <StatTile label="Frozen" value={byStatus(MemberStatus.FROZEN)} tone="blue" />
        <StatTile label="Expired" value={byStatus(MemberStatus.EXPIRED)} tone="red" />
      </div>

      <div className="mb-4 grid gap-3 panel p-4 sm:grid-cols-3">
        <TextInput placeholder="Search members…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <SelectInput value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="">All tiers</option>
          {Object.values(MembershipTier).map((t) => <option key={t} value={t}>{t}</option>)}
        </SelectInput>
        <SelectInput value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.values(MemberStatus).map((s) => <option key={s} value={s}>{s}</option>)}
        </SelectInput>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-dim">Loading members…</p>
      ) : (
        <DataTable columns={columns} rows={members} keyFor={(m) => m.id} onRowClick={(m) => setSelectedMemberId(m.id)} />
      )}

      <MemberFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <MemberDetailModal memberId={selectedMemberId} onClose={() => setSelectedMemberId(null)} />
    </div>
  );
}
