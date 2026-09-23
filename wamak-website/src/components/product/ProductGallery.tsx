"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ManifestImage } from "@/components/brand/ManifestImage";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

type Props = { ids: string[]; name: string };

/**
 * Main image, thumbnails, and a keyboard-accessible lightbox (<dialog>):
 * arrow keys move between images, Esc closes and focus returns to the opener.
 */
export function ProductGallery({ ids, name }: Props) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  const go = useCallback((dir: 1 | -1) => setActive((i) => (i + dir + ids.length) % ids.length), [ids.length]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <div>
      <button
        ref={openerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full overflow-hidden rounded-card"
        aria-label={`Enlarge image ${active + 1} of ${ids.length}: ${name}`}
      >
        <ManifestImage key={ids[active]} id={ids[active]} aspect="1 / 1" priority={active === 0} />
        <span className="absolute end-3 top-3 inline-grid size-11 place-items-center rounded-full bg-ivory-50/90 text-navy-900 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Icon name="plus" size={20} />
        </span>
      </button>

      <ul className="mt-3 grid grid-cols-3 gap-3" aria-label="Product images">
        {ids.map((id, i) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-current={i === active}
              aria-label={`Show image ${i + 1} of ${ids.length}`}
              className={cn(
                "block w-full overflow-hidden rounded-control ring-offset-2 ring-offset-ivory-50 transition-shadow",
                i === active ? "ring-2 ring-navy-900" : "opacity-80 hover:opacity-100",
              )}
            >
              <ManifestImage id={id} aspect="1 / 1" caption={false} />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={`${name}: image ${active + 1} of ${ids.length}`}
        onClose={() => {
          setOpen(false);
          openerRef.current?.focus();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        className="m-auto max-h-[92dvh] w-[min(92vw,56rem)] bg-transparent p-0 backdrop:bg-navy-950/85"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-ivory-50">
            <p className="text-small tabular-nums" aria-live="polite">
              {active + 1} of {ids.length}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="inline-grid size-11 place-items-center rounded-full bg-ivory-50 text-navy-900"
              autoFocus
            >
              <Icon name="close" />
            </button>
          </div>
          <ManifestImage key={`lb-${ids[active]}`} id={ids[active]} aspect="1 / 1" className="mx-auto w-[min(100%,72dvh)] rounded-card" />
          <div className="flex justify-center gap-3">
            <button type="button" onClick={() => go(-1)} aria-label="Previous image" className="inline-grid size-12 place-items-center rounded-full bg-ivory-50 text-navy-900">
              <Icon name="arrowRight" className="rotate-180" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next image" className="inline-grid size-12 place-items-center rounded-full bg-ivory-50 text-navy-900">
              <Icon name="arrowRight" />
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
