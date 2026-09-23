import Link from "next/link";
import { ManifestImage } from "@/components/brand/ManifestImage";
import { getCategory } from "@/content/categories";
import { productHref } from "@/content/navigation";
import type { Product } from "@/content/products";
import { cn } from "@/lib/cn";
import { AddToRfqButton } from "./AddToRfqButton";

type Props = { product: Product; className?: string; headingLevel?: "h2" | "h3" };

export function ProductCard({ product: p, className, headingLevel: H = "h3" }: Props) {
  const category = getCategory(p.category)!;
  const href = productHref(p.category, p.slug);
  return (
    <article className={cn("relative flex h-full flex-col rounded-card border border-line bg-white", className)}>
      <Link href={href} tabIndex={-1} aria-hidden="true" className="block overflow-hidden rounded-t-card">
        <ManifestImage id={`product-${p.slug}`} caption={false} />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-small text-jute-700">{category.shortName}</p>
        <H className="text-[1.1875rem] leading-snug font-semibold tracking-[-0.01em]">
          <Link href={href} className="hover:text-leaf-700 hover:underline hover:underline-offset-4">
            {p.name}
          </Link>
        </H>
        <p className="line-clamp-3 text-small text-ink-600">{p.summary}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
          <AddToRfqButton item={{ category: p.category, slug: p.slug, name: p.name }} />
          <Link
            href={href}
            className="inline-flex min-h-11 items-center text-small font-semibold text-leaf-700 underline decoration-leaf-700/40 underline-offset-4 hover:decoration-leaf-700"
          >
            View details<span className="sr-only">: {p.name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
