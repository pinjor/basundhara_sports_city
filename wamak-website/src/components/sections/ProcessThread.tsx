"use client";

import { useEffect, useRef, useState } from "react";
import { FibreThread } from "@/components/brand/FibreThread";
import { TextLink } from "@/components/ui/TextLink";
import { home } from "@/content/home";
import { cn } from "@/lib/cn";

/**
 * "How we work": ten steps joined by the fibre thread. The thread fills as
 * the reader scrolls (scroll-linked, never scroll-jacked). With reduced
 * motion it is simply shown complete.
 */
type Step = { title: string; body: string; you?: string };
type Props = {
  title?: string;
  intro?: string;
  link?: { label: string; href: string } | null;
  steps?: readonly Step[];
  /** Render the heading as h2 (default) or visually hidden when the page H1 covers it. */
  headingId?: string;
};

export function ProcessThread({
  title = home.process.title,
  intro = home.process.intro,
  link = { label: home.process.link, href: "/how-we-work" },
  steps = home.process.steps,
  headingId = "process-title",
}: Props = {}) {
  const p = { title, intro, steps };
  const listRef = useRef<HTMLOListElement>(null);
  const [progress, setProgress] = useState(0);
  const [reached, setReached] = useState(0);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (reduced) {
        setProgress(1);
        setReached(p.steps.length);
        return;
      }
      const line = window.innerHeight * 0.6;
      const rect = list.getBoundingClientRect();
      setProgress(Math.min(1, Math.max(0, (line - rect.top) / rect.height)));
      const items = Array.from(list.children) as HTMLElement[];
      setReached(items.filter((li) => li.getBoundingClientRect().top + 12 < line).length);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    if (reduced) return () => cancelAnimationFrame(frame);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [p.steps.length]);

  return (
    <section aria-labelledby={headingId} className="surface-ivory py-20 md:py-32">
      <div className="container-site grid-site gap-y-12">
        <div className="col-span-full lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <h2 id={headingId} className="text-h2">
              {p.title}
            </h2>
            <p className="mt-6 measure text-body-l text-ink-600">{p.intro}</p>
            {link && (
              <p className="mt-8">
                <TextLink href={link.href} className="inline-flex min-h-11 items-center">
                  {link.label}
                </TextLink>
              </p>
            )}
          </div>
        </div>

        <div className="relative col-span-full lg:col-span-7 lg:col-start-6">
          {/* Spine: faint full thread, with the leaf thread revealed by progress. */}
          <div aria-hidden="true" className="absolute start-0 top-3 bottom-3 w-8">
            <FibreThread variant="vertical" tone="navy" strokeWidth={1.25} className="absolute inset-0 size-full opacity-20" />
            <div className="absolute inset-0" style={{ clipPath: `inset(0 0 ${(1 - progress) * 100}% 0)` }}>
              <FibreThread variant="vertical" tone="leaf" strokeWidth={2} className="size-full" />
            </div>
          </div>

          <ol ref={listRef} className="flex flex-col">
            {p.steps.map((s, i) => {
              const on = i < reached;
              return (
                <li key={s.title} className="relative grid grid-cols-[auto_1fr] gap-x-6 ps-14 pb-10 last:pb-0 md:gap-x-10 md:pb-12">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute start-[10px] top-2 size-3 rounded-full border-2 transition-colors duration-300",
                      on ? "border-leaf-500 bg-leaf-500" : "border-navy-900/30 bg-ivory-50",
                    )}
                  />
                  <span className="pt-0.5 font-display text-small font-semibold text-jute-700 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-[1.25rem] leading-tight font-semibold tracking-[-0.015em]">{s.title}</h3>
                    <p className="mt-2 text-ink-600">{s.body}</p>
                    {s.you && (
                      <p className="mt-3 rounded-control bg-white px-4 py-3 text-small text-ink-900 ring-1 ring-line">
                        <span className="font-semibold">What you provide: </span>
                        {s.you}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
