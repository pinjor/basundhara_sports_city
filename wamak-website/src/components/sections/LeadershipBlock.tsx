import { Monogram } from "@/components/brand/Monogram";
import { TextLink } from "@/components/ui/TextLink";
import { home } from "@/content/home";
import { site } from "@/content/site";

/** Chairman and MD. Monograms stand in until real portraits are supplied. */
export function LeadershipBlock() {
  const l = home.leadership;
  return (
    <section aria-labelledby="leadership-title" className="surface-ivory py-20 md:py-28">
      <div className="container-site grid-site items-end gap-y-12">
        <div className="col-span-full lg:col-span-4">
          <h2 id="leadership-title" className="text-h2">
            {l.title}
          </h2>
          <p className="mt-6 measure text-body-l text-ink-600">{l.body}</p>
          <p className="mt-8">
            <TextLink href="/about/leadership" className="inline-flex min-h-11 items-center">
              {l.link}
            </TextLink>
          </p>
        </div>
        <ul className="col-span-full grid grid-cols-2 gap-4 sm:gap-8 lg:col-span-7 lg:col-start-6">
          {site.leadership.map((p) => (
            <li key={p.name} className="flex flex-col gap-4">
              <Monogram initials={p.initials} name={p.name} />
              <div>
                <p className="font-display text-body-l leading-snug font-semibold text-navy-900">{p.name}</p>
                <p className="text-small text-ink-600">
                  {p.role}, {site.name}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
