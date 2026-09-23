import type { CSSProperties } from "react";

/**
 * The fibre thread — WAMAK's single brand device.
 * One fine, continuous jute thread drawn in SVG. It is used for:
 *  - the hero (draws itself once on load — the only orchestrated moment),
 *  - the "How we work" process line (scroll-linked, see ProcessThread),
 *  - route lines on the Global Markets map,
 *  - a thin divider under category heroes.
 *
 * Paths are hand-tuned so the line wanders like a real fibre and makes one
 * small loop — the "knot" — rather than a mechanical sine wave.
 * Do not add other decorative devices alongside it.
 */

export type ThreadVariant = "hero" | "divider" | "vertical" | "short";
export type ThreadTone = "leaf" | "jute" | "navy" | "ivory";

type Fit = "meet" | "slice" | "none";

const PATHS: Record<ThreadVariant, { viewBox: string; d: string; fit: Fit }> = {
  // Hero: laid over the image mosaic (with overhang), never over the text
  // column. Enters low-left, crosses the large image, loops in the gutter
  // between the two small images and leaves off the right edge.
  // The box is the mosaic extended 15% left, 25% right, 8% up, 12% down.
  hero: {
    viewBox: "0 0 800 640",
    fit: "none",
    d: "M-10 612 C 90 608 170 582 230 532 C 300 472 360 420 430 372 C 482 336 530 302 578 300 C 618 298 632 332 606 344 C 580 356 556 334 572 312 C 590 290 640 286 700 280 C 740 276 772 262 812 240",
  },
  // Section divider. Wider than any container and cropped at the edges
  // (slice), so the loop is never distorted.
  divider: {
    viewBox: "0 0 1600 48",
    fit: "slice",
    d: "M-10 30 C 160 30 260 18 400 20 C 540 22 620 36 720 32 C 760 30 784 12 806 12 C 830 12 834 36 814 38 C 794 40 786 22 804 16 C 860 0 960 26 1100 26 C 1260 26 1420 18 1610 22",
  },
  // Vertical process line (desktop "How we work"). Stretches vertically.
  vertical: {
    viewBox: "0 0 48 1000",
    fit: "none",
    d: "M24 0 C 24 80 32 140 28 220 C 24 300 14 360 18 440 C 22 520 34 580 30 660 C 26 740 16 800 20 880 C 22 930 24 970 24 1000",
  },
  // Short flourish for small spaces (cards, captions).
  short: {
    viewBox: "0 0 240 32",
    fit: "meet",
    d: "M2 20 C 40 20 62 10 96 12 C 126 14 134 26 124 28 C 112 30 108 16 126 12 C 160 4 196 20 238 16",
  },
};

const TONES: Record<ThreadTone, string> = {
  leaf: "var(--color-leaf-500)",
  jute: "var(--color-jute-300)",
  navy: "var(--color-navy-900)",
  ivory: "var(--color-ivory-50)",
};

type Props = {
  variant?: ThreadVariant;
  tone?: ThreadTone;
  /** Draw the line in once on mount. Reduced-motion users see it fully drawn. */
  draw?: boolean;
  /** Seconds. Hero total must stay ≤ 1.2s including delay. */
  duration?: number;
  delay?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
};

export function FibreThread({
  variant = "divider",
  tone = "jute",
  draw = false,
  duration = 1,
  delay = 0,
  strokeWidth = 1.5,
  className,
  style,
}: Props) {
  const { viewBox, d, fit } = PATHS[variant];

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio={fit === "none" ? "none" : `xMidYMid ${fit}`}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    >
      <path
        d={d}
        pathLength={1}
        stroke={TONES[tone]}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className={draw ? "fibre-draw" : undefined}
        style={
          draw
            ? ({
                "--fibre-duration": `${duration}s`,
                "--fibre-delay": `${delay}s`,
              } as CSSProperties)
            : undefined
        }
      />
    </svg>
  );
}

/** Exposed so the scroll-linked ProcessThread and map routes reuse the same geometry. */
export const threadPaths = PATHS;
