"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ManifestImage } from "@/components/brand/ManifestImage";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getCategory } from "@/content/categories";
import { productHref } from "@/content/navigation";
import { rfq, useRfqList } from "@/lib/rfq-store";
import { ui, useUi } from "@/lib/ui-store";

/**
 * Slide-over RFQ list. Not a cart: no prices, no checkout. Buyers can add a
 * quantity or note per product, then send the whole list as one request.
 */
export function RfqDrawer() {
  const { drawerOpen } = useUi();
  const items = useRfqList();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (drawerOpen && !d.open) {
      d.showModal();
      document.documentElement.style.overflow = "hidden";
    }
    if (!drawerOpen && d.open) d.close();
    if (!drawerOpen) document.documentElement.style.overflow = "";
  }, [drawerOpen]);

  const count = items.length;

  return (
    <dialog
      ref={ref}
      aria-labelledby="rfq-drawer-title"
      onClose={ui.closeDrawer}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself) closes the drawer.
        if (e.target === e.currentTarget) ui.closeDrawer();
      }}
      className="fixed inset-y-0 end-0 start-auto m-0 h-dvh max-h-none w-full max-w-md bg-ivory-50 p-0 text-ink-900 backdrop:bg-navy-950/50 open:animate-[drawer-in_300ms_var(--ease-out-soft)]"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 id="rfq-drawer-title" className="text-h3">
            Your RFQ list{count > 0 && <span className="ms-2 text-ink-600 tabular-nums">({count})</span>}
          </h2>
          <button
            type="button"
            onClick={ui.closeDrawer}
            className="inline-grid size-11 place-items-center rounded-control text-navy-900 hover:bg-ivory-100"
            aria-label="Close RFQ list"
          >
            <Icon name="close" />
          </button>
        </div>

        {count === 0 ? (
          <div className="flex flex-1 flex-col items-start gap-4 px-6 py-10">
            <p className="text-body-l">Your RFQ list is empty.</p>
            <p className="text-ink-600">
              Add products while you browse, then request one quotation for all of them.
            </p>
            <Button href="/products" variant="secondary" onClick={ui.closeDrawer}>
              Browse products
            </Button>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
            {items.map((item) => {
              const category = getCategory(item.category);
              const noteId = `rfq-note-${item.category}-${item.slug}`;
              return (
                <li key={`${item.category}/${item.slug}`} className="flex gap-4 py-5">
                  <div className="w-16 shrink-0 overflow-hidden rounded-control">
                    <ManifestImage id={`product-${item.slug}`} caption={false} aspect="1 / 1" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={productHref(item.category, item.slug)}
                          onClick={ui.closeDrawer}
                          className="font-display leading-snug font-semibold text-navy-900 hover:underline hover:underline-offset-4"
                        >
                          {item.name}
                        </Link>
                        {category && <p className="text-small text-ink-600">{category.shortName}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => rfq.remove(item)}
                        className="-me-2 -mt-1 inline-flex min-h-11 shrink-0 items-center px-2 text-small font-medium text-ink-600 underline underline-offset-4 hover:text-danger"
                      >
                        Remove<span className="sr-only"> {item.name}</span>
                      </button>
                    </div>
                    <label htmlFor={noteId} className="text-small font-medium text-ink-900">
                      Quantity or notes <span className="font-normal text-ink-600">(optional)</span>
                    </label>
                    <input
                      id={noteId}
                      defaultValue={item.note}
                      onBlur={(e) => rfq.setNote(item, e.target.value)}
                      placeholder="e.g. 3,000 pcs, natural colour"
                      className="min-h-11 w-full rounded-control border border-field bg-white px-3 text-small hover:border-navy-900"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {count > 0 && (
          <div className="flex flex-col gap-3 border-t border-line bg-white px-6 py-5">
            <Button href="/request-quote" onClick={ui.closeDrawer} className="w-full">
              {`Request a quote for ${count} ${count === 1 ? "product" : "products"}`}
            </Button>
            <Button variant="secondary" onClick={ui.closeDrawer} className="w-full">
              Keep browsing
            </Button>
            <p className="text-small text-ink-600">No prices or payment here. We review your list and reply with a quotation.</p>
          </div>
        )}
      </div>
    </dialog>
  );
}
