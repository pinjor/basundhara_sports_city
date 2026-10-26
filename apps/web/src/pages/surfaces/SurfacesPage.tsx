import { useState } from "react";
import { CLOSURE_STATUS_TRANSITIONS, ClosureStatus, EquipmentStatus, Role, type EquipmentDto } from "@bsc/shared";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { Button } from "../../components/ui/Button";
import { StatusBadge, statusLabel } from "../../components/ui/StatusBadge";
import { StatTile } from "../../components/ui/StatTile";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { SelectInput } from "../../components/ui/Field";
import { useSurfaces, useSetClosureStatus, useEquipment, useSetEquipmentStatus } from "../../api/surfaces";
import { useFacilities } from "../../api/facilities";
import { useAuthStore } from "../../store/auth";
import { SurfaceFormModal } from "./SurfaceFormModal";
import { EquipmentFormModal } from "./EquipmentFormModal";
import { useToast } from "../../components/ui/Toast";

export function SurfacesPage() {
  const [createSurfaceOpen, setCreateSurfaceOpen] = useState(false);
  const [createEquipmentOpen, setCreateEquipmentOpen] = useState(false);

  const { data: surfaces = [], isLoading: loadingSurfaces } = useSurfaces();
  const { data: equipment = [], isLoading: loadingEquipment } = useEquipment();
  const { data: facilities = [] } = useFacilities({});
  const setClosureStatus = useSetClosureStatus();
  const setEquipmentStatus = useSetEquipmentStatus();
  const { push } = useToast();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === Role.SUPER_ADMIN || role === Role.VENUE_FACILITY_MANAGER;

  const closedCount = surfaces.filter((s) => s.closureStatus !== ClosureStatus.OPEN).length;
  const underRepairCount = equipment.filter((e) => e.status === EquipmentStatus.UNDER_REPAIR).length;

  async function transitionClosure(id: string, status: string, name: string) {
    try {
      await setClosureStatus.mutateAsync({ id, closureStatus: status });
    } catch {
      push(`Could not update ${name}.`, "danger");
    }
  }

  const equipmentColumns: Column<EquipmentDto>[] = [
    { header: "Equipment", accessor: (e) => <span className="font-medium">{e.name}</span> },
    { header: "Category", accessor: (e) => e.category },
    { header: "Quantity", accessor: (e) => e.quantity },
    {
      header: "Status",
      accessor: (e) => (
        <SelectInput
          className="w-auto"
          value={e.status}
          disabled={!canManage}
          onChange={(ev) => setEquipmentStatus.mutate({ id: e.id, status: ev.target.value })}
        >
          {Object.values(EquipmentStatus).map((s) => <option key={s} value={s}>{s}</option>)}
        </SelectInput>
      ),
    },
  ];

  return (
    <div>
      <ModuleHeader
        purpose="Pitch and court condition, closures, and the equipment inventory that keeps play running."
        action={
          canManage && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setCreateEquipmentOpen(true)}>+ Equipment</Button>
              <Button onClick={() => setCreateSurfaceOpen(true)}>+ Surface profile</Button>
            </div>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Surface profiles" value={surfaces.length} tone="gold" />
        <StatTile label="Closed" value={closedCount} tone="red" />
        <StatTile label="Equipment items" value={equipment.length} tone="blue" />
        <StatTile label="Under repair" value={underRepairCount} />
      </div>

      <h3 className="mb-3 font-display text-base font-semibold text-text">Playing surfaces</h3>
      {loadingSurfaces ? (
        <p className="text-sm text-text-dim">Loading surfaces…</p>
      ) : (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {surfaces.map((surface) => {
            const nextStatuses = CLOSURE_STATUS_TRANSITIONS[surface.closureStatus] ?? [];
            return (
              <div key={surface.id} className="panel p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-text">{surface.facility?.name}</div>
                    <div className="text-xs text-text-dimmer">{surface.surfaceType}</div>
                  </div>
                  <StatusBadge status={surface.condition} />
                </div>
                {surface.moisturePercent != null && (
                  <div className="mb-2 text-xs text-text-dim">Moisture: {surface.moisturePercent}%</div>
                )}
                <div className="mb-3">
                  <StatusBadge status={surface.closureStatus} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {nextStatuses.map((s) => (
                    <Button
                      key={s}
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      onClick={() => transitionClosure(surface.id, s, surface.facility?.name ?? "surface")}
                      disabled={!canManage || setClosureStatus.isPending}
                    >
                      {statusLabel(s)}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
          {surfaces.length === 0 && <p className="text-sm text-text-dim">No surface profiles yet.</p>}
        </div>
      )}

      <h3 className="mb-3 font-display text-base font-semibold text-text">Equipment inventory</h3>
      {loadingEquipment ? (
        <p className="text-sm text-text-dim">Loading equipment…</p>
      ) : (
        <DataTable columns={equipmentColumns} rows={equipment} keyFor={(e) => e.id} />
      )}

      <SurfaceFormModal open={createSurfaceOpen} onClose={() => setCreateSurfaceOpen(false)} facilities={facilities} />
      <EquipmentFormModal open={createEquipmentOpen} onClose={() => setCreateEquipmentOpen(false)} />
    </div>
  );
}
