import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
}

const KEY = ["notifications"];

export function useNotifications() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get<AppNotification[]>("/notifications")).data,
    refetchInterval: 20000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/notifications/${id}/read`)).data,
    onMutate: (id) => qc.setQueryData<AppNotification[]>(KEY, (list) => list?.map((note) => (note.id === id ? { ...note, read: true } : note))),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post("/notifications/read-all")).data,
    onMutate: () => qc.setQueryData<AppNotification[]>(KEY, (list) => list?.map((note) => ({ ...note, read: true }))),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
