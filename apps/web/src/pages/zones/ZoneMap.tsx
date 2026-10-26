import type { ZoneDto } from "@bsc/shared";
import { toneForStatus } from "../../components/ui/StatusBadge";

/** Pin placement on the illustrated campus map (percent of width / height). */
const CAMPUS_LAYOUT: Record<string, { x: number; y: number; n: number }> = {
  "Central Stadium Complex": { x: 0.48, y: 0.36, n: 1 },
  "VIP Pavilion & Protocol Wing": { x: 0.52, y: 0.2, n: 2 },
  "Aquatic Centre": { x: 0.23, y: 0.4, n: 3 },
  "Retail Boulevard": { x: 0.2, y: 0.62, n: 4 },
  "Cricket Ground & Pavilion": { x: 0.63, y: 0.3, n: 5 },
  "Futsal & Hockey Arena": { x: 0.7, y: 0.5, n: 6 },
  "Racquet Sports Pavilion": { x: 0.56, y: 0.7, n: 7 },
  "North Training Grounds": { x: 0.82, y: 0.44, n: 8 },
  "Parking Precinct A": { x: 0.17, y: 0.18, n: 9 },
  "Parking Precinct B (VIP)": { x: 0.78, y: 0.16, n: 10 },
  "Broadcast & Media Compound": { x: 0.88, y: 0.3, n: 11 },
  "Back-of-House Services Yard": { x: 0.12, y: 0.82, n: 12 },
};

const PIN_BG: Record<string, string> = {
  success: "bg-teal",
  warning: "bg-gold",
  danger: "bg-red",
  info: "bg-blue",
  neutral: "bg-text-dimmer",
};

function pinFor(zone: ZoneDto, index: number) {
  const named = CAMPUS_LAYOUT[zone.name];
  if (named) return named;
  return {
    x: zone.mapX ?? 0.5,
    y: zone.mapY ?? 0.5,
    n: index + 1,
  };
}

export function ZoneMap({ zones, onSelect }: { zones: ZoneDto[]; onSelect: (zone: ZoneDto) => void }) {
  const placed = zones
    .map((zone, index) => ({ zone, pin: pinFor(zone, index) }))
    .sort((a, b) => a.pin.n - b.pin.n);

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-gold/15 px-4 py-3">
        <h3 className="font-display text-base font-semibold tracking-wide text-gold">Complex map</h3>
        <p className="text-[11px] uppercase tracking-[0.16em] text-text-dimmer">Bashundhara Sports City · live zones</p>
      </div>

      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#1a3a28]">
        <img
          src="/bsc-complex-map.png"
          alt="Illustrated aerial map of Bashundhara Sports City"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

        {placed.map(({ zone, pin }) => {
          const tone = toneForStatus(zone.status);
          const occupancyPct = zone.capacity > 0 ? Math.min(100, Math.round((zone.liveOccupancy / zone.capacity) * 100)) : 0;
          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => onSelect(zone)}
              aria-label={`${pin.n}. ${zone.name} — ${zone.status}, ${occupancyPct}% occupancy`}
              className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 focus-visible:z-30"
              style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-black shadow-[0_2px_10px_rgba(0,0,0,0.45)] ring-2 ring-white transition-transform group-hover:scale-125 ${PIN_BG[tone]}`}
              >
                {pin.n}
              </span>
              <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 hidden w-max max-w-[220px] -translate-x-1/2 rounded-md border border-gold/30 bg-surface-2 px-2.5 py-1.5 text-left text-xs text-text shadow-gold-sm group-hover:block group-focus-visible:block">
                <span className="block font-medium text-gold">
                  {pin.n}. {zone.name}
                </span>
                <span className="mt-0.5 block text-[11px] text-text-dim">
                  {zone.status} · {occupancyPct}% occupancy · {zone.type}
                </span>
              </span>
            </button>
          );
        })}

        <div className="thin-scroll absolute bottom-3 left-3 z-20 max-h-[72%] w-[min(280px,46%)] overflow-y-auto rounded-md border border-white/15 bg-surface-2 p-3 text-[11px] text-text backdrop-blur-md">
          <div className="mb-2 font-display text-sm font-semibold tracking-wide text-gold">Legend</div>
          <ol className="mb-3 space-y-1 text-text">
            {placed.map(({ zone, pin }) => (
              <li key={zone.id}>
                <button
                  type="button"
                  onClick={() => onSelect(zone)}
                  className="flex w-full items-start gap-2 rounded px-0.5 text-left hover:text-gold"
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-black ${PIN_BG[toneForStatus(zone.status)]}`}
                  >
                    {pin.n}
                  </span>
                  <span className="leading-snug">{zone.name}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3 border-t border-white/10 pt-2 text-text-dim">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal" /> Operational
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gold" /> Maintenance
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red" /> Restricted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
