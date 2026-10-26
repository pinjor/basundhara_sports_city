import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { StatTile } from "../../components/ui/StatTile";
import { useOpsIncidents, useOpsTasks, useSetTaskStatus } from "../../api/operations";
import { useActiveFeature } from "../../hooks/useActiveFeature";
import { ModuleHub } from "../../features/ModuleHub";

export function TasksPage() {
  const { featureKey, feature } = useActiveFeature();
  const eventQueue = featureKey === "event-work-queue";
  const { data: tasks = [], isLoading } = useOpsTasks();
  const { data: incidents = [] } = useOpsIncidents();
  const setStatus = useSetTaskStatus();
  const open = tasks.filter((t) => t.status !== "Done");
  const eventTasks = tasks.filter((t) => t.eventPack);
  const deskTasks = eventQueue ? eventTasks : open;
  if (!featureKey) return <ModuleHub />;
  const groups = deskTasks.reduce<Record<string, typeof tasks>>((acc, task) => {
    const key = eventQueue ? task.eventPack?.title ?? "Unlinked" : task.area || "General";
    acc[key] = acc[key] ?? [];
    acc[key].push(task);
    return acc;
  }, {});

  return (
    <div>
      <header className="feature-hero mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            Tasks
            <span className="mx-2 text-gold/40">·</span>
            {eventQueue ? "Event operations" : "Open work"}
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold gold-foil">{feature?.label ?? "Open Tasks"}</h2>
          <p className="mt-2 max-w-3xl text-sm text-text-dim">
            {eventQueue
              ? "Work created when a booking is confirmed — grouped by event pack, not a flat dump of every ticket."
              : "Unfinished jobs across the campus. Completed items stay off this desk."}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Link
            to="/tasks?feature=open-tasks"
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${!eventQueue ? "border-gold bg-gold/20 text-gold" : "border-gold/20 text-text-dim"}`}
          >
            Open Tasks
          </Link>
          <Link
            to="/tasks?feature=event-work-queue"
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${eventQueue ? "border-gold bg-gold/20 text-gold" : "border-gold/20 text-text-dim"}`}
          >
            Event Work Queue
          </Link>
        </div>
      </header>

      <div className="stat-row mb-6">
        <StatTile label={eventQueue ? "Event tasks" : "Open tasks"} value={deskTasks.length} tone="gold" />
        <StatTile label="Done" value={tasks.filter((t) => t.status === "Done").length} tone="teal" />
        <StatTile label="Event packs" value={new Set(eventTasks.map((t) => t.eventPack?.id).filter(Boolean)).size} tone="blue" />
        <StatTile label="High priority" value={deskTasks.filter((t) => t.priority === "High").length} />
      </div>

      {isLoading ? (
        <p className="text-sm text-text-dim">Loading tasks…</p>
      ) : deskTasks.length === 0 ? (
        <p className="text-sm text-text-dim">
          {eventQueue ? "Confirm a booking to open its operational work queue." : "No open tasks."}
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([group, items]) => (
            <section key={group} className="panel overflow-hidden">
              <div className="border-b border-gold/15 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold/70">{eventQueue ? "Event pack" : "Area"}</p>
                <h3 className="font-display text-lg text-text">{group}</h3>
              </div>
              <div className="divide-y divide-gold/10">
                {items.map((task) => (
                  <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <div className="text-sm text-text">{task.title}</div>
                      <div className="text-xs text-text-dim">
                        {task.area} · {task.priority}
                        {task.eventPack && (
                          <>
                            {" · "}
                            <Link to={`/?view=events&event=${task.eventPack.id}`} className="text-gold hover:text-gold-soft">
                              {task.eventPack.title}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={task.status} />
                      {task.status !== "Done" && (
                        <Button
                          variant="secondary"
                          onClick={() => setStatus.mutate({ id: task.id, status: task.status === "Open" ? "In Progress" : "Done" })}
                        >
                          {task.status === "Open" ? "Start" : "Complete"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {!eventQueue && incidents.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 font-display text-lg text-text">Incidents</h3>
          <div className="space-y-2">
            {incidents.map((incident) => (
              <div key={incident.id} className="panel px-4 py-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={incident.severity} />
                  <StatusBadge status={incident.status} />
                </div>
                <div className="mt-1 text-sm text-text">{incident.title}</div>
                {incident.notes && <p className="text-xs text-text-dim">{incident.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
