import { useState, type FormEvent } from "react";
import { SEVERITIES, nextStatuses } from "@bsc/shared";
import { useCreateIncident, useIncidentStatus, useSecurityIncidents } from "../../api/security";
import { Button } from "../../components/ui/Button";
import { SelectInput, TextInput } from "../../components/ui/Field";
import { StatusBadge, statusLabel } from "../../components/ui/StatusBadge";
import { apiErrorMessage } from "../../lib/apiError";
import { timeAgo } from "../../lib/audit";

const FILTERS = ["Open", "Investigating", "Resolved", ""];

/** Log security incidents and move them Open → Investigating → Resolved. */
export function IncidentsPanel({ readOnly = false }: { readOnly?: boolean }) {
  const [filter, setFilter] = useState("Open");
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<string>("Medium");
  const [notes, setNotes] = useState("");
  const list = useSecurityIncidents(filter || undefined);
  const create = useCreateIncident();
  const move = useIncidentStatus();
  const error = create.error ?? move.error;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    create.mutate({ title: title.trim(), severity, notes: notes.trim() || undefined }, { onSuccess: () => { setTitle(""); setNotes(""); } });
  };

  return (
    <section className="panel p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-text">Incidents</h3>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Incident status">
          {FILTERS.map((f) => (
            <button
              key={f || "all"}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`min-h-9 rounded-full border px-3 text-sm ${filter === f ? "border-gold bg-gold/10 text-gold" : "border-[var(--border-strong)] text-text-dim hover:text-text"}`}
            >
              {f || "All"}
            </button>
          ))}
        </div>
      </div>

      {!readOnly && (
        <form onSubmit={submit} className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)_auto]">
          <TextInput required maxLength={200} placeholder="What happened?" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Incident title" />
          <SelectInput value={severity} onChange={(e) => setSeverity(e.target.value)} aria-label="Severity">
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </SelectInput>
          <TextInput maxLength={4000} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} aria-label="Incident notes" />
          <Button type="submit" disabled={create.isPending || !title.trim()}>{create.isPending ? "Logging…" : "Log incident"}</Button>
        </form>
      )}
      {error && <p className="mb-3 text-sm text-red" role="alert">{apiErrorMessage(error, "Could not save the incident.")}</p>}

      <ul className="divide-y divide-[var(--border-subtle)]">
        {list.isLoading && <li className="py-3 text-sm text-text-dim">Loading incidents…</li>}
        {list.data?.length === 0 && <li className="py-3 text-sm text-text-dim">No {filter ? filter.toLowerCase() : ""} incidents.</li>}
        {list.data?.map((incident) => (
          <li key={incident.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1 basis-56">
              <p className="font-medium text-text">{incident.title}</p>
              <p className="text-xs text-text-dim">{incident.severity} · logged {timeAgo(incident.createdAt)}{incident.notes ? ` · ${incident.notes}` : ""}</p>
            </div>
            <StatusBadge status={incident.status} />
            {!readOnly &&
              nextStatuses("incident", incident.status).map((next) => (
                <Button key={next} variant="secondary" className="min-h-9 px-3 py-1.5 text-xs" disabled={move.isPending} onClick={() => move.mutate({ id: incident.id, status: next })}>
                  {next === "Resolved" ? "Resolve" : `Mark ${statusLabel(next).toLowerCase()}`}
                </Button>
              ))}
          </li>
        ))}
      </ul>
    </section>
  );
}
