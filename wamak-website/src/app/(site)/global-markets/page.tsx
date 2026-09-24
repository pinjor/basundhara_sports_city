import type { Metadata } from "next";
import { CTABanner } from "@/components/sections/CTABanner";
import { MarketsMap } from "@/components/sections/MarketsMap";
import { PageHero } from "@/components/sections/PageHero";
import { marketsPage } from "@/content/pages";

export const metadata: Metadata = {
  title: "Global markets",
  description:
    "WAMAK GROUP welcomes B2B inquiries from North America, Europe, the Middle East, Asia and Africa for products sourced in Bangladesh.",
  alternates: { canonical: "/global-markets" },
};

export default function GlobalMarketsPage() {
  return (
    <>
      <PageHero crumbs={[{ name: "Global markets", href: "/global-markets" }]} title="From Bangladesh to the world" intro={marketsPage.intro} divider={false} />
      <MarketsMap showLink={false} />
      <section aria-label="Regions" className="surface-ivory py-20 md:py-28">
        <div className="container-site">
          <ul className="grid gap-x-10 md:grid-cols-2 lg:grid-cols-3">
            {marketsPage.regions.map((r) => (
              <li key={r.id} className="border-t border-line py-8">
                <h2 className="flex items-center gap-3 text-h3">
                  <span aria-hidden="true" className="size-2.5 rounded-full bg-jute-300" />
                  {r.name}
                </h2>
                <p className="mt-3 text-ink-600">{r.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section aria-labelledby="destination-title" className="bg-ivory-100 py-20 md:py-28">
        <div className="container-site grid-site gap-y-10">
          <div className="col-span-full lg:col-span-4">
            <h2 id="destination-title" className="text-h2">
              What changes by destination
            </h2>
            <p className="mt-6 measure text-ink-600">Tell us where the goods are going. These four things are reviewed for every destination before we quote.</p>
          </div>
          <dl className="col-span-full grid gap-x-10 sm:grid-cols-2 lg:col-span-7 lg:col-start-6">
            {marketsPage.destinationFactors.map((f) => (
              <div key={f.title} className="border-t border-line py-6">
                <dt className="font-display text-[1.25rem] font-semibold text-navy-900">{f.title}</dt>
                <dd className="mt-2 text-ink-600">{f.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <CTABanner title="Tell us where your goods are going." />
    </>
  );
}
