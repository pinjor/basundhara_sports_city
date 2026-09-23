import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { Prose } from "@/components/ui/Prose";
import { caseStudies } from "@/content/proof";

/**
 * Case study template. Not linked anywhere and returns 404 until
 * real articles are added to src/content/proof.ts.
 */
type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return caseStudies.map((a) => ({ slug: a.slug }));
}

export default async function CaseStudyPage({ params }: Params) {
  const { slug } = await params;
  const a = caseStudies.find((x) => x.slug === slug);
  if (!a) notFound();
  return (
    <>
      <PageHero crumbs={[{ name: "Case studies", href: `/case-studies/${a.slug}` }]} title={a.title} intro={a.summary} />
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
