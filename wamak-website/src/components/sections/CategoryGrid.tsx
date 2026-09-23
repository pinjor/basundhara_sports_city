import Link from "next/link";
import { CategoryTile } from "@/components/product/CategoryTile";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { categories, getCategory } from "@/content/categories";
import { home } from "@/content/home";
import { categoryHref } from "@/content/navigation";

/**
 * Editorial division grid. Sizes are deliberately unequal: two lead ranges,
 * three mid tiles, two regulated food ranges, and a distinct navy tile for
 * customized sourcing. Aspect ratios are paired so rows share a height.
 */
export function CategoryGrid() {
  const c = (slug: string) => getCategory(slug)!;
  const sourcing = categories.find((x) => x.kind === "sourcing")!;
  const d = home.divisions;

  return (
    <section aria-labelledby="divisions-title" className="surface-ivory py-20 md:py-28">
      <div className="container-site">
        <div className="grid-site mb-12 gap-y-4 md:mb-16">
          <h2 id="divisions-title" className="col-span-full text-h2 lg:col-span-7">
            {d.title}
          </h2>
          <p className="col-span-full measure text-body-l text-ink-600 lg:col-span-4 lg:col-start-9 lg:self-end">{d.intro}</p>
        </div>

        <div className="grid-site gap-y-10 sm:gap-y-14">
          {/* Lead pair shares one image height on desktop so the names align. */}
          <CategoryTile category={c("jute-eco-friendly")} size="lg" aspect="4 / 5" imageClassName="aspect-[4/5] md:aspect-[4/5] lg:aspect-auto lg:h-[min(46vw,36rem)]" className="col-span-full md:col-span-4 lg:col-span-7" />
          <CategoryTile category={c("handicrafts-home-decor")} size="lg" aspect="4 / 5" imageClassName="aspect-[4/5] lg:aspect-auto lg:h-[min(46vw,36rem)]" className="col-span-full md:col-span-4 lg:col-span-5" />

          <CategoryTile category={c("sisal-natural-fibre")} aspect="1 / 1" className="col-span-full sm:col-span-2 md:col-span-4 lg:col-span-4" size="sm" compactOnMobile />
          <CategoryTile category={c("loofah-bath")} aspect="1 / 1" className="col-span-full sm:col-span-2 md:col-span-4 lg:col-span-4" size="sm" compactOnMobile />
          <CategoryTile category={c("art-paintings")} aspect="1 / 1" className="col-span-full sm:col-span-2 md:col-span-4 lg:col-span-4" size="sm" compactOnMobile />

          <CategoryTile category={c("agriculture")} aspect="4 / 5" className="col-span-full sm:col-span-2 md:col-span-4 lg:col-span-3" size="sm" compactOnMobile />
          <CategoryTile category={c("seafood")} aspect="4 / 5" className="col-span-full sm:col-span-2 md:col-span-4 lg:col-span-3" size="sm" compactOnMobile />

          <article className="surface-navy relative col-span-full flex flex-col justify-between gap-10 rounded-card p-8 md:p-10 lg:col-span-6">
            <div className="flex items-start justify-between gap-6">
              <p className="font-display text-small font-semibold text-jute-300">{sourcing.name}</p>
              <Icon name="customize" size={32} className="text-jute-300" />
            </div>
            <div>
              <h3 className="text-h2">
                <Link href={categoryHref(sourcing.slug)} className="after:absolute after:inset-0 after:rounded-card">
                  {d.customTitle}
                </Link>
              </h3>
              <p className="mt-4 max-w-md text-body-l text-navy-200">{d.customBody}</p>
            </div>
            <div className="relative z-10">
              <Button href="/request-quote?category=customized-sourcing" variant="inverse">
                {d.customCta}
              </Button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
