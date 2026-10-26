import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";

export interface DashPrefs {
  email: boolean;
  desktop: boolean;
  sound: boolean;
  digest: boolean;
  compact: boolean;
}

export const DEFAULT_PREFS: DashPrefs = { email: true, desktop: true, sound: false, digest: true, compact: false };

const KEY = ["settings", "me"];

/** The signed-in user's saved preferences, with defaults while loading. */
export function useDashPrefs(): DashPrefs {
  const token = useAuthStore((s) => s.token);
  const { data } = useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get<DashPrefs>("/settings/me")).data,
    enabled: !!token,
    staleTime: 60_000,
  });
  return data ?? DEFAULT_PREFS;
}

export function useSaveDashPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: DashPrefs) => (await api.put<DashPrefs>("/settings/me", prefs)).data,
    onSuccess: (saved) => qc.setQueryData(KEY, saved),
  });
}
