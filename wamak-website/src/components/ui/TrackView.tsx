"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/** Fires one analytics event when the page mounts. Renders nothing. */
export function TrackView({ event, params }: { event: AnalyticsEvent; params?: Record<string, string> }) {
  const key = JSON.stringify(params);
  useEffect(() => {
    track(event, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, key]);
  return null;
}
