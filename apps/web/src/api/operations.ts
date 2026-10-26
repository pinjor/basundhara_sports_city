import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface OpsTask {
  id: string;
  title: string;
  area: string;
  status: string;
  priority: string;
  dueAt: string | null;
  eventPack?: { id: string; title: string; status: string } | null;
}

export interface OpsIncident {
  id: string;
  title: string;
  severity: string;
  status: string;
  notes: string | null;
  eventPack?: { id: string; title: string } | null;
}

export interface SearchResults {
  facilities: { id: string; name: string; type: string; status: string }[];
  bookings: { id: string; customerName: string; status: string; eventPack?: { id: string; title: string } | null; facility?: { name: string } }[];
  members: { id: string; name: string; status: string; tier: string }[];
  visitors: { id: string; name: string; status: string; eventPackId: string | null }[];
  vips: { id: string; name: string; status: string; classification: string }[];
  equipment: { id: string; name: string; status: string }[];
  vehicles: { id: string; type: string; driverName: string | null; status: string }[];
}

export function useOpsTasks(status?: string) {
  return useQuery({
    queryKey: ["ops-tasks", status],
    queryFn: async () => (await api.get<OpsTask[]>("/operations/tasks", { params: { status } })).data,
  });
}

export function useSetTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await api.post<OpsTask>(`/operations/tasks/${id}/status`, { status })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops-tasks"] });
      qc.invalidateQueries({ queryKey: ["event-board"] });
    },
  });
}

export function useOpsIncidents() {
  return useQuery({
    queryKey: ["ops-incidents"],
    queryFn: async () => (await api.get<OpsIncident[]>("/operations/incidents")).data,
  });
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: async () => (await api.get<SearchResults>("/operations/search", { params: { q } })).data,
    enabled: q.trim().length >= 2,
  });
}
