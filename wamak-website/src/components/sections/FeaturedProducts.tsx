"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { Icon } from "@/components/ui/Icon";
import { categories } from "@/content/categories";
import { home } from "@/content/home";
import { featuredProducts } from "@/content/products";
import { cn } from "@/lib/cn";

/** Horizontal scroll-snap row with category chips. No autoplay. */
export function FeaturedProducts() {
  const f = home.featured;
  const chips = categories.filter((c) => featuredProducts.some((p) => p.category === c.slug));
  const [filter, setFilter] = useState<string | null>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const rowRef = useRef<HTMLUListElement>(null);
  const shown = filter ? featuredProducts.filter((p) => p.category === filter) : featuredProducts;

  const measure = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, filter]);

  const scrollBy = (dir: 1 | -1) => {
    const el = rowRef.current;
    if (!el) return;
    const card = el.querySelector("li");
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 300) + 24), behavior: "smooth" });
  };

  const chip =
    "inline-flex min-h-11 items-center rounded-full border px-4 text-small font-medium transition-colors duration-150";

  return (
    <section aria-labelledby="featured-title" className="bg-ivory-100 py-20 md:py-24">
      <div className="container-site">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="featured-title" className="text-h2">
              {f.title}
            </h2>
            <p className="mt-4 measure text-body-l text-ink-600">{f.intro}</p>
          </div>
          <div className="hidden gap-2 lg:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              disabled={edges.start}
              aria-label="Previous products"
              className="inline-grid size-12 place-items-center rounded-full border border-navy-900 text-navy-900 transition-colors hover:bg-navy-900 hover:text-ivory-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-navy-900"
            >
              <Icon name="arrowRight" className="rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              disabled={edges.end}
              aria-label="Next products"
              className="inline-grid size-12 place-items-center rounded-full border border-navy-900 text-navy-900 transition-colors hover:bg-navy-900 hover:text-ivory-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-navy-900"
            >
              <Icon name="arrowRight" />
            </button>
          </div>
        </div>

        <div role="group" aria-label="Filter featured products by category" className="-mx-4 mt-10 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
          {[{ slug: null as string | null, shortName: f.all }, ...chips].map((c) => {
            const active = filter === c.slug;
            return (
              <button
                key={c.slug ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setFilter(c.slug);
                  rowRef.current?.scrollTo({ left: 0 });
                }}
                className={cn(
                  chip,
                  "shrink-0",
                  active ? "border-navy-900 bg-navy-900 text-ivory-50" : "border-field bg-transparent text-navy-900 hover:border-navy-900",
                )}
              >
                {c.shortName}
              </button>
            );
          })}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {`Showing ${shown.length} ${shown.length === 1 ? "product" : "products"}${filter ? ` in ${chips.find((c) => c.slug === filter)?.name}` : ""}`}
      </p>
      <ul
        ref={rowRef}
        onScroll={measure}
        aria-label="Featured products"
        className="mt-8 flex snap-x snap-mandatory scroll-px-4 gap-6 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] md:scroll-px-8 md:px-8 xl:scroll-px-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))] xl:px-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))]"
      >
        {shown.map((p) => (
          <li key={p.slug} className="relative w-[78vw] max-w-[20rem] shrink-0 snap-start sm:w-[18rem]">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
