import type { ReactNode } from "react";
import { BACKGROUND, type MaterialVariant } from "./placeholder-art";

export type { MaterialVariant } from "./placeholder-art";

/**
 * Stand-in for product photography until real WAMAK images are supplied.
 * Each variant is a quiet, material-true texture (woven jute, combed fibre,
 * plied sisal, loofah cells, pineapple skin, water, linen canvas) so layouts
 * can be judged at full fidelity without implying facilities, people or
 * customers. The texture is a cached static SVG (see placeholder-art.tsx);
 * swap for a real photo by changing the manifest entry's status.
 */

type Props = {
  variant: MaterialVariant;
  /** Accessible description of the intended photograph. */
  alt: string;
  /** CSS aspect-ratio, e.g. "4 / 5". Omit to fill the parent. */
  aspect?: string;
  /** Deterministic seed: the same seed always gives the same texture. */
  seed?: number;
  caption?: ReactNode | false;
  captionPlacement?: "bottom-start" | "top-end";
  /** Load eagerly (above the fold); otherwise lazy. */
  priority?: boolean;
  className?: string;
};

export const placeholderSrc = (variant: MaterialVariant, seed: number) => `/placeholders/${variant}-${seed}.svg`;

export function MaterialPlaceholder({
  variant,
  alt,
  aspect,
  seed = 7,
  caption,
  captionPlacement = "bottom-start",
  priority,
  className,
}: Props) {
  const onDark = variant === "tide";

  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative isolate overflow-hidden ${className ?? ""}`}
      style={{ aspectRatio: aspect, backgroundColor: BACKGROUND[variant] }}
      data-placeholder={variant}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG texture, nothing to optimise */}
      <img
        src={placeholderSrc(variant, seed)}
        alt=""
        aria-hidden="true"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className="absolute inset-0 size-full object-cover"
      />
      {caption !== false && (
        <span
          className={`absolute ${captionPlacement === "top-end" ? "top-3 end-3" : "bottom-3 start-3"} max-w-[calc(100%-1.5rem)] rounded-control px-2 py-1 text-[0.75rem] leading-tight font-medium ${
            onDark ? "bg-navy-950/80 text-ivory-50" : "bg-ivory-50/90 text-ink-900"
          }`}
        >
          {caption ?? "Product photography to be supplied"}
        </span>
      )}
    </div>
  );
}
