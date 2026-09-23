"use client";

import Link from "next/link";
import { forwardRef, useState } from "react";
import { ManifestImage } from "@/components/brand/ManifestImage";
import { Icon } from "@/components/ui/Icon";
import { categories } from "@/content/categories";
import { categoryHref, primaryNav } from "@/content/navigation";
import { handleMenuArrows } from "./useDismiss";

type Props = { id: string; onNavigate: () => void };

/** Editorial products menu: 7 ranges in two columns, a live preview, and the sourcing desk. */
export const MegaMenu = forwardRef<HTMLDivElement, Props>(function MegaMenu({ id, onNavigate }, ref) {
  const ranges = categories.filter((c) => c.kind === "range");
  const sourcing = categories.find((c) => c.kind === "sourcing")!;
  const [active, setActive] = useState(ranges[0]);

  return (
    <div
      id={id}
      ref={ref}
      onKeyDown={(e) => handleMenuArrows(e, e.currentTarget)}
      className="absolute inset-x-0 top-full border-y border-line bg-ivory-50 shadow-[0_24px_48px_-32px_rgb(3_23_56/0.35)]"
    >
      <div className="container-site grid-site gap-y-8 py-10">
        <nav aria-label="Product families" className="col-span-6">
          <ul className="grid grid-cols-2 gap-x-8 gap-y-1">
            {ranges.map((c) => (
              <li key={c.slug}>
                <Link
                  href={categoryHref(c.slug)}
                  data-menu-item
                  onClick={onNavigate}
                  onMouseEnter={() => setActive(c)}
                  onFocus={() => setActive(c)}
                  className="group block rounded-control px-3 py-3 transition-colors hover:bg-ivory-100 focus-visible:bg-ivory-100"
                >
                  <span className="block font-display text-[1.0625rem] font-semibold text-navy-900">{c.name}</span>
                  <span className="mt-0.5 line-clamp-2 block text-small text-ink-600">{c.summary}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={primaryNav.products.href}
                data-menu-item
                onClick={onNavigate}
                className="inline-flex min-h-11 items-center gap-2 px-3 py-3 font-semibold text-leaf-700 underline decoration-leaf-700/50 underline-offset-4 hover:decoration-leaf-700"
              >
                View all products
              </Link>
            </li>
          </ul>
        </nav>

        <div className="col-span-3" aria-hidden="true">
          <ManifestImage key={active.slug} id={active.imageId} aspect="4 / 5" className="rounded-card" caption={active.shortName} />
        </div>

        <div className="surface-navy col-span-3 flex flex-col justify-between gap-6 rounded-card p-6">
          <div>
            <Icon name="customize" className="text-jute-300" />
            <p className="mt-4 font-display text-h3 font-semibold text-ivory-50">{sourcing.shortName}</p>
            <p className="mt-2 text-small text-navy-200">{sourcing.summary}</p>
          </div>
          <Link
            href={categoryHref(sourcing.slug)}
            data-menu-item
            onClick={onNavigate}
            className="inline-flex min-h-11 items-center font-semibold text-ivory-50 underline decoration-jute-300 underline-offset-4"
          >
            How customized sourcing works
          </Link>
        </div>
      </div>
    </div>
  );
});
