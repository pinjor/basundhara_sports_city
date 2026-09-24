import { TextLink } from "@/components/ui/TextLink";
import { world } from "@/content/generated/world";
import { home } from "@/content/home";
import { origin, pinFor, regions } from "@/content/markets";

/** Curved thread from Bangladesh to a region anchor, arcing upward. */
function route(to: { x: number; y: number }) {
  const mx = (origin.x + to.x) / 2;
  const dist = Math.hypot(to.x - origin.x, to.y - origin.y);
  const my = Math.min(origin.y, to.y) - dist * 0.28;
  return `M${origin.x} ${origin.y} Q ${mx.toFixed(2)} ${my.toFixed(2)} ${to.x} ${to.y}`;
}

/**
 * Dotted world map (generated at build time from real geography) with
 * thread routes to the five target regions. Labelled as regions WAMAK
 * welcomes inquiries from — not a claim of existing trade.
 */
export function MarketsMap({ showLink = true }: { showLink?: boolean }) {
  const m = home.markets;
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  return (
    <section aria-labelledby="markets-title" className="surface-deep py-20 md:py-28">
      <div className="container-site">
        <div className="grid-site gap-y-6">
          <h2 id="markets-title" className="col-span-full text-h2 lg:col-span-6">
            {m.title}
          </h2>
          <div className="col-span-full lg:col-span-5 lg:col-start-8">
            <p className="measure text-body-l text-navy-200">{m.body}</p>
            {showLink && (
              <p className="mt-6">
                <TextLink href="/global-markets" tone="inverse" className="inline-flex min-h-11 items-center">
                  {m.link}
                </TextLink>
              </p>
            )}
          </div>
        </div>

        <div className="-mx-4 mt-12 overflow-hidden md:mx-0 md:mt-16" aria-hidden="true">
          {/* Phones: enlarge and crop towards Bangladesh; routes run off the edge, the list below names every region. */}
          <div className="relative w-[170%] -translate-x-[38%] md:w-full md:translate-x-0">
          {/* Dots are a cached static file; routes and pins are drawn on top in the same coordinate space. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, nothing to optimise */}
          <img src="/images/world-dots.svg" alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full" />
          <svg viewBox={`0 0 ${world.width} ${world.height}`} className="relative block h-auto w-full" focusable="false">
            {regions.map((r) => (
              <path
                key={r.id}
                d={route(pinFor(r.id))}
                stroke="var(--color-jute-300)"
                strokeWidth={1.25}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                fill="none"
              />
            ))}
            {regions.map((r) => {
              const pin = pinFor(r.id);
              return <circle key={r.id} cx={pin.x} cy={pin.y} r={0.55} fill="var(--color-jute-300)" />;
            })}
            <circle cx={origin.x} cy={origin.y} r={1.6} fill="none" stroke="var(--color-leaf-500)" strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
            <circle cx={origin.x} cy={origin.y} r={0.7} fill="var(--color-leaf-500)" />
          </svg>

          {/* Crisp HTML labels positioned over the SVG. */}
          <span
            className="absolute hidden -translate-x-1/2 translate-y-3 text-small font-semibold whitespace-nowrap text-ivory-50 md:block"
            style={{ left: pct(origin.x, world.width), top: pct(origin.y, world.height) }}
          >
            Bangladesh
          </span>
          {regions.map((r) => {
            const pin = pinFor(r.id);
            return (
              <span
                key={r.id}
                className={`absolute hidden -translate-y-1/2 text-small whitespace-nowrap text-navy-200 md:block ${
                  r.align === "end" ? "-translate-x-[calc(100%+0.75rem)]" : "translate-x-3"
                }`}
                style={{ left: pct(pin.x, world.width), top: pct(pin.y, world.height) }}
              >
                {r.name}
              </span>
            );
          })}
          </div>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-x-6 border-t border-line-navy sm:grid-cols-3 lg:grid-cols-5" aria-label="Target regions">
          {regions.map((r) => (
            <li key={r.id} className="flex items-center gap-3 border-b border-line-navy py-4 font-display font-semibold text-ivory-50 lg:border-b-0">
              <span aria-hidden="true" className="size-2 rounded-full bg-jute-300" />
              {r.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
