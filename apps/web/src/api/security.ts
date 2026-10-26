import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface SecurityIncident {
  id: string;
  title: string;
  severity: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

const KEY = "security-incidents";

export function useSecurityIncidents(status?: string) {
  return useQuery({
    queryKey: [KEY, status],
    queryFn: async () => (await api.get<SecurityIncident[]>("/security/incidents", { params: { status } })).data,
  });
}

function useIncidentMutation<V>(run: (vars: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["dashboards"] });
      qc.invalidateQueries({ queryKey: ["ops-incidents"] });
    },
  });
}

export const useCreateIncident = () =>
  useIncidentMutation((input: { title: string; severity: string; notes?: string }) => api.post("/security/incidents", input));

export const useIncidentStatus = () =>
  useIncidentMutation(({ id, status }: { id: string; status: string }) => api.post(`/security/incidents/${id}/status`, { status }));
