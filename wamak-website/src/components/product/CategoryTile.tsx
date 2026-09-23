import Link from "next/link";
import { ManifestImage } from "@/components/brand/ManifestImage";
import { Icon } from "@/components/ui/Icon";
import type { Category } from "@/content/categories";
import { categoryHref } from "@/content/navigation";
import { cn } from "@/lib/cn";

type Props = {
  category: Category;
  aspect: string;
  size?: "lg" | "md" | "sm";
  className?: string;
  /** Classes for the image frame, e.g. a shared desktop height for a row. */
  imageClassName?: string;
  /** Render as an image-left row on phones (for small tiles). */
  compactOnMobile?: boolean;
  headingLevel?: "h2" | "h3";
};

/** Whole tile is one link (stretched from the name) so it reads as a single target. */
export function CategoryTile({
  category: c,
  aspect,
  size = "md",
  className,
  imageClassName,
  compactOnMobile,
  headingLevel: H = "h3",
}: Props) {
  return (
    <article className={cn("group relative flex flex-col gap-4", compactOnMobile && "max-sm:flex-row max-sm:items-start", className)}>
      <div
        className={cn("overflow-hidden rounded-card", compactOnMobile && "max-sm:w-28 max-sm:shrink-0", imageClassName)}
        style={compactOnMobile ? ({ "--tile-aspect": aspect } as React.CSSProperties) : undefined}
      >
        <ManifestImage
          id={c.imageId}
          aspect={imageClassName || compactOnMobile ? "auto" : aspect}
          caption={false}
          className={cn(
            "transition-transform duration-500 ease-out-soft group-hover:scale-[1.02]",
            imageClassName && "size-full",
            compactOnMobile && "aspect-(--tile-aspect) max-sm:aspect-square",
          )}
        />
      </div>
      <div className={cn("flex flex-col gap-2 pe-4", compactOnMobile && "max-sm:pe-0")}>
        <H className={cn("font-semibold", size === "lg" ? "text-h3" : "text-[1.25rem] leading-tight tracking-[-0.015em]")}>
          <Link href={categoryHref(c.slug)} className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-leaf-700">
            {c.name}
          </Link>
        </H>
        <p className={cn("text-ink-600", size === "sm" ? "text-small" : "text-body")}>{c.summary}</p>
        {c.regulated && (
          <p className="flex items-start gap-2 text-small text-jute-700">
            <Icon name="info" size={18} className="mt-px shrink-0" />
            Seasonal, and subject to destination-country rules
          </p>
        )}
        <span aria-hidden="true" className="mt-1 inline-flex items-center gap-1 text-small font-semibold text-leaf-700 underline decoration-leaf-700/40 underline-offset-4 group-hover:decoration-leaf-700">
          View the range
        </span>
      </div>
    </article>
  );
}
