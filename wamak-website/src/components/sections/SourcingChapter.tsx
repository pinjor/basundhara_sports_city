import { TextLink } from "@/components/ui/TextLink";
import { home } from "@/content/home";

/** Navy chapter: what WAMAK coordinates on the buyer's behalf. */
export function SourcingChapter() {
  const c = home.chapter;
  return (
    <section aria-labelledby="chapter-title" className="surface-navy py-24 md:py-32">
      <div className="container-site grid-site gap-y-14">
        <div className="col-span-full lg:col-span-6">
          <h2 id="chapter-title" className="text-h1">
            {c.title}
          </h2>
          <p className="mt-8 measure text-body-l text-navy-200">{c.body}</p>
          <p className="mt-8">
            <TextLink href="/how-we-work" tone="inverse" className="inline-flex min-h-11 items-center">
              {c.link}
            </TextLink>
          </p>
        </div>

        <dl className="col-span-full grid gap-x-10 sm:grid-cols-2 lg:col-span-5 lg:col-start-8 lg:self-end">
          {c.steps.map((s) => (
            <div key={s.term} className="border-t border-line-navy py-6">
              <dt className="flex items-baseline gap-3 font-display text-[1.25rem] font-semibold text-ivory-50">
                <span aria-hidden="true" className="h-px w-4 shrink-0 translate-y-[-0.3em] bg-jute-300" />
                {s.term}
              </dt>
              <dd className="mt-2 text-small leading-relaxed text-navy-200">{s.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
