import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";

/**
 * WAMAK GROUP logo — used exactly as supplied (assets/wamak-logo.png).
 * Never redraw, trace, recolour or crop the lockup.
 *
 * The supplied PNG is 332×311 with an opaque near-white ground, so:
 *  - on light surfaces it renders with mix-blend-mode: multiply (file untouched);
 *  - on navy it sits on a white plate, as a label would.
 * When the vector master arrives, point LOGO.src at the SVG and remove the plate.
 */
export const LOGO = {
  src: "/brand/wamak-logo.png",
  width: 332,
  height: 311,
} as const;

type Props = {
  /** Rendered height in px. Keep ≤ 72 while only the PNG exists. */
  height?: number;
  surface?: "light" | "dark";
  href?: string | null;
  priority?: boolean;
  className?: string;
};

export function Logo({ height = 56, surface = "light", href = "/", priority, className }: Props) {
  const width = Math.round((LOGO.width / LOGO.height) * height);
  const img = (
    <Image
      src={LOGO.src}
      alt={`${site.name} — ${site.logoLockup.toLowerCase()}`}
      width={width}
      height={height}
      priority={priority}
      quality={90}
      sizes={`${width}px`}
      className={surface === "light" ? "logo-on-light" : undefined}
      style={{ height, width }}
    />
  );

  const framed =
    surface === "dark" ? (
      <span className="inline-flex rounded-card bg-white p-2">{img}</span>
    ) : (
      img
    );

  if (!href) return <span className={className}>{framed}</span>;
  return (
    <Link href={href} className={`inline-flex shrink-0 ${className ?? ""}`} aria-label={`${site.name} home`}>
      {framed}
    </Link>
  );
}
