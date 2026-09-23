import type { ReactNode } from "react";

/** Long-form text (legal pages, messages). Styles plain HTML children. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="measure text-body text-ink-900 [&_a]:font-medium [&_a]:text-leaf-700 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-h3 [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-[1.25rem] [&_h3]:font-semibold [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:mt-4 [&_ul]:list-disc [&_ul]:ps-6">
      {children}
    </div>
  );
}
