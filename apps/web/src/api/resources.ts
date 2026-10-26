import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { entityDef, type Paginated, type ReportResult } from "@bsc/shared";
import { api } from "../lib/api";

export type ResourceRow = Record<string, unknown> & { id: string; reference: string; status: string; createdAt: string };
export type ResourceQuery = Record<string, string | number | undefined>;

const KEY = "resource";
const LOOKUP_SIZE = 200;

export function useResourceList(path: string, params: ResourceQuery) {
  return useQuery({
    queryKey: [KEY, path, params],
    queryFn: async () => (await api.get<Paginated<ResourceRow>>(`/${path}`, { params })).data,
    placeholderData: keepPreviousData,
  });
}

/** Record counts for several endpoints, for hub cards. */
export function useResourceTotals(paths: string[]) {
  return useQueries({
    queries: paths.map((path) => ({
      queryKey: [KEY, path, { take: 1 }],
      queryFn: async () => (await api.get<Paginated<ResourceRow>>(`/${path}`, { params: { take: 1 } })).data,
      staleTime: 30_000,
    })),
  });
}

export interface LookupOption {
  value: string;
  label: string;
}

/** Options for a reference field: registry records by title, or a core model (facility, event…) via `/lookups`. */
export function useResourceLookup(entityKey: string | undefined) {
  const entity = entityKey ? entityDef(entityKey) : undefined;
  return useQuery({
    queryKey: [KEY, entity?.path ?? `lookups/${entityKey}`, { take: LOOKUP_SIZE }],
    enabled: !!entityKey,
    staleTime: 60_000,
    queryFn: async (): Promise<LookupOption[]> => {
      if (!entity) return (await api.get<LookupOption[]>(`/lookups/${entityKey}`)).data;
      const page = (await api.get<Paginated<ResourceRow>>(`/${entity.path}`, { params: { take: LOOKUP_SIZE } })).data;
      return page.items.map((row) => ({ value: row.id, label: `${String(row[entity.titleKey] ?? row.reference)} · ${row.reference}` }));
    },
  });
}

/** Writes can ripple into other registers (a cleared payment settles its invoice), so every register refreshes. */
function useResourceMutation<V>(run: (vars: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["report"] });
      qc.invalidateQueries({ queryKey: ["dashboards"] });
    },
  });
}

export function useSaveResource(path: string) {
  return useResourceMutation(({ id, body }: { id?: string; body: Record<string, unknown> }) =>
    id ? api.patch(`/${path}/${id}`, body) : api.post(`/${path}`, body),
  );
}

export function useResourceTransition(path: string) {
  return useResourceMutation(({ id, status }: { id: string; status: string }) => api.post(`/${path}/${id}/status`, { status }));
}

export function useReport(path: string | undefined, params: Record<string, string>) {
  return useQuery({
    queryKey: ["report", path, params],
    enabled: !!path,
    placeholderData: keepPreviousData,
    queryFn: async () => (await api.get<ReportResult>(`/${path}`, { params })).data,
  });
}
