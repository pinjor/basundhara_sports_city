import { useState } from "react";
import { LoungeStatus, ServiceRequestStatus, SERVICE_REQUEST_STATUS_TRANSITIONS, Role, type ServiceRequestDto } from "@bsc/shared";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { StatTile } from "../../components/ui/StatTile";
import { StatusKanban } from "../../components/ui/StatusKanban";
import { useLounges, useAdjustLoungeOccupancy, useToggleLounge, useServiceRequests, useAdvanceServiceRequest } from "../../api/lounges";
import { useZones } from "../../api/zones";
import { useAuthStore } from "../../store/auth";
import { LoungeFormModal } from "./LoungeFormModal";
import { ServiceRequestFormModal } from "./ServiceRequestFormModal";
import { useToast } from "../../components/ui/Toast";

export function LoungesPage() {
  const [createLoungeOpen, setCreateLoungeOpen] = useState(false);
  const [createRequestOpen, setCreateRequestOpen] = useState(false);

  const { data: lounges = [], isLoading } = useLounges();
  const { data: requests = [] } = useServiceRequests();
  const { data: zones = [] } = useZones({});
  const adjustOccupancy = useAdjustLoungeOccupancy();
  const toggleLounge = useToggleLounge();
  const advanceRequest = useAdvanceServiceRequest();
  const { push } = useToast();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === Role.SUPER_ADMIN || role === Role.HOSPITALITY_LEAD;

  const totalCapacity = lounges.reduce((sum, l) => sum + l.capacity, 0);
  const totalOccupancy = lounges.reduce((sum, l) => sum + l.currentOccupancy, 0);
  const pendingRequests = requests.filter((r) => r.status === ServiceRequestStatus.PENDING).length;

  async function doAdjust(id: string, direction: "check-in" | "check-out", name: string) {
    try {
      await adjustOccupancy.mutateAsync({ id, direction });
    } catch {
      push(`Could not update ${name}'s occupancy.`, "danger");
    }
  }

  async function doToggle(id: string, name: string) {
    try {
      const updated = await toggleLounge.mutateAsync(id);
      push(`${name} is now ${updated.status}.`);
    } catch {
      push("Could not toggle lounge.", "danger");
    }
  }

  return (
    <div>
      <ModuleHeader
        purpose="VIP and hospitality lounges — capacity, occupancy, and the refreshment requests they generate."
        action={
          canManage && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setCreateRequestOpen(true)}>+ Service request</Button>
              <Button onClick={() => setCreateLoungeOpen(true)}>+ New lounge</Button>
            </div>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Lounges" value={lounges.length} tone="gold" />
        <StatTile label="Total capacity" value={totalCapacity} />
        <StatTile label="Current occupancy" value={totalOccupancy} tone="teal" />
        <StatTile label="Pending requests" value={pendingRequests} tone="blue" />
      </div>

      {isLoading ? (
        <p className="text-sm text-text-dim">Loading lounges…</p>
      ) : (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {lounges.map((lounge) => {
            const pct = lounge.capacity > 0 ? Math.round((lounge.currentOccupancy / lounge.capacity) * 100) : 0;
            return (
              <div key={lounge.id} className="panel p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-text">{lounge.name}</div>
                    <div className="text-xs text-text-dimmer">{lounge.zone?.name}</div>
                  </div>
                  <StatusBadge status={lounge.status} />
                </div>
                <div className="mb-2 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                </div>
                <div className="mb-3 text-xs text-text-dim">{lounge.currentOccupancy} / {lounge.capacity} occupied</div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => doAdjust(lounge.id, "check-in", lounge.name)} disabled={!canManage || lounge.status === LoungeStatus.CLOSED}>
                    + Party
                  </Button>
                  <Button variant="secondary" onClick={() => doAdjust(lounge.id, "check-out", lounge.name)} disabled={!canManage || lounge.currentOccupancy === 0}>
                    − Party
                  </Button>
                  <Button variant={lounge.status === LoungeStatus.CLOSED ? "secondary" : "danger"} onClick={() => doToggle(lounge.id, lounge.name)} disabled={!canManage}>
                    {lounge.status === LoungeStatus.CLOSED ? "Open" : "Close"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h3 className="mb-3 font-display text-base font-semibold text-text">Service requests</h3>
      <StatusKanban<ServiceRequestDto>
        columns={Object.values(ServiceRequestStatus)}
        items={requests}
        statusOf={(r) => r.status}
        keyFor={(r) => r.id}
        nextStatusFor={(r) => SERVICE_REQUEST_STATUS_TRANSITIONS[r.status]?.[0] ?? null}
        advancing={advanceRequest.isPending}
        onAdvance={(r, status) => advanceRequest.mutate({ id: r.id, status })}
        renderCard={(r) => (
          <div>
            <div className="font-medium text-text">{r.partyRef}</div>
            <div className="text-xs text-text-dimmer">{r.item}</div>
            <div className="text-xs text-text-dimmer">{r.lounge?.name} · {new Date(r.requestedAt).toLocaleTimeString()}</div>
          </div>
        )}
      />

      <LoungeFormModal open={createLoungeOpen} onClose={() => setCreateLoungeOpen(false)} zones={zones} />
      <ServiceRequestFormModal open={createRequestOpen} onClose={() => setCreateRequestOpen(false)} lounges={lounges} />
    </div>
  );
}
