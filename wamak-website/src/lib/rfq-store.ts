"use client";

import { useSyncExternalStore } from "react";

/**
 * RFQ list: products a buyer wants quoted together. Not a cart — no prices,
 * no checkout. Stored in sessionStorage so it survives navigation but not a
 * closed tab. All access is wrapped: private windows may block storage.
 */

export type RfqItem = {
  category: string;
  slug: string;
  name: string;
  /** Free-text quantity / notes captured in the drawer. */
  note?: string;
};

/** Values started from the homepage quick inquiry, prefilled into the wizard. */
export type RfqDraft = {
  product?: string;
  quantity?: string;
  country?: string;
  email?: string;
  category?: string;
};

const LIST_KEY = "wamak:rfq-list";
const DRAFT_KEY = "wamak:rfq-draft";
const EVENT = "wamak:rfq-change";
const EMPTY: RfqItem[] = [];

let cache: RfqItem[] | null = null;

function read(): RfqItem[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const raw = window.sessionStorage.getItem(LIST_KEY);
    cache = raw ? (JSON.parse(raw) as RfqItem[]) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(items: RfqItem[]) {
  cache = items;
  try {
    window.sessionStorage.setItem(LIST_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable: keep the in-memory list for this page view */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === LIST_KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useRfqList() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

const key = (i: Pick<RfqItem, "category" | "slug">) => `${i.category}/${i.slug}`;

export const rfq = {
  add(item: RfqItem) {
    const items = read();
    if (items.some((i) => key(i) === key(item))) return;
    write([...items, item]);
  },
  remove(item: Pick<RfqItem, "category" | "slug">) {
    write(read().filter((i) => key(i) !== key(item)));
  },
  setNote(item: Pick<RfqItem, "category" | "slug">, note: string) {
    write(read().map((i) => (key(i) === key(item) ? { ...i, note } : i)));
  },
  clear() {
    write(EMPTY);
  },
  has(items: RfqItem[], item: Pick<RfqItem, "category" | "slug">) {
    return items.some((i) => key(i) === key(item));
  },
  saveDraft(draft: RfqDraft) {
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  },
  readDraft(): RfqDraft | null {
    try {
      const raw = window.sessionStorage.getItem(DRAFT_KEY);
      return raw ? (JSON.parse(raw) as RfqDraft) : null;
    } catch {
      return null;
    }
  },
};
