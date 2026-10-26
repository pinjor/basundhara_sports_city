import { useEffect, useRef, type ReactNode } from "react";
import { animate, motion, useInView, useReducedMotion, type Variants } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE, staggerChildren: 0.03, delayChildren: 0.05 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: EASE } },
};

export const HOVER = { y: -2, transition: { type: "spring", stiffness: 400, damping: 26 } } as const;

export const popVariants: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 520, damping: 34 } },
  exit: { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.12 } },
};

/* Transforms are dropped once settled (framer writes `transform: none`), so fixed-position children keep the viewport as containing block. */
export function PageMotion({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  return (
    <motion.div key={id} className={className} variants={pageVariants} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

const NUM = /-?\d[\d,]*(?:\.\d+)?/;

function fmt(n: number, sample: string) {
  const dec = sample.split(".")[1]?.length ?? 0;
  const indian = /\d,\d\d,\d{3}/.test(sample);
  const grouped = sample.includes(",");
  return n.toLocaleString(indian ? "en-IN" : "en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: grouped });
}

export function CountUp({ value, duration = 1.1 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const reduce = useReducedMotion();
  const match = value.match(NUM);
  useEffect(() => {
    const el = ref.current;
    if (!el || !match || !inView || reduce) return;
    const raw = match[0];
    const target = Number(raw.replace(/,/g, ""));
    const [pre, post] = [value.slice(0, match.index), value.slice((match.index ?? 0) + raw.length)];
    const ctl = animate(0, target, {
      duration,
      ease: EASE,
      onUpdate: (v) => {
        el.textContent = pre + fmt(v, raw) + post;
      },
    });
    return () => ctl.stop();
  }, [value, inView, reduce]);
  const start = match && !reduce ? value.replace(match[0], fmt(0, match[0])) : value;
  return <span key={value} ref={ref} aria-label={value}>{start}</span>;
}
