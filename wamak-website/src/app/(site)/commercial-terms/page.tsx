import type { Metadata } from "next";
import { CTABanner } from "@/components/sections/CTABanner";
import { PageHero } from "@/components/sections/PageHero";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { commercialTerms as t } from "@/content/pages";

export const metadata: Metadata = {
  title: "Commercial terms and ordering",
  description:
    "How WAMAK GROUP quotes: quotation-based pricing, minimum order quantities, samples, payment terms and Incoterms (EXW, FOB, CFR, CIF) explained in plain language.",
  alternates: { canonical: "/commercial-terms" },
};

export default function CommercialTermsPage() {
  return (
    <>
      <PageHero crumbs={[{ name: "Commercial terms", href: "/commercial-terms" }]} title="Commercial terms and ordering" intro={t.intro} />

      <section aria-label="How quotations work" className="surface-ivory pb-20 md:pb-28">
        <div className="container-site">
          <dl className="grid gap-x-12 md:grid-cols-2">
            {t.basics.map((b) => (
              <div key={b.title} className="border-t border-line py-8">
                <dt className="text-h3 font-display font-semibold text-navy-900">{b.title}</dt>
                <dd className="mt-3 measure text-ink-600">{b.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="incoterms-title" className="surface-navy py-20 md:py-28">
        <div className="container-site">
          <div className="grid-site gap-y-6">
            <h2 id="incoterms-title" className="col-span-full text-h2 lg:col-span-5">
              Incoterms in plain language
            </h2>
            <p className="col-span-full measure text-body-l text-navy-200 lg:col-span-6 lg:col-start-7">
              Incoterms decide who arranges and pays for each part of the journey, and where the risk passes from seller to buyer.
            </p>
          </div>
          <dl className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {t.incoterms.map((i) => (
              <div key={i.term} className="rounded-card border border-line-navy p-6">
                <dt>
                  <span className="block font-display text-h2 font-bold text-jute-300">{i.term}</span>
                  <span className="mt-1 block font-semibold text-ivory-50">{i.name}</span>
                </dt>
                <dd className="mt-4 text-small leading-relaxed text-navy-200">{i.body}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 measure text-navy-200">{t.incotermsNote}</p>
        </div>
      </section>

      <section aria-labelledby="accurate-title" className="surface-ivory py-20 md:py-28">
        <div className="container-site grid-site gap-y-10">
          <div className="col-span-full lg:col-span-5">
            <h2 id="accurate-title" className="text-h2">
              What makes a quotation accurate
            </h2>
            <p className="mt-6 measure text-ink-600">The more of this you can send, the closer the first quotation will be to the final one.</p>
            <div className="mt-8">
              <Button href="/request-quote">Send your requirement</Button>
            </div>
          </div>
          <ul className="col-span-full lg:col-span-6 lg:col-start-7">
            {t.accurateQuote.map((x) => (
              <li key={x} className="flex items-start gap-3 border-t border-line py-4 last:border-b">
                <Icon name="check" size={20} className="mt-0.5 shrink-0 text-leaf-700" />
                {x}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <CTABanner />
    </>
  );
}
