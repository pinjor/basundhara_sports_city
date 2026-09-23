import Image from "next/image";
import type { ReactNode } from "react";
import { getImage } from "@/content/images";
import { cn } from "@/lib/cn";
import { MaterialPlaceholder } from "./MaterialPlaceholder";

type Props = {
  id: string;
  className?: string;
  /** Override the manifest aspect (e.g. different crop on mobile via className). */
  aspect?: string;
  sizes?: string;
  priority?: boolean;
  caption?: ReactNode | false;
  captionPlacement?: "bottom-start" | "top-end";
};

/**
 * Renders an image slot from src/content/images.ts: the real photo when
 * status is "final", otherwise a labelled material placeholder.
 */
export function ManifestImage({ id, className, aspect, sizes = "100vw", priority, caption, captionPlacement }: Props) {
  const img = getImage(id);
  // "auto" lets the caller size the slot with classes (e.g. responsive ratios).
  const ratio = aspect === "auto" ? undefined : (aspect ?? img.aspect);

  if (img.status === "final" && img.src) {
    return (
      <div className={cn("relative overflow-hidden", className)} style={{ aspectRatio: ratio }}>
        <Image src={img.src} alt={img.alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }

  return (
    <MaterialPlaceholder
      variant={img.placeholder}
      seed={img.seed}
      alt={img.alt}
      aspect={ratio}
      caption={caption}
      captionPlacement={captionPlacement}
      className={className}
    />
  );
}
