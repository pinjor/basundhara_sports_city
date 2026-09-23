import type { Metadata } from "next";
import { JsonLd } from "@/components/brand/JsonLd";
import { CTABanner } from "@/components/sections/CTABanner";
import { PageHero } from "@/components/sections/PageHero";
import { Accordion } from "@/components/ui/Accordion";
import { categories } from "@/content/categories";
import { categoryFaqs, generalFaqs, type Faq } from "@/content/faqs";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers for B2B buyers: what WAMAK GROUP supplies, customization and private label, samples, minimum orders, Incoterms and how to request a quote.",
  alternates: { canonical: "/resources/faq" },
};

const extra: Faq[] = [
  { q: "What can be customized?", a: "Depending on the product and quantity: size, design, colour, materials and finish, branding, labels, barcodes and packaging." },
  { q: "Do you offer private label?", a: "Yes, for selected products and quantities, coordinated with manufacturing partners. Ask about private label on any product page." },
  { q: "How does sourcing work?", a: "You send a requirement; we review it, identify suitable producers in Bangladesh, and come back with a quotation, arranging samples where the product allows. See How we work for the full sequence." },
  { q: "What packaging can you arrange?", a: "Bulk export cartons, retail packs, gift packs, labels, hangtags, barcodes and carton marks, agreed per order." },
  { q: "Who runs the company?", a: `${site.name} is led by its Chairman, ${site.leadership[0].name}, and its Managing Director, ${site.leadership[1].name}.` },
  { q: "How do I request a quote?", a: "Use the Request a quote form: three short steps, with a file upload for specifications. You can also add several products to your RFQ list and send them together, or email us." },
];

const general = [...generalFaqs.slice(0, 2), ...extra.slice(0, 4), ...generalFaqs.slice(2), ...extra.slice(4)];

export default function FaqPage() {
  const all = [...general, ...categories.flatMap((c) => categoryFaqs[c.slug])];
  return (
    <>
      <PageHero
        crumbs={[
          { name: "Resources", href: "/resources/catalogue" },
          { name: "FAQ", href: "/resources/faq" },
        ]}
        title="Frequently asked questions"
        intro="Straight answers to what buyers ask us most. If your question isn't here, ask us directly."
      />
      <section className="surface-ivory pb-20 md:pb-28">
        <div className="container-site grid-site gap-y-16">
          <nav aria-label="FAQ sections" className="col-span-full lg:col-span-3">
            <ul className="flex flex-wrap gap-2 lg:sticky lg:top-28 lg:flex-col lg:gap-0">
              <li>
                <a href="#general" className="inline-flex min-h-11 items-center text-navy-900 hover:underline hover:underline-offset-4 max-lg:rounded-full max-lg:border max-lg:border-line max-lg:px-4">
                  Buying from WAMAK
                </a>
              </li>
              {categories.map((c) => (
                <li key={c.slug}>
                  <a href={`#faq-${c.slug}`} className="inline-flex min-h-11 items-center text-navy-900 hover:underline hover:underline-offset-4 max-lg:rounded-full max-lg:border max-lg:border-line max-lg:px-4">
                    {c.shortName}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="col-span-full lg:col-span-8 lg:col-start-5">
            <section id="general" aria-labelledby="general-title">
              <h2 id="general-title" className="text-h2">
                Buying from WAMAK
              </h2>
              <Accordion items={general} className="mt-6" />
            </section>
            {categories.map((c) => (
              <section key={c.slug} id={`faq-${c.slug}`} aria-labelledby={`faq-${c.slug}-title`} className="mt-16">
                <h2 id={`faq-${c.slug}-title`} className="text-h3">
                  {c.name}
                </h2>
                <Accordion items={categoryFaqs[c.slug]} className="mt-4" />
              </section>
            ))}
          </div>
        </div>
      </section>
      <CTABanner />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: all.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
    </>
  );
}
