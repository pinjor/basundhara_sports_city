import { useId, type ReactNode } from "react";

/**
 * Stand-in for product photography until real WAMAK images are supplied.
 * Each variant is a quiet, material-true texture (woven jute, combed fibre,
 * plied sisal, loofah cells, pineapple skin, water, linen canvas) so layouts
 * can be judged at full fidelity without implying facilities, people or
 * customers. Swap for <Image> by changing the manifest entry's status.
 */

export type MaterialVariant =
  | "weave"
  | "fibre"
  | "twine"
  | "loofah"
  | "harvest"
  | "tide"
  | "canvas";

type Props = {
  variant: MaterialVariant;
  /** Accessible description of the intended photograph. */
  alt: string;
  /** CSS aspect-ratio, e.g. "4 / 5". Omit to fill the parent. */
  aspect?: string;
  /** Deterministic seed so server and client render identically. */
  seed?: number;
  caption?: ReactNode | false;
  captionPlacement?: "bottom-start" | "top-end";
  className?: string;
};

/* Small deterministic PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

const W = 400;
const H = 500;

const BACKGROUND: Record<MaterialVariant, string> = {
  weave: "#a9834c",
  fibre: "#9c7640",
  twine: "#5e4a24",
  loofah: "#e4d4a8",
  harvest: "#b98a2e",
  tide: "#0d2f63",
  canvas: "#ebe5d6",
};

function Weave({ id }: { id: string }) {
  // Classic basket weave: two strands per band, alternating direction.
  const s = 40; // quadrant size
  const band = (x: number, y: number, horizontal: boolean) =>
    [0, 1].map((i) =>
      horizontal ? (
        <rect key={`${x}-${y}-${i}`} x={x + 1} y={y + 1 + i * 20} width={s - 2} height={18} rx={9} fill={`url(#${id}-h)`} />
      ) : (
        <rect key={`${x}-${y}-${i}`} x={x + 1 + i * 20} y={y + 1} width={18} height={s - 2} rx={9} fill={`url(#${id}-v)`} />
      ),
    );
  return (
    <>
      <defs>
        <linearGradient id={`${id}-h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2c792" />
          <stop offset="0.55" stopColor="#c9a66b" />
          <stop offset="1" stopColor="#8f6a34" />
        </linearGradient>
        <linearGradient id={`${id}-v`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d8ba83" />
          <stop offset="0.55" stopColor="#bf9a5f" />
          <stop offset="1" stopColor="#86612d" />
        </linearGradient>
        <pattern id={`${id}-p`} width={s * 2} height={s * 2} patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
          <rect width={s * 2} height={s * 2} fill="#6f4f22" />
          {band(0, 0, true)}
          {band(s, 0, false)}
          {band(0, s, false)}
          {band(s, s, true)}
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-p)`} />
    </>
  );
}

function Fibre({ seed }: { seed: number }) {
  // Combed jute fibre, macro: long, slightly wandering strands.
  const rand = rng(seed);
  const tones = ["#e7cf9c", "#d4b57c", "#c9a66b", "#b08949", "#8a6630", "#f0dfb5"];
  const strands = Array.from({ length: 150 }, (_, i) => {
    const x = rand() * (W + 120) - 60;
    const drift = (rand() - 0.5) * 90;
    const wob = (rand() - 0.5) * 40;
    const d = `M${r1(x)} -20 C ${r1(x + wob)} ${H * 0.3}, ${r1(x + drift - wob)} ${H * 0.6}, ${r1(x + drift)} ${H + 20}`;
    return (
      <path
        key={i}
        d={d}
        stroke={tones[Math.floor(rand() * tones.length)]}
        strokeWidth={r1(0.5 + rand() * 2.2)}
        strokeOpacity={r1(0.35 + rand() * 0.6)}
        fill="none"
        strokeLinecap="round"
      />
    );
  });
  return <g transform={`rotate(-14 ${W / 2} ${H / 2})`}>{strands}</g>;
}

function Twine({ id }: { id: string }) {
  // Coils of three-ply sisal rope lying side by side: each rope is a band of
  // slanted strands (S-twist) with a dark groove between neighbours.
  const ropeH = 58;
  const strand = 15;
  const ropes = Array.from({ length: 13 }, (_, k) => {
    const y = k * (ropeH + 4) - 40;
    const shift = (k % 3) * 5;
    return (
      <g key={k}>
        <rect x={-200} y={y - 2} width={W + 400} height={ropeH + 4} fill="#5e4a24" />
        <g clipPath={`url(#${id}-rope)`} transform={`translate(0 ${y})`}>
          {Array.from({ length: 48 }, (_, i) => (
            <path
              key={i}
              d={`M${-200 + i * strand + shift} ${ropeH} l ${ropeH * 0.62} ${-ropeH} h ${strand - 2} l ${-ropeH * 0.62} ${ropeH} z`}
              fill={`url(#${id}-ply)`}
            />
          ))}
          <rect x={-200} y={0} width={W + 400} height={ropeH} fill={`url(#${id}-round)`} />
        </g>
      </g>
    );
  });
  return (
    <>
      <defs>
        <linearGradient id={`${id}-ply`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8f7a47" />
          <stop offset="0.35" stopColor="#efe2bd" />
          <stop offset="0.7" stopColor="#d2bd8a" />
          <stop offset="1" stopColor="#7d6838" />
        </linearGradient>
        {/* Cylindrical shading across each rope. */}
        <linearGradient id={`${id}-round`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b2d12" stopOpacity={0.45} />
          <stop offset="0.3" stopColor="#fff6dc" stopOpacity={0.12} />
          <stop offset="0.55" stopColor="#fff6dc" stopOpacity={0} />
          <stop offset="1" stopColor="#3b2d12" stopOpacity={0.55} />
        </linearGradient>
        <clipPath id={`${id}-rope`}>
          <rect x={-200} y={0} width={W + 400} height={ropeH} rx={ropeH / 2} />
        </clipPath>
      </defs>
      <g transform={`rotate(-18 ${W / 2} ${H / 2})`}>{ropes}</g>
    </>
  );
}

