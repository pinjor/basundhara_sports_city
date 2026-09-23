import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { Prose } from "@/components/ui/Prose";
import { insights } from "@/content/proof";

/**
 * Insights article template. Not linked anywhere and returns 404 until
 * real articles are added to src/content/proof.ts.
 */
type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return insights.map((a) => ({ slug: a.slug }));
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const a = insights.find((x) => x.slug === slug);
  if (!a) notFound();
  return (
    <>
      <PageHero crumbs={[{ name: "Insights", href: `/insights/${a.slug}` }]} title={a.title} intro={a.summary} />
      <section className="surface-ivory pb-20">
        <div className="container-site">
          <Prose>
            {a.body.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </Prose>
        </div>
      </section>
    </>
  );
}
