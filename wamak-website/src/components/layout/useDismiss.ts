"use client";

import { useEffect, type RefObject } from "react";

/** Close a popup on Escape or on pointer-down outside `ref`. */
export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: (reason: "escape" | "outside") => void,
) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose("escape");
    };
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose("outside");
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [ref, open, onClose]);
}

/** Move focus between [data-menu-item] elements with arrow keys, Home and End. */
export function handleMenuArrows(e: React.KeyboardEvent<HTMLElement>, container: HTMLElement | null) {
  if (!container || !["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
  const items = Array.from(container.querySelectorAll<HTMLElement>("[data-menu-item]"));
  if (!items.length) return;
  e.preventDefault();
  const i = items.indexOf(document.activeElement as HTMLElement);
  const next =
    e.key === "Home" ? 0
    : e.key === "End" ? items.length - 1
    : e.key === "ArrowDown" ? (i + 1) % items.length
    : (i - 1 + items.length) % items.length;
  items[next].focus();
}
