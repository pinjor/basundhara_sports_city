import type { Metadata } from "next";
import Link from "next/link";
import { FibreThread } from "@/components/brand/FibreThread";
import { ProductsHub } from "@/components/product/ProductsHub";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { categories } from "@/content/categories";
import { categoryHref, productHref } from "@/content/navigation";
import { productsIn } from "@/content/products";

export const metadata: Metadata = {
  title: "Products from Bangladesh",
  description:
    "Jute bags, handicrafts, sisal rope and twine, natural loofah, original paintings, pineapple, mud crab and customized sourcing from Bangladesh, quoted to your specification.",
  alternates: { canonical: "/products" },
};

const quoteSteps = [
  { title: "Send your requirement", body: "Product, specification, quantity and destination. Add files if you have them." },
  { title: "We review and source", body: "We confirm details with you and identify suitable producers in Bangladesh." },
  { title: "Receive a quotation", body: "Commercial terms for your order, with samples arranged where the product allows." },
];

export default function ProductsPage() {
  return (
    <>
      <section className="surface-ivory pt-8 pb-12 md:pt-12 md:pb-16">
        <div className="container-site">
          <Breadcrumbs items={[{ name: "Products", href: "/products" }]} />
          <div className="grid-site mt-10 gap-y-6 md:mt-14">
            <h1 className="col-span-full text-h1 lg:col-span-7">Products we source from Bangladesh</h1>
            <p className="col-span-full measure text-body-l text-ink-600 lg:col-span-4 lg:col-start-9 lg:self-end">
              Every range is quoted to your specification, quantity and destination. Filter by material or use, or
              send a requirement for something we don&apos;t list.
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Product families" className="surface-ivory pb-20 md:pb-28">
        <div className="container-site">
          <ProductsHub />
        </div>
      </section>

      <FibreThread variant="divider" tone="jute" className="h-12 w-full" />

      <section aria-labelledby="quote-steps-title" className="surface-ivory py-20 md:py-24">
        <div className="container-site grid-site gap-y-10">
          <div className="col-span-full lg:col-span-4">
            <h2 id="quote-steps-title" className="text-h2">
              How quotation works
            </h2>
            <div className="mt-8">
              <Button href="/request-quote">Request a quote</Button>
            </div>
          </div>
          <ol className="col-span-full grid gap-8 md:grid-cols-3 lg:col-span-7 lg:col-start-6">
            {quoteSteps.map((s, i) => (
              <li key={s.title} className="border-t border-line pt-6">
                <span className="font-display text-small font-semibold text-jute-700 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-[1.25rem] leading-tight font-semibold tracking-[-0.015em]">{s.title}</h3>
                <p className="mt-2 text-ink-600">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="index-title" className="bg-ivory-100 py-20 md:py-24">
        <div className="container-site">
          <h2 id="index-title" className="text-h2">
            Every product we list
          </h2>
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <div key={c.slug}>
                <h3 className="text-[1.125rem] leading-snug font-semibold">
                  <Link href={categoryHref(c.slug)} className="hover:text-leaf-700 hover:underline hover:underline-offset-4">
                    {c.name}
                  </Link>
                </h3>
                <ul className="mt-3 flex flex-col text-small">
                  {productsIn(c.slug).map((p) => (
                    <li key={p.slug}>
                      <Link href={productHref(c.slug, p.slug)} className="inline-block py-1.5 leading-snug text-ink-600 hover:text-leaf-700 hover:underline hover:underline-offset-4">
                        {p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
