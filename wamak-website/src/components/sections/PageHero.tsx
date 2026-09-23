import type { ReactNode } from "react";
import { FibreThread } from "@/components/brand/FibreThread";
import { ManifestImage } from "@/components/brand/ManifestImage";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import type { Crumb } from "@/lib/schema";

type Props = {
  crumbs: Crumb[];
  title: ReactNode;
  intro?: ReactNode;
  /** Buttons or links under the intro. */
  actions?: ReactNode;
  /** Optional image slot id from the manifest. */
  imageId?: string;
  /** Show the fibre-thread divider under the hero. */
  divider?: boolean;
};

/** Standard inner-page hero: breadcrumbs, H1, intro, optional image. */
export function PageHero({ crumbs, title, intro, actions, imageId, divider = true }: Props) {
  return (
    <section className="surface-ivory pt-8 md:pt-12">
      <div className="container-site">
        <Breadcrumbs items={crumbs} />
        <div className="grid-site mt-10 items-end gap-y-10 md:mt-14">
          <div className={imageId ? "col-span-full lg:col-span-6" : "col-span-full lg:col-span-8"}>
            <h1 className="text-h1">{title}</h1>
            {intro && <div className="mt-6 measure text-body-l text-ink-600">{intro}</div>}
            {actions && <div className="mt-10 flex flex-wrap items-center gap-4">{actions}</div>}
          </div>
          {imageId && (
            <div className="col-span-full md:col-span-6 md:col-start-2 lg:col-span-5 lg:col-start-8">
              <ManifestImage id={imageId} aspect="5 / 4" className="rounded-card" priority />
            </div>
          )}
        </div>
      </div>
      {divider && <FibreThread variant="divider" tone="jute" className="mt-14 h-12 w-full md:mt-20" />}
      <div aria-hidden="true" className="h-14 md:h-20" />
    </section>
  );
}
