import { ManifestImage } from "@/components/brand/ManifestImage";
import { home } from "@/content/home";

/** Full-bleed material image with an ivory text panel breaking into it. */
export function MaterialStory() {
  const m = home.material;
  return (
    <section aria-labelledby="material-title" className="surface-ivory pb-20 md:pb-28">
      <ManifestImage id="material-story" aspect="auto" captionPlacement="top-end" className="aspect-[4/5] w-full sm:aspect-[16/9] xl:aspect-[21/9]" />
      <div className="container-site grid-site">
        <div className="relative z-10 col-span-full -mt-24 bg-ivory-50 pt-10 pe-2 md:col-span-7 md:-mt-40 md:pe-10 lg:col-span-7 lg:pt-14 lg:pe-14">
          <h2 id="material-title" className="text-h1">
            {m.title}
          </h2>
          {m.body.map((para) => (
            <p key={para.slice(0, 20)} className="mt-6 measure text-body-l text-ink-600">
              {para}
            </p>
          ))}
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Materials">
            {m.materials.map((x) => (
              <li key={x} className="rounded-full border border-jute-300 px-4 py-1.5 text-small font-medium text-jute-700">
                {x}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
