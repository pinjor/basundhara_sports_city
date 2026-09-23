/**
 * Leadership portrait stand-in. Initials set in Manrope on navy with a fine
 * jute rule — deliberately not a silhouette or generated face.
 * Replace with real photography when supplied (see CONTENT-TODO.md).
 */
type Props = {
  initials: string;
  name: string;
  /** "portrait" = 4:5 card image; "badge" = small circular mark. */
  shape?: "portrait" | "badge";
  /** Use "deep" when the card sits on a navy-900 section. */
  tone?: "navy" | "deep";
  className?: string;
};

export function Monogram({ initials, name, shape = "portrait", tone = "navy", className }: Props) {
  if (shape === "badge") {
    return (
      <span
        role="img"
        aria-label={`Monogram for ${name}`}
        className={`inline-grid size-14 place-items-center rounded-full bg-navy-900 font-display text-lg font-semibold tracking-tight text-ivory-50 ring-1 ring-jute-300 ring-offset-2 ring-offset-ivory-50 ${className ?? ""}`}
      >
        {initials}
      </span>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Monogram for ${name}. Portrait photograph to be supplied.`}
      className={`relative isolate grid aspect-[4/5] place-items-center overflow-hidden rounded-card ${tone === "deep" ? "bg-navy-950" : "bg-navy-900"} ${className ?? ""}`}
    >
      <span
        aria-hidden="true"
        className="font-display text-[clamp(4rem,12vw,7.5rem)] leading-none font-extrabold tracking-[-0.04em] text-ivory-50"
      >
        {initials}
      </span>
      <span aria-hidden="true" className="absolute inset-x-8 bottom-10 h-px bg-jute-300/70" />
      <span aria-hidden="true" className="absolute inset-4 rounded-[8px] border border-line-navy" />
    </div>
  );
}