function Loofah({ seed }: { seed: number }) {
  // Open cellular mesh of a dried loofah.
  const rand = rng(seed);
  const cells = Array.from({ length: 230 }, (_, i) => {
    const cx = rand() * W;
    const cy = rand() * H;
    const rx = 10 + rand() * 20;
    const ry = rx * (0.55 + rand() * 0.35);
    return (
      <ellipse
        key={i}
        cx={r1(cx)}
        cy={r1(cy)}
        rx={r1(rx)}
        ry={r1(ry)}
        transform={`rotate(${Math.round(rand() * 180)} ${r1(cx)} ${r1(cy)})`}
        fill="#c7ad73"
        fillOpacity={r1(0.08 + rand() * 0.2)}
        stroke="#fbf3dc"
        strokeWidth={r1(1.5 + rand() * 2.5)}
        strokeOpacity={0.8}
      />
    );
  });
  return <g>{cells}</g>;
}

function Harvest({ id }: { id: string }) {
  // Pineapple skin: a diamond lattice of fruitlets.
  const cell = 46;
  return (
    <>
      <defs>
        <radialGradient id={`${id}-eye`} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#e8b949" />
          <stop offset="0.6" stopColor="#c8912b" />
          <stop offset="1" stopColor="#7d5a1c" />
        </radialGradient>
        <pattern id={`${id}-p`} width={cell} height={cell} patternUnits="userSpaceOnUse" patternTransform="rotate(45) scale(1 0.8)">
          <rect width={cell} height={cell} fill="#6e5220" />
          <rect x={2} y={2} width={cell - 4} height={cell - 4} rx={12} fill={`url(#${id}-eye)`} />
          <circle cx={cell / 2} cy={cell / 2} r={4} fill="#5b6b2a" fillOpacity={0.7} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-p)`} />
    </>
  );
}

function Tide({ seed }: { seed: number }) {
  // Estuary water: layered, gently irregular swell lines.
  const rand = rng(seed);
  const lines = Array.from({ length: 34 }, (_, i) => {
    const y = i * 16 - 10;
    const a = 6 + rand() * 10;
    const p = rand() * 80;
    const d = `M-20 ${y} C ${r1(60 + p)} ${r1(y - a)}, ${r1(140 + p)} ${r1(y + a)}, 220 ${y} S ${r1(340 - p)} ${r1(y - a)}, 420 ${y}`;
    return (
      <path
        key={i}
        d={d}
        fill="none"
        stroke={i % 3 === 0 ? "#c9a66b" : "#9fb3d1"}
        strokeOpacity={i % 3 === 0 ? 0.35 : r1(0.18 + rand() * 0.25)}
        strokeWidth={r1(1 + rand() * 1.5)}
      />
    );
  });
  return <g>{lines}</g>;
}

function Canvas({ id }: { id: string }) {
  // Primed linen canvas with a single soft wash — suggests painting, depicts nothing.
  return (
    <>
      <defs>
        <pattern id={`${id}-linen`} width={6} height={6} patternUnits="userSpaceOnUse">
          <rect width={6} height={6} fill="#ebe5d6" />
          <path d="M0 1.5 H6 M0 4.5 H6" stroke="#d5ccb6" strokeWidth={0.8} />
          <path d="M1.5 0 V6 M4.5 0 V6" stroke="#dcd4bf" strokeWidth={0.6} />
        </pattern>
        <linearGradient id={`${id}-wash`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9a66b" stopOpacity={0.0} />
          <stop offset="0.55" stopColor="#c9a66b" stopOpacity={0.35} />
          <stop offset="0.62" stopColor="#5d7c8f" stopOpacity={0.35} />
          <stop offset="1" stopColor="#05245c" stopOpacity={0.28} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-linen)`} />
      <rect x={48} y={60} width={W - 96} height={H - 120} fill={`url(#${id}-wash)`} />
    </>
  );
}

