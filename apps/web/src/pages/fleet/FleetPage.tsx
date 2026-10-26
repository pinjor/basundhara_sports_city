import { useState } from "react";
import { FleetVehicleStatus, TripStatus, TRIP_STATUS_TRANSITIONS, FLEET_VEHICLE_STATUS_TRANSITIONS, Role, type TripDto } from "@bsc/shared";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { useFeaturePreset } from "../../lib/featurePresets";
import { Button } from "../../components/ui/Button";
import { StatusBadge, statusLabel } from "../../components/ui/StatusBadge";
import { StatTile } from "../../components/ui/StatTile";
import { StatusKanban } from "../../components/ui/StatusKanban";
import { useFleetVehicles, useSetFleetVehicleStatus, useTrips, useAdvanceTrip } from "../../api/fleet";
import { useAuthStore } from "../../store/auth";
import { FleetVehicleFormModal } from "./FleetVehicleFormModal";
import { TripRequestModal } from "./TripRequestModal";
import { useToast } from "../../components/ui/Toast";

export function FleetPage() {
  const [createVehicleOpen, setCreateVehicleOpen] = useState(false);
  const [requestTripOpen, setRequestTripOpen] = useState(false);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  useFeaturePreset((preset) => {
    setType(preset.type ?? "");
    setStatus(preset.status ?? "");
  });

  const { data: vehiclesRaw = [], isLoading } = useFleetVehicles();
  const vehicles = vehiclesRaw.filter((v) => (!type || v.type === type) && (!status || v.status === status));
  const { data: trips = [] } = useTrips();
  const setVehicleStatus = useSetFleetVehicleStatus();
  const advanceTrip = useAdvanceTrip();
  const { push } = useToast();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === Role.SUPER_ADMIN || role === Role.FLEET_DISPATCHER;

  const availableCount = vehicles.filter((v) => v.status === FleetVehicleStatus.AVAILABLE).length;
  const onTripCount = vehicles.filter((v) => v.status === FleetVehicleStatus.ON_TRIP).length;
  const utilisation = vehicles.length > 0 ? Math.round((onTripCount / vehicles.length) * 100) : 0;

  async function quickStatus(id: string, status: string, label: string) {
    try {
      await setVehicleStatus.mutateAsync({ id, status });
    } catch {
      push(`Could not move ${label} to ${status}.`, "danger");
    }
  }

  return (
    <div>
      <ModuleHeader
        purpose="Buggies, shuttles and VIP cars — live status and the trip queue they're dispatched against."
        action={
          canManage && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setRequestTripOpen(true)}>+ Request trip</Button>
              <Button onClick={() => setCreateVehicleOpen(true)}>+ New vehicle</Button>
            </div>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Fleet size" value={vehicles.length} tone="gold" />
        <StatTile label="Available" value={availableCount} tone="teal" />
        <StatTile label="On trip" value={onTripCount} tone="blue" />
        <StatTile label="Utilisation" value={utilisation} suffix="%" />
      </div>

      {isLoading ? (
        <p className="text-sm text-text-dim">Loading fleet…</p>
      ) : (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {vehicles.map((vehicle) => {
            const nextStatuses = FLEET_VEHICLE_STATUS_TRANSITIONS[vehicle.status] ?? [];
            return (
              <div key={vehicle.id} className="panel p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-text">{vehicle.type}</div>
                    <div className="text-xs text-text-dimmer">{vehicle.driverName ?? "Unassigned"}</div>
                  </div>
                  <StatusBadge status={vehicle.status} />
                </div>
                <div className="mb-3 text-xs text-text-dim">{vehicle.currentLocation ?? "Location unknown"}</div>
                <div className="flex flex-wrap gap-1.5">
                  {nextStatuses.length === 0 && <span className="text-xs text-text-dimmer">Assigned to an active trip.</span>}
                  {nextStatuses.map((s) => (
                    <Button
                      key={s}
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      onClick={() => quickStatus(vehicle.id, s, vehicle.type)}
                      disabled={!canManage || setVehicleStatus.isPending}
                    >
                      {statusLabel(s)}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h3 className="mb-3 font-display text-base font-semibold text-text">Trip queue</h3>
      <StatusKanban<TripDto>
        columns={Object.values(TripStatus)}
        items={trips}
        statusOf={(t) => t.status}
        keyFor={(t) => t.id}
        nextStatusFor={(t) => TRIP_STATUS_TRANSITIONS[t.status]?.[0] ?? null}
        advancing={advanceTrip.isPending}
        onAdvance={(t, status) => advanceTrip.mutate({ id: t.id, status })}
        renderCard={(t) => (
          <div>
            <div className="font-medium text-text">{t.passengerRef}</div>
            <div className="text-xs text-text-dimmer">{t.fromLocation} → {t.toLocation}</div>
            <div className="text-xs text-text-dimmer">
              {t.vehicle?.type} · {t.vehicle?.driverName} · {new Date(t.requestedAt).toLocaleTimeString()}
            </div>
          </div>
        )}
      />

      <FleetVehicleFormModal open={createVehicleOpen} onClose={() => setCreateVehicleOpen(false)} />
      <TripRequestModal open={requestTripOpen} onClose={() => setRequestTripOpen(false)} />
    </div>
  );
}
