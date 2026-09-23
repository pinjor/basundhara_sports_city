import type { Metadata } from "next";
import Link from "next/link";
import { ManifestImage } from "@/components/brand/ManifestImage";
import { PageHero } from "@/components/sections/PageHero";
import { Button } from "@/components/ui/Button";
import { CatalogueDownload } from "@/components/ui/CatalogueDownload";
import { categories } from "@/content/categories";
import { categoryHref } from "@/content/navigation";
import { catalogue } from "@/content/pages";
import { PENDING } from "@/content/site";

export const metadata: Metadata = {
  title: "Product catalogue",
  description: "Download or request the WAMAK GROUP product catalogue: jute, handicrafts, sisal, loofah, art, agriculture, seafood and customized sourcing from Bangladesh.",
  alternates: { canonical: "/resources/catalogue" },
};

export default function CataloguePage() {
  const url = PENDING.catalogueUrl;
  return (
    <>
      <PageHero
        crumbs={[
          { name: "Resources", href: "/resources/catalogue" },
          { name: "Product catalogue", href: "/resources/catalogue" },
        ]}
        title="Explore the WAMAK GROUP product catalogue"
        intro={
          <>
            <p>{catalogue.intro}</p>
            {!url && <p className="mt-4">{catalogue.pending}</p>}
          </>
        }
        imageId="catalogue"
        actions={
          <>
            {url && <CatalogueDownload href={url} />}
            <Button href="/contact?topic=catalogue" variant={url ? "secondary" : "primary"}>
              Request the latest catalogue
            </Button>
          </>
        }
      />
      <section aria-labelledby="inside-title" className="surface-ivory pb-20 md:pb-28">
        <div className="container-site">
          <h2 id="inside-title" className="text-h2">
            What&apos;s inside
          </h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={categoryHref(c.slug)} className="group flex items-center gap-4 rounded-card border border-line bg-white p-3 hover:border-navy-900">
                  <span className="w-16 shrink-0 overflow-hidden rounded-control">
                    <ManifestImage id={c.imageId} aspect="1 / 1" caption={false} />
                  </span>
                  <span className="font-medium leading-snug text-navy-900 group-hover:underline group-hover:underline-offset-4">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
