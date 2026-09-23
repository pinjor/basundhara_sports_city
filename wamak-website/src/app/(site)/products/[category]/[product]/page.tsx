import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToRfqButton } from "@/components/product/AddToRfqButton";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { TextLink } from "@/components/ui/TextLink";
import { TrackView } from "@/components/ui/TrackView";
import { getCategory, REGULATED_NOTICE } from "@/content/categories";
import { categoryHref, productHref } from "@/content/navigation";
import { getProduct, MOQ_TEXT, products, productsIn, SAMPLES_TEXT, SPEC_PENDING } from "@/content/products";
import { site } from "@/content/site";

type Params = { params: Promise<{ category: string; product: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ category: p.category, product: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category, product } = await params;
  const p = getProduct(category, product);
  const c = getCategory(category);
  if (!p || !c) return {};
  return {
    title: `${p.name}: ${c.shortName.toLowerCase()} from Bangladesh`,
    description: `${p.summary} Sourced in Bangladesh by WAMAK GROUP and quoted to your specification, quantity and destination.`,
    alternates: { canonical: productHref(category, product) },
  };
}

/** Standard spec rows. Only verified values are shown; everything else is confirmed on request. */
const SPEC_ROWS = ["Dimensions", "Material", "Colour and finish", "Packing"];

export default async function ProductPage({ params }: Params) {
  const { category, product } = await params;
  const p = getProduct(category, product);
  const c = getCategory(category);
  if (!p || !c) notFound();

  const href = productHref(c.slug, p.slug);
  const quote = `/request-quote?product=${c.slug}/${p.slug}`;
  const related = productsIn(c.slug).filter((x) => x.slug !== p.slug).slice(0, 3);
  const verified = new Map(p.specs.map((s) => [s.label, s.value]));

  const facts = [
    { term: "Minimum order", detail: MOQ_TEXT },
    { term: "Samples", detail: SAMPLES_TEXT },
    { term: "Origin", detail: site.commercial.origin },
    { term: "Private label", detail: p.privateLabel ? "Available, subject to quantity" : "Not typical for this product" },
  ];

  return (
    <>
      <TrackView event="product_view" params={{ product: p.slug, category: c.slug }} />

      <section className="surface-ivory pt-8 pb-20 md:pt-12 md:pb-28">
        <div className="container-site">
          <Breadcrumbs
            items={[
              { name: "Products", href: "/products" },
              { name: c.name, href: categoryHref(c.slug) },
              { name: p.name, href },
            ]}
          />

          <div className="grid-site mt-10 gap-y-12 md:mt-12">
            <div className="col-span-full md:col-span-4 lg:col-span-6">
              <ProductGallery ids={[`product-${p.slug}`, `product-${p.slug}-detail`, `product-${p.slug}-packed`]} name={p.name} />
            </div>

            <div className="col-span-full md:col-span-4 lg:col-span-5 lg:col-start-8">
              <p className="text-small font-medium text-jute-700">{c.name}</p>
              <h1 className="mt-3 text-h2">{p.name}</h1>
              <p className="mt-5 text-body-l text-ink-600">{p.summary}</p>

              <dl className="mt-8 grid grid-cols-2 gap-x-6 border-t border-line">
                {facts.map((f) => (
                  <div key={f.term} className="border-b border-line py-4">
                    <dt className="text-small text-ink-600">{f.term}</dt>
                    <dd className="mt-1 font-medium text-navy-900">{f.detail}</dd>
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

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button href={quote} className="w-full sm:w-auto">
                  Request quote for this product
                </Button>
                <AddToRfqButton item={{ category: c.slug, slug: p.slug, name: p.name }} size="md" className="w-full sm:w-auto" />
              </div>
              {p.privateLabel && (
                <p className="mt-5">
                  <TextLink href={`${quote}&privateLabel=1`} className="inline-flex min-h-11 items-center">
                    Ask about private label
                  </TextLink>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Product details" className="bg-ivory-100 py-20 md:py-24">
        <div className="container-site grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <h2 className="text-h3">Material and features</h2>
            <ul className="mt-6 flex flex-col border-t border-line">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-3 border-b border-line py-3">
                  <Icon name="check" size={20} className="mt-0.5 shrink-0 text-leaf-700" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <h2 className="text-h3">Specification</h2>
            <table className="mt-6 w-full border-t border-line text-start">
              <caption className="sr-only">Specification of {p.name}</caption>
              <tbody>
                {SPEC_ROWS.map((label) => (
                  <tr key={label} className="border-b border-line">
                    <th scope="row" className="w-2/5 py-3 pe-4 text-start align-top font-medium text-ink-900">
                      {label}
                    </th>
                    <td className={`py-3 ${verified.has(label) ? "text-ink-900" : "text-ink-600"}`}>{verified.get(label) ?? "Confirmed on request"}</td>
                  </tr>
                ))}
                <tr className="border-b border-line">
                  <th scope="row" className="py-3 pe-4 text-start font-medium text-ink-900">
                    Minimum order
                  </th>
                  <td className="py-3 text-ink-600">{MOQ_TEXT}</td>
                </tr>
                <tr className="border-b border-line">
                  <th scope="row" className="py-3 pe-4 text-start font-medium text-ink-900">
                    Origin
                  </th>
                  <td className="py-3 text-ink-900">{site.commercial.origin}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-4 text-small text-ink-600">
              {SPEC_PENDING}. Send your target specification and we confirm what can be supplied.
            </p>
          </div>
        </div>
      </section>

      <section className="surface-ivory py-20 md:py-24">
        <div className="container-site grid gap-12 md:grid-cols-3">
          <div>
            <h2 className="text-[1.375rem] leading-tight font-semibold">{p.privateLabel ? "Customization and private label" : "Customization"}</h2>
            <ul className="mt-5 flex flex-col gap-2 text-ink-600">
              {c.customization.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-[1.375rem] leading-tight font-semibold">Packaging</h2>
            <ul className="mt-5 flex flex-col gap-2 text-ink-600">
              {c.packaging.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-[1.375rem] leading-tight font-semibold">Commercial terms</h2>
            <p className="mt-5 text-ink-600">
              Pricing is quoted per order. Terms may include {site.commercial.incotermsNote}. Payment terms are agreed
              before order confirmation.
            </p>
            <p className="mt-4">
              <TextLink href="/commercial-terms" className="inline-flex min-h-11 items-center">
                Commercial terms and ordering
              </TextLink>
            </p>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-products-title" className="surface-ivory border-t border-line py-20 md:py-24">
          <div className="container-site">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 id="related-products-title" className="text-h3">
                More {c.shortName.toLowerCase()} products
              </h2>
              <TextLink href={categoryHref(c.slug)} className="inline-flex min-h-11 items-center">
                View all {c.name.toLowerCase()}
              </TextLink>
            </div>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <ProductCard product={r} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
