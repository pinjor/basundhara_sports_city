"use client";

import { useSyncExternalStore } from "react";

/** Tiny global UI state: RFQ drawer visibility and the "added" toast. */
type State = { drawerOpen: boolean; toast: { id: number; message: string } | null };

let state: State = { drawerOpen: false, toast: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  emit();
};

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const ui = {
  openDrawer: () => set({ drawerOpen: true, toast: null }),
  closeDrawer: () => set({ drawerOpen: false }),
  toast(message: string) {
    clearTimeout(toastTimer);
    set({ toast: { id: Date.now(), message } });
    toastTimer = setTimeout(() => set({ toast: null }), 6000);
  },
  dismissToast: () => set({ toast: null }),
};

const SERVER: State = { drawerOpen: false, toast: null };

export function useUi() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => SERVER,
  );
}
