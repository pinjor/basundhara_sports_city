import { useState } from "react";
import { useQueryText } from "../../hooks/useQueryText";
import { VIPClassification, VIPStatus, Role } from "@bsc/shared";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { useFeaturePreset } from "../../lib/featurePresets";
import { Button } from "../../components/ui/Button";
import { SelectInput, TextInput } from "../../components/ui/Field";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { StatTile } from "../../components/ui/StatTile";
import { useVipGuests } from "../../api/vipGuests";
import { useAuthStore } from "../../store/auth";
import { VipGuestFormModal } from "./VipGuestFormModal";
import { VipGuestDetailModal } from "./VipGuestDetailModal";

export function VipPage() {
  const [classification, setClassification] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useQueryText();
  useFeaturePreset((preset) => {
    setClassification(preset.classification ?? "");
    setStatus(preset.status ?? "");
    setSearch(preset.search ?? search);
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

  const { data: guests = [], isLoading } = useVipGuests({
    classification: classification || undefined,
    status: status || undefined,
    search: search || undefined,
  });
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === Role.SUPER_ADMIN || role === Role.PROTOCOL_OFFICER;

  const byStatus = (s: string) => guests.filter((g) => g.status === s).length;
  const sorted = [...guests].sort((a, b) => new Date(a.arrivalDatetime).getTime() - new Date(b.arrivalDatetime).getTime());

  return (
    <div>
      <ModuleHeader
        purpose="Protocol arrival planning for VIP/VVIP guests — classification, escort, lounge, seat and meal."
        action={canManage && <Button onClick={() => setCreateOpen(true)}>+ New VIP guest</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total guests" value={guests.length} tone="gold" />
        <StatTile label="Scheduled" value={byStatus(VIPStatus.SCHEDULED)} tone="blue" />
        <StatTile label="Arrived" value={byStatus(VIPStatus.ARRIVED)} tone="teal" />
        <StatTile label="Departed" value={byStatus(VIPStatus.DEPARTED)} />
      </div>

      <div className="mb-4 grid gap-3 panel p-4 sm:grid-cols-3">
        <TextInput placeholder="Search guests…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <SelectInput value={classification} onChange={(e) => setClassification(e.target.value)}>
          <option value="">All classifications</option>
          {Object.values(VIPClassification).map((c) => <option key={c} value={c}>{c}</option>)}
        </SelectInput>
        <SelectInput value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.values(VIPStatus).map((s) => <option key={s} value={s}>{s}</option>)}
        </SelectInput>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-dim">Loading protocol list…</p>
      ) : (
        <div className="panel p-4">
          <h3 className="mb-4 font-display text-base font-semibold text-text">Arrival sequence</h3>
          <ol className="space-y-3">
            {sorted.map((guest, i) => (
              <li key={guest.id}>
                <button
                  onClick={() => setSelectedGuestId(guest.id)}
                  className="flex w-full items-center gap-4 rounded-md border border-border-soft bg-surface-2 px-4 py-3 text-left hover:border-gold/40"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 font-display text-sm text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-text">{guest.name}</span>
                      {guest.privacyFlag && <span className="text-xs text-gold">🔒</span>}
                    </div>
                    <div className="text-xs text-text-dimmer">
                      {guest.classification}{guest.designation ? ` · ${guest.designation}` : ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-text-dim">
                    {new Date(guest.arrivalDatetime).toLocaleString()}
                  </div>
                  <StatusBadge status={guest.status} />
                </button>
              </li>
            ))}
            {sorted.length === 0 && <p className="text-sm text-text-dim">No VIP guests match this filter.</p>}
          </ol>
        </div>
      )}

      <VipGuestFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <VipGuestDetailModal guestId={selectedGuestId} onClose={() => setSelectedGuestId(null)} />
    </div>
  );
}
