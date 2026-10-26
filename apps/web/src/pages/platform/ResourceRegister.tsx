import { useState, type FormEvent } from "react";
import { STATUS_ACTION, WORKFLOWS, nextStatuses, type EntityDef, type ResourceField } from "@bsc/shared";
import { useResourceList, useResourceLookup, useResourceTransition, useSaveResource, type ResourceRow } from "../../api/resources";
import { Button } from "../../components/ui/Button";
import { SelectInput } from "../../components/ui/Field";
import { ErrorState, LoadingSkeleton } from "../../components/ui/States";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { apiErrorMessage } from "../../lib/apiError";
import { useI18n } from "../../lib/i18n";
import { bodyFrom, cellText, editable, valuesFrom, type FormValues } from "./resourceFormat";

const PAGE = 25;
const FIELD = "min-h-11 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3 text-sm";
const INPUT = `${FIELD} mt-1 w-full`;
const DANGER = new Set(["CANCELLED", "REJECTED", "VOID", "REVERSED", "FAILED", "TERMINATED", "REVOKED", "EXITED", "EXPIRED"]);

const actionLabel = (status: string) => STATUS_ACTION[status] ?? status.replace(/_/g, " ").toLowerCase();
const stateLabel = (status: string) => status.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

function FieldInput({ field, value, onChange }: { field: ResourceField; value: string; onChange: (value: string) => void }) {
  const lookup = useResourceLookup(field.kind === "ref" ? field.ref : undefined);
  if (field.kind === "bool") {
    return (
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" className="h-5 w-5 accent-[var(--brand-gold)]" checked={value === "true"} onChange={(e) => onChange(e.target.checked ? "true" : "")} />
        {field.label}
      </label>
    );
  }
  const control = (() => {
    if (field.kind === "select" || field.kind === "ref") {
      const options = field.kind === "ref" ? (lookup.data ?? []) : (field.options ?? []).map((option) => ({ value: option, label: option }));
      return (
        <SelectInput required={field.required} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1">
          <option value="">{field.kind === "ref" && lookup.isLoading ? "Loading…" : "Select"}</option>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </SelectInput>
      );
    }
    if (field.kind === "textarea") return <textarea value={value} onChange={(e) => onChange(e.target.value)} className={`${INPUT} min-h-20 py-2`} />;
    const type = field.kind === "number" || field.kind === "money" ? "number" : field.kind === "date" ? "date" : field.kind === "time" ? "time" : "text";
    const step = field.kind === "money" ? "0.01" : field.kind === "number" && field.integer === false ? "any" : undefined;
    return <input required={field.required} type={type} step={step} min={type === "number" ? 0 : undefined} value={value} onChange={(e) => onChange(e.target.value)} className={INPUT} />;
  })();
  return (
    <label className={`text-sm ${field.kind === "textarea" ? "md:col-span-2" : ""}`}>
      {field.label}
      {field.required && <span className="text-gold"> *</span>}
      {control}
    </label>
  );
}

