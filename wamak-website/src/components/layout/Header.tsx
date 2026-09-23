"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { primaryNav } from "@/content/navigation";
import { cn } from "@/lib/cn";
import { useRfqList } from "@/lib/rfq-store";
import { ui } from "@/lib/ui-store";
import { MegaMenu } from "./MegaMenu";
import { MobileNav } from "./MobileNav";
import { handleMenuArrows, useDismiss } from "./useDismiss";

type Open = null | "products" | "resources";

const navLink =
  "relative inline-flex min-h-11 items-center px-3 text-[0.9375rem] font-medium text-navy-900 transition-colors hover:text-leaf-700 " +
  "after:absolute after:inset-x-3 after:bottom-2 after:h-px after:origin-left after:scale-x-0 after:bg-jute-300 after:transition-transform after:duration-200 " +
  "hover:after:scale-x-100 aria-[current=page]:after:scale-x-100 aria-expanded:after:scale-x-100";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<Open>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const productsBtn = useRef<HTMLButtonElement>(null);
  const resourcesBtn = useRef<HTMLButtonElement>(null);
  const megaRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLUListElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const megaId = useId();
  const resourcesId = useId();
  const rfqCount = useRfqList().length;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation. Adjusting state during render avoids a flash of the old menu.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(null);
    setMobileOpen(false);
  }

  const close = useCallback(
    (reason: "escape" | "outside") => {
      if (reason === "escape") {
        const trigger = open === "products" ? productsBtn.current : resourcesBtn.current;
        trigger?.focus({ preventScroll: true });
      }
      setOpen(null);
    },
    [open],
  );
  useDismiss(headerRef, open !== null, close);

  const hoverOpen = (menu: Open) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) setOpen(menu);
  };
  const hoverClose = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(null), 180);
  };

  const onTriggerKey = (e: React.KeyboardEvent, menu: Open) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(menu);
      requestAnimationFrame(() => {
        const root = menu === "products" ? megaRef.current : resourcesRef.current;
        root?.querySelector<HTMLElement>("[data-menu-item]")?.focus();
      });
    }
  };

  const isCurrent = (href: string) => (pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined);
  const solid = scrolled || open !== null;

  return (
    <>
      <header
        ref={headerRef}
        onMouseLeave={hoverClose}
        onMouseEnter={() => hoverTimer.current && clearTimeout(hoverTimer.current)}
        className={cn(
          // Always opaque: the logo's multiply blend needs an ivory backdrop inside this stacking context.
          "sticky top-0 z-40 border-b bg-ivory-50 transition-[border-color] duration-200",
          solid ? "border-line" : "border-transparent",
        )}
      >
        <div className="container-site flex h-16 items-center justify-between gap-6 xl:h-[76px]">
          <Logo height={52} priority className="-my-1" />

          {/* Desktop navigation */}
          <nav aria-label="Main" className="hidden xl:block">
            <ul className="flex items-center">
              <li onMouseEnter={() => hoverOpen("products")}>
                <button
                  ref={productsBtn}
                  type="button"
                  className={cn(navLink, "gap-1")}
                  aria-expanded={open === "products"}
                  aria-controls={megaId}
                  aria-current={isCurrent(primaryNav.products.href)}
                  onClick={() => setOpen(open === "products" ? null : "products")}
                  onKeyDown={(e) => onTriggerKey(e, "products")}
                >
                  {primaryNav.products.label}
                  <Icon name="chevronDown" size={16} className={cn("transition-transform duration-200", open === "products" && "rotate-180")} />
                </button>
              </li>
              {primaryNav.links.map((l) => (
                <li key={l.href} onMouseEnter={() => hoverOpen(null)}>
                  <Link href={l.href} className={navLink} aria-current={isCurrent(l.href)}>
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="relative" onMouseEnter={() => hoverOpen("resources")}>
                <button
                  ref={resourcesBtn}
                  type="button"
                  className={cn(navLink, "gap-1")}
                  aria-expanded={open === "resources"}
                  aria-controls={resourcesId}
                  onClick={() => setOpen(open === "resources" ? null : "resources")}
                  onKeyDown={(e) => onTriggerKey(e, "resources")}
                >
                  {primaryNav.resources.label}
                  <Icon name="chevronDown" size={16} className={cn("transition-transform duration-200", open === "resources" && "rotate-180")} />
                </button>
                {open === "resources" && (
                  <ul
                    id={resourcesId}
                    ref={resourcesRef}
                    onKeyDown={(e) => handleMenuArrows(e, e.currentTarget)}
                    className="absolute start-0 top-full mt-2 w-72 rounded-card border border-line bg-white p-2 shadow-[0_24px_48px_-32px_rgb(3_23_56/0.35)]"
                  >
                    {primaryNav.resources.items.map((i) => (
                      <li key={i.href}>
                        <Link
                          href={i.href}
                          data-menu-item
                          onClick={() => setOpen(null)}
                          className="flex min-h-11 items-center rounded-control px-3 text-navy-900 hover:bg-ivory-100 focus-visible:bg-ivory-100"
                        >
                          {i.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
              <li onMouseEnter={() => hoverOpen(null)}>
                <Link href={primaryNav.contact.href} className={navLink} aria-current={isCurrent(primaryNav.contact.href)}>
                  {primaryNav.contact.label}
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            {rfqCount > 0 && (
              <button
                type="button"
                onClick={ui.openDrawer}
                aria-haspopup="dialog"
                className="inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-small font-semibold text-navy-900 hover:bg-ivory-100"
                aria-label={`RFQ list, ${rfqCount} ${rfqCount === 1 ? "product" : "products"}`}
              >
                <Icon name="rfq" size={20} />
                <span className="hidden sm:inline">RFQ list</span>
                <span className="grid min-w-6 place-items-center rounded-full bg-jute-300 px-1.5 text-[0.75rem] leading-6 text-navy-950 tabular-nums">
                  {rfqCount}
                </span>
              </button>
            )}
            {/* Below xl the sticky bottom bar carries this action. */}
            <div className="hidden xl:block">
              <Button href={primaryNav.cta.href} size="sm">
                {primaryNav.cta.label}
              </Button>
            </div>
            <button
              type="button"
              className="inline-grid size-11 place-items-center rounded-control text-navy-900 hover:bg-ivory-100 xl:hidden"
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Icon name="menu" />
            </button>
          </div>
        </div>

        {open === "products" && <MegaMenu id={megaId} ref={megaRef} onNavigate={() => setOpen(null)} />}
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
