import { useState } from "react";
import { GateStatus, GateType, Role } from "@bsc/shared";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { useFeaturePreset } from "../../lib/featurePresets";
import { Button } from "../../components/ui/Button";
import { SelectInput } from "../../components/ui/Field";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { StatTile } from "../../components/ui/StatTile";
import { useGates, useRecentAccessLog, useToggleGate } from "../../api/gates";
import { useZones } from "../../api/zones";
import { useAuthStore } from "../../store/auth";
import { GateFormModal } from "./GateFormModal";
import { GateDetailModal } from "./GateDetailModal";
import { useToast } from "../../components/ui/Toast";

export function GatesPage() {
  const [type, setType] = useState("");
  useFeaturePreset((preset) => {
    setType(preset.type ?? "");
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);

  const { data: gates = [], isLoading } = useGates({ type: type || undefined });
  const { data: recentLog = [] } = useRecentAccessLog();
  const { data: zones = [] } = useZones({});
  const toggleGate = useToggleGate();
  const { push } = useToast();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === Role.SUPER_ADMIN || role === Role.GATE_SECURITY_OFFICER;

  const onlineCount = gates.filter((g) => g.status === GateStatus.ONLINE).length;
  const totalEntries = gates.reduce((sum, g) => sum + g.entriesToday, 0);
  const deniedToday = recentLog.filter((e) => e.result === "Denied").length;

  async function quickToggle(id: string, name: string) {
    try {
      const updated = await toggleGate.mutateAsync(id);
      push(`${name} is now ${updated.status}.`);
    } catch {
      push("Could not toggle gate.", "danger");
    }
  }

  return (
    <div>
      <ModuleHeader
        purpose="Every turnstile and reader on the complex — live status, entries, and the access log they generate."
        action={canManage && <Button onClick={() => setCreateOpen(true)}>+ New gate</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Gates online" value={onlineCount} tone="teal" />
        <StatTile label="Total gates" value={gates.length} tone="gold" />
        <StatTile label="Entries today" value={totalEntries} tone="blue" />
        <StatTile label="Denied (recent)" value={deniedToday} tone="red" />
      </div>

      <div className="mb-4">
        <SelectInput className="w-48" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All gate types</option>
          {Object.values(GateType).map((t) => <option key={t} value={t}>{t}</option>)}
        </SelectInput>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoading ? (
            <p className="text-sm text-text-dim">Loading gates…</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {gates.map((gate) => (
                <div key={gate.id} className="panel p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <button className="text-left font-medium text-text hover:text-gold" onClick={() => setSelectedGateId(gate.id)}>
                        {gate.name}
                      </button>
                      <div className="text-xs text-text-dimmer">{gate.type} · {gate.zone?.name}</div>
                    </div>
                    <StatusBadge status={gate.status} />
                  </div>
                  <div className="mb-3 text-2xl font-display text-text">{gate.entriesToday.toLocaleString()}
                    <span className="ml-1.5 text-xs font-body text-text-dimmer">entries today</span>
                  </div>
                  <Button
                    variant={gate.status === GateStatus.ONLINE ? "danger" : "secondary"}
                    onClick={() => quickToggle(gate.id, gate.name)}
                    disabled={!canManage || toggleGate.isPending}
                  >
                    {gate.status === GateStatus.ONLINE ? "Take offline" : "Bring online"}
                  </Button>
                </div>
              ))}
              {gates.length === 0 && <p className="text-sm text-text-dim">No gates match this filter.</p>}
            </div>
          )}
        </div>

        <div className="panel p-4">
          <h3 className="mb-3 font-display text-base font-semibold text-text">Live access log</h3>
          <div className="max-h-[560px] space-y-2 overflow-y-auto">
            {recentLog.length === 0 && <p className="text-sm text-text-dim">No access events yet.</p>}
            {recentLog.map((entry) => (
              <div key={entry.id} className="border-b border-border-soft pb-2 text-xs last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-text">{entry.personRef}</span>
                  <StatusBadge status={entry.result} />
                </div>
                <div className="text-text-dimmer">
                  {entry.gate?.name} · {entry.method} · {new Date(entry.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <GateFormModal open={createOpen} onClose={() => setCreateOpen(false)} zones={zones} />
      <GateDetailModal gateId={selectedGateId} onClose={() => setSelectedGateId(null)} />
    </div>
  );
}
