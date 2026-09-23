import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryTile } from "@/components/product/CategoryTile";
import { CTABanner } from "@/components/sections/CTABanner";
import { PageHero } from "@/components/sections/PageHero";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getCategory } from "@/content/categories";
import { getService, services } from "@/content/services";

type Params = { params: Promise<{ service: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((s) => ({ service: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const s = getService((await params).service);
  if (!s) return {};
  return { title: s.name, description: s.metaDescription, alternates: { canonical: `/services/${s.slug}` } };
}

export default async function ServicePage({ params }: Params) {
  const s = getService((await params).service);
  if (!s) notFound();
  const others = services.filter((x) => x.slug !== s.slug);
  const related = s.relatedCategories.map((c) => getCategory(c)!).filter(Boolean);

  return (
    <>
      <PageHero
        crumbs={[
          { name: "Services", href: "/services" },
          { name: s.name, href: `/services/${s.slug}` },
        ]}
        title={s.name}
        intro={s.intro}
        actions={<Button href="/request-quote">Request a quote</Button>}
      />

      <section className="surface-ivory pb-20 md:pb-28">
        <div className="container-site grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h2 className="text-h3">What we coordinate</h2>
            <ul className="mt-6 flex flex-col border-t border-line">
              {s.weCoordinate.map((x) => (
                <li key={x} className="flex items-start gap-3 border-b border-line py-4">
                  <Icon name="check" size={20} className="mt-0.5 shrink-0 text-leaf-700" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card bg-mist-100 p-6 md:p-8">
            <h2 className="text-h3">What you provide</h2>
            <ul className="mt-6 flex flex-col gap-3">
              {s.youProvide.map((x) => (
                <li key={x} className="flex items-start gap-3">
                  <Icon name="arrowRight" size={20} className="mt-0.5 shrink-0 text-navy-900" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="related-cat-title" className="bg-ivory-100 py-20 md:py-24">
        <div className="container-site">
          <h2 id="related-cat-title" className="text-h3">
            Often used with
          </h2>
          <ul className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((c) => (
              <li key={c.slug}>
                <CategoryTile category={c} aspect="4 / 3" size="sm" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="other-services-title" className="surface-ivory py-20 md:py-24">
        <div className="container-site">
          <h2 id="other-services-title" className="text-h3">
            Other services
          </h2>
          <ul className="mt-6 grid gap-x-8 border-t border-line sm:grid-cols-2 lg:grid-cols-3">
            {others.map((o) => (
              <li key={o.slug} className="border-b border-line">
                <Link href={`/services/${o.slug}`} className="group flex min-h-14 items-center gap-3 py-3 text-navy-900">
                  <Icon name={o.icon} className="shrink-0 text-leaf-700" />
                  <span className="font-medium group-hover:underline group-hover:underline-offset-4">{o.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
