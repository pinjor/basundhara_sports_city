import { useState } from "react";
import { OutletStatus, OrderStatus, ORDER_STATUS_TRANSITIONS, Role, type OrderDto } from "@bsc/shared";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { useFeaturePreset } from "../../lib/featurePresets";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { StatTile } from "../../components/ui/StatTile";
import { StatusKanban } from "../../components/ui/StatusKanban";
import { useOutlets, useToggleOutlet, useOrders, useAdvanceOrder } from "../../api/outlets";
import { useZones } from "../../api/zones";
import { useAuthStore } from "../../store/auth";
import { OutletFormModal } from "./OutletFormModal";
import { OrderFormModal } from "./OrderFormModal";
import { useToast } from "../../components/ui/Toast";

export function OutletsPage() {
  const [createOutletOpen, setCreateOutletOpen] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [type, setType] = useState("");
  useFeaturePreset((preset) => {
    setType(preset.type ?? "");
  });

  const { data: outletsRaw = [], isLoading } = useOutlets();
  const outlets = type ? outletsRaw.filter((o) => o.type === type) : outletsRaw;
  const { data: orders = [] } = useOrders();
  const { data: zones = [] } = useZones({});
  const toggleOutlet = useToggleOutlet();
  const advanceOrder = useAdvanceOrder();
  const { push } = useToast();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === Role.SUPER_ADMIN || role === Role.HOSPITALITY_LEAD;

  const openCount = outlets.filter((o) => o.status === OutletStatus.OPEN).length;
  const activeOrders = orders.filter((o) => o.status !== OrderStatus.DELIVERED).length;
  const revenueToday = orders.reduce((sum, o) => sum + Number(o.amount), 0);

  async function doToggle(id: string, name: string) {
    try {
      const updated = await toggleOutlet.mutateAsync(id);
      push(`${name} is now ${updated.status}.`);
    } catch {
      push("Could not toggle outlet.", "danger");
    }
  }

  return (
    <div>
      <ModuleHeader
        purpose="Restaurants, food courts, cafés and concessions — open/closed status and the order queue."
        action={
          canManage && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setCreateOrderOpen(true)}>+ New order</Button>
              <Button onClick={() => setCreateOutletOpen(true)}>+ New outlet</Button>
            </div>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Outlets" value={outlets.length} tone="gold" />
        <StatTile label="Open now" value={openCount} tone="teal" />
        <StatTile label="Active orders" value={activeOrders} tone="blue" />
        <StatTile label="Revenue (recent orders)" value={revenueToday} prefix="৳" />
      </div>

      {isLoading ? (
        <p className="text-sm text-text-dim">Loading outlets…</p>
      ) : (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {outlets.map((outlet) => (
            <div key={outlet.id} className="panel p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="font-medium text-text">{outlet.name}</div>
                  <div className="text-xs text-text-dimmer">{outlet.type} · {outlet.zone?.name}</div>
                </div>
                <StatusBadge status={outlet.status} />
              </div>
              <Button
                variant={outlet.status === OutletStatus.OPEN ? "danger" : "secondary"}
                onClick={() => doToggle(outlet.id, outlet.name)}
                disabled={!canManage}
              >
                {outlet.status === OutletStatus.OPEN ? "Close" : "Open"}
              </Button>
            </div>
          ))}
        </div>
      )}

      <h3 className="mb-3 font-display text-base font-semibold text-text">Order queue</h3>
      <StatusKanban<OrderDto>
        columns={Object.values(OrderStatus)}
        items={orders}
        statusOf={(o) => o.status}
        keyFor={(o) => o.id}
        nextStatusFor={(o) => ORDER_STATUS_TRANSITIONS[o.status]?.[0] ?? null}
        advancing={advanceOrder.isPending}
        onAdvance={(o, status) => advanceOrder.mutate({ id: o.id, status })}
        renderCard={(o) => (
          <div>
            <div className="font-medium text-text">{o.outlet?.name}</div>
            <div className="text-xs text-text-dimmer">
              {o.items.map((it) => `${it.qty}× ${it.name}`).join(", ")}
            </div>
            <div className="mt-1 text-xs text-text-dim">৳{Number(o.amount).toLocaleString()} · {new Date(o.placedAt).toLocaleTimeString()}</div>
          </div>
        )}
      />

      <OutletFormModal open={createOutletOpen} onClose={() => setCreateOutletOpen(false)} zones={zones} />
      <OrderFormModal open={createOrderOpen} onClose={() => setCreateOrderOpen(false)} outlets={outlets} />
    </div>
  );
}
