"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

/** Styleguide-only helper: remounts its children to replay the load animation. */
export function ReplayThread({ children }: { children: ReactNode }) {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col gap-4">
      <div key={run}>{children}</div>
      <div>
        <Button variant="secondary" size="sm" onClick={() => setRun((n) => n + 1)}>
          Replay the draw
        </Button>
      </div>
    </div>
  );
}
