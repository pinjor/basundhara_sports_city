import { useState } from "react";
import { ParkingZoneType, Role } from "@bsc/shared";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { useFeaturePreset } from "../../lib/featurePresets";
import { Button } from "../../components/ui/Button";
import { SelectInput } from "../../components/ui/Field";
import { StatTile } from "../../components/ui/StatTile";
import { useParkingZones } from "../../api/parking";
import { useZones } from "../../api/zones";
import { useAuthStore } from "../../store/auth";
import { ParkingZoneFormModal } from "./ParkingZoneFormModal";
import { ParkingZoneDetailModal } from "./ParkingZoneDetailModal";

export function ParkingPage() {
  const [type, setType] = useState("");
  useFeaturePreset((preset) => {
    setType(preset.type ?? "");
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const { data: zones = [], isLoading } = useParkingZones({ type: type || undefined });
  const { data: complexZones = [] } = useZones({});
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === Role.SUPER_ADMIN || role === Role.PARKING_MARSHAL;

  const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
  const totalOccupied = zones.reduce((sum, z) => sum + z.occupied, 0);
  const fullZones = zones.filter((z) => z.occupied >= z.capacity).length;

  return (
    <div>
      <ModuleHeader
        purpose="Parking precincts across the complex — capacity, live occupancy, and vehicle entry/exit."
        action={canManage && <Button onClick={() => setCreateOpen(true)}>+ New parking zone</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Zones" value={zones.length} tone="gold" />
        <StatTile label="Total capacity" value={totalCapacity} />
        <StatTile label="Currently occupied" value={totalOccupied} tone="teal" />
        <StatTile label="At full capacity" value={fullZones} tone="red" />
      </div>

      <div className="mb-4">
        <SelectInput className="w-48" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All zone types</option>
          {Object.values(ParkingZoneType).map((t) => <option key={t} value={t}>{t}</option>)}
        </SelectInput>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-dim">Loading parking zones…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {zones.map((zone) => {
            const pct = zone.capacity > 0 ? Math.round((zone.occupied / zone.capacity) * 100) : 0;
            const isFull = zone.occupied >= zone.capacity;
            return (
              <button
                key={zone.id}
                onClick={() => setSelectedZoneId(zone.id)}
                className="panel p-4 text-left"
              >
                <div className="mb-1 font-medium text-text">{zone.name}</div>
                <div className="mb-3 text-xs text-text-dimmer">{zone.type} · {zone.zone?.name}</div>
                <div className="mb-2 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full ${isFull ? "bg-red" : "bg-gold"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-xs text-text-dim">{zone.occupied} / {zone.capacity} spaces ({pct}%)</div>
              </button>
            );
          })}
          {zones.length === 0 && <p className="text-sm text-text-dim">No parking zones match this filter.</p>}
        </div>
      )}

      <ParkingZoneFormModal open={createOpen} onClose={() => setCreateOpen(false)} zones={complexZones} />
      <ParkingZoneDetailModal zoneId={selectedZoneId} onClose={() => setSelectedZoneId(null)} />
    </div>
  );
}
