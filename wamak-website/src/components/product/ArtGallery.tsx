"use client";

import Link from "next/link";
import { useState } from "react";
import { ManifestImage } from "@/components/brand/ManifestImage";
import { productHref } from "@/content/navigation";
import type { Product } from "@/content/products";
import { cn } from "@/lib/cn";
import { AddToRfqButton } from "./AddToRfqButton";

/** Gallery-style art range with style/medium filters drawn from real tags only. */
export function ArtGallery({ products }: { products: Product[] }) {
  const tags = [...new Set(products.flatMap((p) => p.tags ?? []))];
  const [tag, setTag] = useState<string | null>(null);
  const shown = tag ? products.filter((p) => p.tags?.includes(tag)) : products;

  return (
    <div>
      <div role="group" aria-label="Filter by style or medium" className="flex flex-wrap gap-2">
        {[null, ...tags].map((t) => (
          <button
            key={t ?? "all"}
            type="button"
            aria-pressed={tag === t}
            onClick={() => setTag(t)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-4 text-small font-medium transition-colors",
              tag === t ? "border-navy-900 bg-navy-900 text-ivory-50" : "border-field text-navy-900 hover:border-navy-900",
            )}
          >
            {t ?? "All works"}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{`Showing ${shown.length} ${shown.length === 1 ? "work" : "works"}`}</p>
      <ul className="mt-10 columns-1 gap-8 sm:columns-2 lg:columns-3">
        {shown.map((p, i) => (
          <li key={p.slug} className="mb-10 break-inside-avoid">
            {/* Varying ratios give a hung-wall rhythm rather than a product grid. */}
            <div className="bg-white p-3 shadow-[0_1px_0_var(--color-line)] ring-1 ring-line">
              <ManifestImage id={`product-${p.slug}`} aspect={["4 / 5", "5 / 4", "3 / 4", "1 / 1", "4 / 3"][i % 5]} caption={false} />
            </div>
            <h3 className="mt-4 text-[1.1875rem] leading-snug font-semibold">
              <Link href={productHref(p.category, p.slug)} className="hover:text-leaf-700 hover:underline hover:underline-offset-4">
                {p.name}
              </Link>
            </h3>
            <p className="mt-1 text-small text-ink-600">{p.summary}</p>
            {p.tags && <p className="mt-2 text-small text-jute-700">{p.tags.join(", ")}</p>}
            <div className="mt-4">
              <AddToRfqButton item={{ category: p.category, slug: p.slug, name: p.name }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
