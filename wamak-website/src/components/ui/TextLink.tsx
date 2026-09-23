import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Props = ComponentProps<typeof Link> & {
  /** "inverse" for navy surfaces. */
  tone?: "default" | "inverse";
};

/**
 * Inline and standalone text links. Underlined at rest (never colour-only),
 * thicker underline on hover. External links open in the same tab unless
 * target is set explicitly.
 */
export function TextLink({ tone = "default", className, ...props }: Props) {
  return (
    <Link
      className={cn(
        "font-medium underline decoration-1 underline-offset-[0.28em] transition-[text-decoration-color,text-decoration-thickness] duration-150 hover:decoration-2",
        tone === "default"
          ? "text-leaf-700 decoration-leaf-700/50 hover:decoration-leaf-700"
          : "text-ivory-50 decoration-jute-300 hover:decoration-jute-300",
        className,
      )}
      {...props}
    />
  );
}
