import { useEffect, useRef, useState } from "react";

interface StatTileProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  tone?: "gold" | "teal" | "blue" | "red" | "default";
}

const TONE_COLOR: Record<NonNullable<StatTileProps["tone"]>, { accent: string; value: string }> = {
  gold: { accent: "#f2b81d", value: "#ffd44d" },
  teal: { accent: "#22c97a", value: "#3ee39a" },
  blue: { accent: "#3f97f4", value: "#6fb2ff" },
  red: { accent: "#f0444a", value: "#ff6b70" },
  default: { accent: "#5b5f69", value: "#f4f4f5" },
};

/**
 * KPI stat tile that counts up whenever its value changes (Section 2.4) —
 * including the first time real data replaces the initial loading value,
 * which is the moment that actually needs to read as "arriving".
 */
export function StatTile({ label, value, suffix = "", prefix = "", tone = "default" }: StatTileProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;
    const duration = 600;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const color = TONE_COLOR[tone];
  return (
    <div className="stat animate-stat-in" style={{ ["--a" as string]: color.accent, ["--v" as string]: color.value }}>
      <span className="stat-l">{label}</span>
      <b className="stat-v">
        {prefix}
        {display.toLocaleString()}
        {suffix}
      </b>
    </div>
  );
}
