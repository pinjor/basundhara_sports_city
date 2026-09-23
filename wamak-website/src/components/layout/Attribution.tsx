"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

export function Attribution() {
  const pathname = usePathname();
  useEffect(() => {
    captureAttribution(pathname, window.location.search);
  }, [pathname]);
  return null;
}
