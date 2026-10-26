import { useState } from "react";
import { useQueryText } from "../../hooks/useQueryText";
import { FacilityType, FacilityStatus, Role, type FacilityDto } from "@bsc/shared";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { useFeaturePreset } from "../../lib/featurePresets";
import { Button } from "../../components/ui/Button";
import { SelectInput, TextInput } from "../../components/ui/Field";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { StatTile } from "../../components/ui/StatTile";
import { useFacilities } from "../../api/facilities";
import { useZones } from "../../api/zones";
import { useAuthStore } from "../../store/auth";
import { FacilityFormModal } from "./FacilityFormModal";
import { FacilityDetailModal } from "./FacilityDetailModal";

export function FacilitiesPage() {
  const [zoneId, setZoneId] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useQueryText();
  useFeaturePreset((preset) => {
    setType(preset.type ?? "");
    setStatus(preset.status ?? "");
    setSearch(preset.search ?? search);
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<FacilityDto | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  const { data: facilities = [], isLoading } = useFacilities({
    zoneId: zoneId || undefined,
    type: type || undefined,
    status: status || undefined,
    search: search || undefined,
  });
  const { data: zones = [] } = useZones({});
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === Role.SUPER_ADMIN || role === Role.VENUE_FACILITY_MANAGER;

  const byStatus = (s: string) => facilities.filter((f) => f.status === s).length;

  const columns: Column<FacilityDto>[] = [
    { header: "Facility", accessor: (f) => <span className="font-medium">{f.name}</span> },
    { header: "Zone", accessor: (f) => f.zone?.name ?? "—" },
    { header: "Type", accessor: (f) => f.type },
    { header: "Capacity", accessor: (f) => f.capacity.toLocaleString() },
    { header: "Hours", accessor: (f) => `${f.operatingHoursStart}–${f.operatingHoursEnd}` },
    { header: "Status", accessor: (f) => <StatusBadge status={f.status} /> },
  ];

  return (
    <div>
      <ModuleHeader
        purpose="Every stadium, court, pool, lounge and back-of-house space — availability, capacity and condition."
        action={canManage && <Button onClick={() => setCreateOpen(true)}>+ New facility</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total facilities" value={facilities.length} tone="gold" />
        <StatTile label="Available" value={byStatus(FacilityStatus.AVAILABLE)} tone="teal" />
        <StatTile label="In use / reserved" value={byStatus(FacilityStatus.IN_USE) + byStatus(FacilityStatus.RESERVED)} tone="blue" />
        <StatTile label="In maintenance" value={byStatus(FacilityStatus.MAINTENANCE)} tone="red" />
      </div>

      <div className="mb-4 grid gap-3 panel p-4 sm:grid-cols-4">
        <TextInput placeholder="Search facilities…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <SelectInput value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
          <option value="">All zones</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </SelectInput>
        <SelectInput value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {Object.values(FacilityType).map((t) => <option key={t} value={t}>{t}</option>)}
        </SelectInput>
        <SelectInput value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.values(FacilityStatus).map((s) => <option key={s} value={s}>{s}</option>)}
        </SelectInput>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-dim">Loading facilities…</p>
      ) : (
        <DataTable columns={columns} rows={facilities} keyFor={(f) => f.id} onRowClick={(f) => setSelectedFacilityId(f.id)} />
      )}

      <FacilityFormModal open={createOpen} onClose={() => setCreateOpen(false)} zones={zones} />
      <FacilityFormModal
        open={!!editingFacility}
        onClose={() => setEditingFacility(null)}
        facility={editingFacility}
        zones={zones}
      />
      <FacilityDetailModal
        facilityId={selectedFacilityId}
        onClose={() => setSelectedFacilityId(null)}
        onEdit={() => {
          const f = facilities.find((ff) => ff.id === selectedFacilityId) ?? null;
          setEditingFacility(f);
          setSelectedFacilityId(null);
        }}
      />
    </div>
  );
}
