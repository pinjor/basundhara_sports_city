import { ManifestImage } from "@/components/brand/ManifestImage";
import { Button } from "@/components/ui/Button";
import { home } from "@/content/home";

export function CatalogueCTA() {
  const c = home.catalogue;
  return (
    <section aria-labelledby="catalogue-title" className="surface-ivory pb-20 md:pb-28">
      <div className="container-site">
        <div className="grid overflow-hidden rounded-card md:grid-cols-12">
          <ManifestImage id="catalogue" aspect="auto" className="aspect-[4/3] md:col-span-5 md:aspect-auto md:min-h-[26rem]" caption={false} />
          <div className="surface-navy flex flex-col justify-center gap-6 p-8 md:col-span-7 md:p-14">
            <h2 id="catalogue-title" className="text-h2">
              {c.title}
            </h2>
            <p className="measure text-body-l text-navy-200">{c.body}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Button href="/resources/catalogue" variant="inverse" icon="download">
                {c.download}
              </Button>
              <Button href="/contact?topic=catalogue" variant="inverse-secondary">
                {c.request}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
