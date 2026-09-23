"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { categories } from "@/content/categories";
import { categoryHref, primaryNav } from "@/content/navigation";
import { site } from "@/content/site";

type Props = { open: boolean; onClose: () => void };

const bigLink = "flex min-h-14 items-center font-display text-h3 font-semibold text-ivory-50";
const subLink = "flex min-h-11 items-center text-body-l text-navy-200 hover:text-ivory-50";

function Accordion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-line-navy">
      <summary className={`${bigLink} cursor-pointer list-none justify-between [&::-webkit-details-marker]:hidden`}>
        {label}
        <Icon name="plus" className="text-jute-300 transition-transform duration-200 group-open:rotate-45" />
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}

/**
 * Full-screen navy menu. A modal <dialog> gives us Esc-to-close, an inert
 * page behind it and a contained tab order without extra code.
 */
export function MobileNav({ open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    if (!open) document.documentElement.style.overflow = "";
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label="Menu"
      onClose={onClose}
      className="surface-navy fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto p-0 backdrop:bg-navy-950/60 open:animate-[menu-in_250ms_var(--ease-out-soft)]"
    >
      <div className="container-site flex min-h-full flex-col pb-10">
        <div className="flex h-16 items-center justify-between">
          <Logo height={44} surface="dark" />
          <button
            type="button"
            onClick={onClose}
            className="inline-grid size-11 place-items-center rounded-control text-ivory-50 hover:bg-navy-800"
            aria-label="Close menu"
          >
            <Icon name="close" />
          </button>
        </div>

        <nav aria-label="Main" className="mt-6">
          <Accordion label={primaryNav.products.label}>
            <ul>
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={categoryHref(c.slug)} className={subLink} onClick={onClose}>
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={primaryNav.products.href} className={`${subLink} font-semibold text-ivory-50 underline decoration-jute-300 underline-offset-4`} onClick={onClose}>
                  View all products
                </Link>
              </li>
            </ul>
          </Accordion>
          <ul>
            {primaryNav.links.map((l) => (
              <li key={l.href} className="border-b border-line-navy">
                <Link href={l.href} className={bigLink} onClick={onClose}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Accordion label={primaryNav.resources.label}>
            <ul>
              {primaryNav.resources.items.map((i) => (
                <li key={i.href}>
                  <Link href={i.href} className={subLink} onClick={onClose}>
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Accordion>
          <Link href={primaryNav.contact.href} className={`${bigLink} border-b border-line-navy`} onClick={onClose}>
            {primaryNav.contact.label}
          </Link>
        </nav>

        <div className="mt-auto flex flex-col gap-5 pt-10">
          <Button href={primaryNav.cta.href} variant="inverse" className="w-full" onClick={onClose}>
            {primaryNav.cta.label}
          </Button>
          <a href={`mailto:${site.email}`} className="inline-flex min-h-11 items-center gap-2 text-navy-200 hover:text-ivory-50">
            <Icon name="mail" size={20} className="text-jute-300" />
            {site.email}
          </a>
        </div>
      </div>
    </dialog>
  );
}
