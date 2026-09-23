"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/analytics";

/** mailto: link that records an email_click event. */
export function EmailLink({ email, location, className, children }: { email: string; location: string; className?: string; children?: ReactNode }) {
  return (
    <a href={`mailto:${email}`} className={className} onClick={() => track("email_click", { location })}>
      {children ?? email}
    </a>
  );
}