/** List, search, create, edit and move records of one registry endpoint. */
export function ResourceRegister({
  entity,
  path,
  fields,
  canWrite,
  canCreate = true,
  title,
}: {
  entity: EntityDef;
  path: string;
  fields: ResourceField[];
  canWrite: boolean;
  canCreate?: boolean;
  title?: string;
}) {
  const { lang } = useI18n();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [form, setForm] = useState<{ id?: string; values: FormValues } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const list = useResourceList(path, { search: search.trim() || undefined, status: status || undefined, take: PAGE, skip: page * PAGE });
  const save = useSaveResource(path);
  const move = useResourceTransition(path);

  const columns = fields.filter((field) => field.list !== false);
  const inputs = fields.filter(editable);
  const states = Object.keys((WORKFLOWS as Record<string, { transitions: Record<string, readonly string[]> }>)[entity.workflow]?.transitions ?? {});
  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setError(null);
    try {
      await save.mutateAsync({ id: form.id, body: bodyFrom(form.values, fields, !!form.id) });
      setForm(null);
    } catch (err) {
      setError(apiErrorMessage(err, `Could not save this ${entity.label.toLowerCase()}.`));
    }
  }

  async function transition(row: ResourceRow, to: string) {
    setError(null);
    try {
      await move.mutateAsync({ id: row.id, status: to });
    } catch (err) {
      setError(apiErrorMessage(err, `Could not update ${row.reference}.`));
    }
  }

  return (
    <section className="mb-6">
      <div className="flex flex-col gap-3">
        {title && <h3 className="text-lg font-semibold text-text">{title}</h3>}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            placeholder={`Search ${entity.label.toLowerCase()}s`}
            aria-label={`Search ${entity.label.toLowerCase()}s`}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className={`${FIELD} min-w-0 flex-1 basis-48 sm:max-w-xs`}
          />
          {states.length > 1 && (
            <SelectInput value={status} aria-label="Filter by status" onChange={(e) => { setStatus(e.target.value); setPage(0); }} className="min-w-0 flex-1 basis-40 sm:max-w-[14rem]">
              <option value="">All statuses</option>
              {states.map((s) => <option key={s} value={s}>{stateLabel(s)}</option>)}
            </SelectInput>
          )}
          {canWrite && canCreate && !form && <Button type="button" onClick={() => { setError(null); setForm({ values: {} }); }}>New {entity.label.toLowerCase()}</Button>}
        </div>
      </div>

      {form && (
        <form className="panel mt-3 grid gap-3 p-4 md:grid-cols-2" onSubmit={(event) => void submit(event)}>
          <p className="font-display text-lg text-text md:col-span-2">{form.id ? `Edit ${entity.label.toLowerCase()}` : `New ${entity.label.toLowerCase()}`}</p>
          {inputs.map((field) => (
            <FieldInput key={field.key} field={field} value={form.values[field.key] ?? ""} onChange={(value) => setForm((current) => current && { ...current, values: { ...current.values, [field.key]: value } })} />
          ))}
          {error && <p className="text-sm text-[var(--status-danger)] md:col-span-2" role="alert">{error}</p>}
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
            <Button type="button" variant="secondary" onClick={() => { setForm(null); setError(null); }}>Cancel</Button>
          </div>
        </form>
      )}
      {!form && error && <p className="mt-3 text-sm text-[var(--status-danger)]" role="alert">{error}</p>}

      <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--border-strong)]">
        {list.isLoading && <LoadingSkeleton />}
        {list.isError && <ErrorState message={apiErrorMessage(list.error, "Could not load records.")} onRetry={() => void list.refetch()} />}
        {list.data && (
          <table className="w-full min-w-[720px] border-collapse whitespace-nowrap text-sm">
            <thead>
              <tr className="border-b border-[var(--border-strong)] text-left text-xs uppercase tracking-[0.14em] text-text-dim">
                <th className="px-3 py-3 font-medium">Reference</th>
                {columns.map((field) => <th key={field.key} className="px-3 py-3 font-medium">{field.label}</th>)}
                <th className="px-3 py-3 font-medium">Status</th>
                {canWrite && <th className="px-3 py-3 font-medium">Action</th>}
              </tr>
            </thead>
            <tbody>
              {list.data.items.length === 0 ? (
                <tr><td colSpan={columns.length + (canWrite ? 3 : 2)} className="px-3 py-8 text-center text-text-dim">{search || status ? "No records match." : "No records yet."}</td></tr>
              ) : list.data.items.map((row) => (
                <tr key={row.id} className="border-b border-[var(--border-strong)] last:border-0">
                  <td className="px-3 py-3 font-medium">{row.reference}</td>
                  {columns.map((field) => <td key={field.key} className="min-w-[8rem] max-w-[18rem] break-words px-3 py-3">{cellText(row, field, lang)}</td>)}
                  <td className="px-3 py-3"><StatusBadge status={stateLabel(row.status)} /></td>
                  {canWrite && (
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        {inputs.length > 0 && nextStatuses(entity.workflow, row.status).length > 0 && (
                          <Button type="button" variant="secondary" onClick={() => { setError(null); setForm({ id: row.id, values: valuesFrom(row, fields) }); }}>Edit</Button>
                        )}
                        {nextStatuses(entity.workflow, row.status).map((to) => (
                          <Button key={to} type="button" variant={DANGER.has(to) ? "danger" : "secondary"} disabled={move.isPending} onClick={() => void transition(row, to)}>
                            {actionLabel(to)}
                          </Button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {total > PAGE && (
        <div className="mt-2 flex items-center justify-end gap-2 text-sm text-text-dim">
          <span>Page {page + 1} of {pages} · {total} records</span>
          <Button type="button" variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button type="button" variant="secondary" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </section>
  );
}
