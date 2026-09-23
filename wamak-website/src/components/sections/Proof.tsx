import Image from "next/image";
import { clientLogos, metrics, testimonials } from "@/content/proof";

/**
 * Proof blocks. Each renders NOTHING while its data array is empty, so the
 * site can never show a placeholder testimonial, logo or number.
 */

export function Testimonials() {
  if (testimonials.length === 0) return null;
  return (
    <section aria-labelledby="testimonials-title" className="surface-ivory py-20 md:py-28">
      <div className="container-site">
        <h2 id="testimonials-title" className="text-h2">
          What buyers say
        </h2>
        <ul className="mt-12 grid gap-8 md:grid-cols-2">
          {testimonials.map((t) => (
            <li key={t.name}>
              <figure className="border-t border-line pt-6">
                <blockquote className="font-display text-h3 font-medium text-navy-900">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-small text-ink-600">
                  {t.name}, {t.role}, {t.company} ({t.country})
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ClientLogoWall() {
  if (clientLogos.length === 0) return null;
  return (
    <section aria-label="Clients" className="surface-ivory py-14">
      <ul className="container-site flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
        {clientLogos.map((l) => (
          <li key={l.name}>
            <Image src={l.src} alt={l.name} width={l.width} height={l.height} className="h-10 w-auto opacity-80" />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Metrics() {
  if (metrics.length === 0) return null;
  return (
    <section aria-label="Key figures" className="surface-navy py-16">
      <dl className="container-site grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <dt className="text-small text-navy-200">{m.label}</dt>
            <dd className="font-display text-h2 font-bold text-ivory-50">{m.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