export function MaterialPlaceholder({
  variant,
  alt,
  aspect,
  seed = 7,
  caption,
  captionPlacement = "bottom-start",
  className,
}: Props) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const onDark = variant === "tide";

  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative isolate overflow-hidden ${className ?? ""}`}
      style={{ aspectRatio: aspect, backgroundColor: BACKGROUND[variant] }}
      data-placeholder={variant}
    >
      <svg
        className="absolute inset-0 size-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} />
            <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0 0.1  0 0 0 0.55 0" />
          </filter>
          <radialGradient id={`${id}-light`} cx="0.3" cy="0.2" r="0.9">
            <stop offset="0" stopColor="#fff8e6" stopOpacity={0.28} />
            <stop offset="1" stopColor="#1b222b" stopOpacity={0.22} />
          </radialGradient>
        </defs>
        {variant === "weave" && <Weave id={id} />}
        {variant === "fibre" && <Fibre seed={seed} />}
        {variant === "twine" && <Twine id={id} />}
        {variant === "loofah" && <Loofah seed={seed} />}
        {variant === "harvest" && <Harvest id={id} />}
        {variant === "tide" && <Tide seed={seed} />}
        {variant === "canvas" && <Canvas id={id} />}
        {/* Natural, window-side light and a fine grain unify every variant. */}
        <rect width={W} height={H} fill={`url(#${id}-light)`} />
        <rect width={W} height={H} filter={`url(#${id}-grain)`} opacity={0.35} />
      </svg>

      {caption !== false && (
        <span
          className={`absolute ${captionPlacement === "top-end" ? "top-3 end-3" : "bottom-3 start-3"} max-w-[calc(100%-1.5rem)] rounded-control px-2 py-1 text-[0.75rem] leading-tight font-medium ${
            onDark ? "bg-navy-950/80 text-ivory-50" : "bg-ivory-50/90 text-ink-900"
          }`}
        >
          {caption ?? "Product photography to be supplied"}
        </span>
      )}
    </div>
  );
}
