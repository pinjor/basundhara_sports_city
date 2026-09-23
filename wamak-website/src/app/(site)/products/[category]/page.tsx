import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FibreThread } from "@/components/brand/FibreThread";
import { ManifestImage } from "@/components/brand/ManifestImage";
import { ArtGallery } from "@/components/product/ArtGallery";
import { CategoryTile } from "@/components/product/CategoryTile";
import { ProductCard } from "@/components/product/ProductCard";
import { Accordion } from "@/components/ui/Accordion";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { TextLink } from "@/components/ui/TextLink";
import { TrackView } from "@/components/ui/TrackView";
import { categories, getCategory, REGULATED_NOTICE, type Category } from "@/content/categories";
import { categoryFaqs } from "@/content/faqs";
import { categoryHref } from "@/content/navigation";
import { MOQ_TEXT, productsIn, SAMPLES_TEXT } from "@/content/products";
import { getService } from "@/content/services";
import { site } from "@/content/site";

type Params = { params: Promise<{ category: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const c = getCategory((await params).category);
  if (!c) return {};
  return {
    title: c.kind === "sourcing" ? "Customized product sourcing in Bangladesh" : `${c.name} from Bangladesh`,
    description: c.metaDescription,
    alternates: { canonical: categoryHref(c.slug) },
  };
}

const sourcingSteps = [
  { title: "Your requirement", body: "Product, specification, quantity, target price and destination. Drawings, photos or samples help." },
  { title: "Supplier identification", body: "We look for manufacturers and producers in Bangladesh who can make it, and assess them against your brief." },
  { title: "Samples and negotiation", body: "Samples or prototypes are coordinated where feasible, and terms are negotiated with the producer." },
  { title: "Specification and packaging", body: "Materials, finishes, branding and packaging are fixed in writing before an order is placed." },
  { title: "Quality, documents and shipment", body: "Goods are checked against the agreed specification, then documented and shipped on the agreed terms." },
];

function quoteHref(c: Category) {
  return `/request-quote?category=${c.slug}`;
}

function ListColumn({ title, items, icon }: { title: string; items: string[]; icon: Parameters<typeof Icon>[0]["name"] }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <Icon name={icon} className="text-leaf-700" />
        <h2 className="text-[1.375rem] leading-tight font-semibold tracking-[-0.015em]">{title}</h2>
      </div>
      <ul className="mt-5 flex flex-col border-t border-line">
        {items.map((i) => (
          <li key={i} className="border-b border-line py-3 text-ink-900">
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function CategoryPage({ params }: Params) {
  const c = getCategory((await params).category);
  if (!c) notFound();

  const items = productsIn(c.slug);
  const isArt = c.slug === "art-paintings";
  const isSourcing = c.kind === "sourcing";
  const anyPrivateLabel = items.some((p) => p.privateLabel);
  const faqs = categoryFaqs[c.slug];
  const related = c.related.map((s) => getCategory(s)!).filter(Boolean);
  const relatedServices = c.relatedServices.map((s) => getService(s)!).filter(Boolean);

  const facts = [
    { term: "Pricing", detail: "Quotation-based, to your requirement" },
    { term: "Minimum order", detail: MOQ_TEXT },
    { term: "Samples", detail: SAMPLES_TEXT },
    { term: "Private label", detail: anyPrivateLabel ? "Available for selected products" : "Not typical for this range" },
    { term: "Incoterms", detail: site.commercial.incotermsNote },
    { term: "Origin", detail: site.commercial.origin },
  ];

  return (
    <>
      <TrackView event="category_view" params={{ category: c.slug }} />

      {/* Hero */}
      <section className="surface-ivory pt-8 md:pt-12">
        <div className="container-site">
          <Breadcrumbs items={[{ name: "Products", href: "/products" }, { name: c.name, href: categoryHref(c.slug) }]} />
          <div className="grid-site mt-10 items-end gap-y-10 md:mt-14">
            <div className="col-span-full lg:col-span-6">
              <h1 className="text-h1">{c.name.replace(/-/g, "\u2011")}</h1>
              <p className="mt-6 measure text-body-l text-ink-600">{c.intro}</p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Button href={quoteHref(c)} className="w-full sm:w-auto">
                  {isSourcing ? "Send your requirement" : `Request a quote for ${c.shortName.toLowerCase()}`}
                </Button>
                {isArt && (
                  <Button href="/request-quote?category=art-paintings&product=art-paintings/commissioned-paintings" variant="secondary" className="w-full sm:w-auto">
                    Commission a painting
                  </Button>
                )}
                <TextLink href="/resources/catalogue" className="inline-flex min-h-11 items-center gap-2 sm:ms-2">
                  <Icon name="download" size={18} />
                  Download catalogue
                </TextLink>
              </div>
            </div>
            <div className="col-span-full md:col-span-6 md:col-start-2 lg:col-span-5 lg:col-start-8">
              <ManifestImage id={c.imageId} aspect="4 / 5" className="rounded-card" priority />
            </div>
          </div>
        </div>
        <FibreThread variant="divider" tone="jute" className="mt-14 h-12 w-full md:mt-20" />
      </section>

      {/* Commercial summary */}
      <section aria-labelledby="summary-title" className="surface-ivory py-14 md:py-20">
        <div className="container-site grid-site gap-y-8">
          <h2 id="summary-title" className="col-span-full text-h3 lg:col-span-3">
            Commercial summary
          </h2>
          <div className="col-span-full lg:col-span-9">
            <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {facts.map((f) => (
                <div key={f.term} className="border-t border-line py-4">
                  <dt className="text-small text-ink-600">{f.term}</dt>
                  <dd className="mt-1 font-display font-semibold text-navy-900">{f.detail}</dd>
                </div>
              ))}
            </dl>
            {c.regulated && (
              <Notice title="Before you request a quote" className="mt-8">
                <ul className="list-disc ps-5">
                  {REGULATED_NOTICE.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </Notice>
            )}
          </div>
        </div>
      </section>

      {/* Range / gallery / sourcing process */}
      <section aria-labelledby="range-title" className="bg-ivory-100 py-20 md:py-28">
        <div className="container-site">
          {isSourcing ? (
            <>
              <h2 id="range-title" className="text-h2">
                How customized sourcing works
              </h2>
              <ol className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-5">
                {sourcingSteps.map((s, i) => (
                  <li key={s.title} className="border-t-2 border-navy-900 pt-5">
                    <span className="font-display text-small font-semibold text-jute-700 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="mt-3 text-[1.1875rem] leading-snug font-semibold">{s.title}</h3>
                    <p className="mt-2 text-small text-ink-600">{s.body}</p>
                  </li>
                ))}
              </ol>
              <h3 className="mt-20 text-h3">What we can take on</h3>
              <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => (
                  <li key={p.slug}>
                    <ProductCard product={p} />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <h2 id="range-title" className="text-h2">
                  {isArt ? "The collection" : "The range"}
                </h2>
                <p className="measure text-ink-600">
                  Representative products. Specifications, minimum order quantities and terms are confirmed in your
                  quotation.
                </p>
              </div>
              <div className="mt-10">
                {isArt ? (
                  <ArtGallery products={items} />
                ) : (
                  <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((p) => (
                      <li key={p.slug}>
                        <ProductCard product={p} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Buyers, customization, packaging */}
      <section className="surface-ivory py-20 md:py-28">
        <div className="container-site grid gap-12 md:grid-cols-3 md:gap-8 lg:gap-12">
          <ListColumn title="Who buys this" items={c.buyers} icon="handshake" />
          <ListColumn title={isArt ? "Commissions" : "Customization and private label"} items={c.customization} icon="customize" />
          <ListColumn title="Packaging" items={c.packaging} icon="package" />
        </div>
      </section>

      {/* Requirement checklist */}
      <section aria-labelledby="checklist-title" className="surface-navy py-20 md:py-28">
        <div className="container-site grid-site gap-y-10">
          <div className="col-span-full lg:col-span-5">
            <h2 id="checklist-title" className="text-h2">
              What to include in your requirement
            </h2>
            <p className="mt-6 measure text-body-l text-navy-200">
              The more of this you send, the faster and more accurate the quotation. Anything you don&apos;t know yet,
              leave blank. We&apos;ll ask.
            </p>
            <div className="mt-8">
              <Button href={quoteHref(c)} variant="inverse">
                Send your requirement
              </Button>
            </div>
          </div>
          <ul className="col-span-full grid gap-x-8 sm:grid-cols-2 lg:col-span-6 lg:col-start-7">
            {c.requirementChecklist.map((item) => (
              <li key={item} className="flex items-start gap-3 border-t border-line-navy py-4 text-ivory-50">
                <Icon name="check" size={20} className="mt-0.5 shrink-0 text-jute-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Related services + FAQ */}
      <section className="surface-ivory py-20 md:py-28">
        <div className="container-site grid-site gap-y-16">
          <div className="col-span-full lg:col-span-4">
            <h2 className="text-h3">Related services</h2>
            <ul className="mt-6 flex flex-col border-t border-line">
              {relatedServices.map((s) => (
                <li key={s.slug} className="border-b border-line">
                  <Link href={`/services/${s.slug}`} className="group flex min-h-14 items-center gap-3 py-3 text-navy-900">
                    <Icon name={s.icon} className="shrink-0 text-leaf-700" />
                    <span className="font-medium group-hover:underline group-hover:underline-offset-4">{s.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6">
              <TextLink href="/commercial-terms" className="inline-flex min-h-11 items-center">
                Commercial terms and ordering
              </TextLink>
            </p>
          </div>
          <div className="col-span-full lg:col-span-7 lg:col-start-6">
            <h2 className="text-h3">Questions about {c.shortName.toLowerCase()}</h2>
            <Accordion items={faqs} className="mt-6" />
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="surface-ivory pb-20 md:pb-28">
        <div className="container-site">
          <div className="grid gap-8 rounded-card bg-mist-100 p-8 md:grid-cols-12 md:items-center md:p-12">
            <div className="md:col-span-7">
              <h2 className="text-h2">{isSourcing ? "Tell us what you need made." : `Ready to quote ${c.shortName.toLowerCase()}?`}</h2>
              <p className="mt-4 measure text-ink-600">
                Send your specification and quantity. We reply with questions or a quotation, not an automated price.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:col-span-5 md:justify-end">
              <Button href={quoteHref(c)}>{isSourcing ? "Send your requirement" : "Request a quote"}</Button>
              <Button href="/resources/catalogue" variant="secondary" icon="download">
                Download catalogue
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Related categories */}
      <section aria-labelledby="related-title" className="surface-ivory border-t border-line py-20 md:py-24">
        <div className="container-site">
          <h2 id="related-title" className="text-h3">
            Related categories
          </h2>
          <ul className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <li key={r.slug}>
                <CategoryTile category={r} aspect="4 / 3" size="sm" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
