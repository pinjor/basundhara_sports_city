"use client";

/** First-touch UTM parameters and the last product/category page, for the internal RFQ email. */
const UTM_KEY = "wamak:utm";
const PAGE_KEY = "wamak:source-page";

export function captureAttribution(pathname: string, search: string) {
  try {
    const params = new URLSearchParams(search);
    const utm: Record<string, string> = {};
    for (const [k, v] of params) if (k.startsWith("utm_")) utm[k] = v.slice(0, 200);
    if (Object.keys(utm).length && !sessionStorage.getItem(UTM_KEY)) sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    if (pathname.startsWith("/products")) sessionStorage.setItem(PAGE_KEY, pathname);
  } catch {
    /* storage unavailable */
  }
}

export function readAttribution(): { utm?: Record<string, string>; sourcePage?: string } {
  try {
    const utm = sessionStorage.getItem(UTM_KEY);
    return { utm: utm ? JSON.parse(utm) : undefined, sourcePage: sessionStorage.getItem(PAGE_KEY) ?? undefined };
  } catch {
    return {};
  }
}
