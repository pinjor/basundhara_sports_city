import type { Metadata } from "next";
import { CTABanner } from "@/components/sections/CTABanner";
import { LeadershipBlock } from "@/components/sections/LeadershipBlock";
import { PageHero } from "@/components/sections/PageHero";
import { Button } from "@/components/ui/Button";
import { about } from "@/content/pages";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "About WAMAK GROUP",
  description:
    "WAMAK GROUP is a Dhaka-based exporter, importer, international trader and sourcing partner connecting Bangladesh-origin products with B2B buyers worldwide.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "About", href: "/about" }]}
        title={site.brandLine}
        intro={about.intro}
        imageId="sourcing-chapter"
        actions={
          <>
            <Button href="/why-wamak">Why WAMAK</Button>
            <Button href="/contact" variant="secondary">
              Contact us
            </Button>
          </>
        }
      />

      <section aria-labelledby="profile-title" className="surface-ivory pb-20 md:pb-28">
        <div className="container-site grid-site gap-y-8">
          <h2 id="profile-title" className="col-span-full text-h2 lg:col-span-4">
            Company profile
          </h2>
          <div className="col-span-full lg:col-span-7 lg:col-start-6">
            {about.profile.map((p) => (
              <p key={p.slice(0, 24)} className="mt-5 first:mt-0 measure text-body-l text-ink-600">
                {p}
              </p>
            ))}
            <dl className="mt-10 grid gap-x-8 border-t border-line sm:grid-cols-2">
              {[
                ["Head office", "West Dhanmondi, Dhaka, Bangladesh"],
                ["Business", "Export, import, international trading and sourcing"],
                ["Model", "B2B and wholesale"],
                ["Leadership", site.leadership.map((l) => `${l.name} (${l.role})`).join("; ")],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-line py-4">
                  <dt className="text-small text-ink-600">{k}</dt>
                  <dd className="mt-1 font-medium text-navy-900">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section aria-label="Mission and vision" className="surface-navy py-20 md:py-28">
        <div className="container-site grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h2 className="text-small font-semibold text-jute-300">Mission</h2>
            <p className="mt-4 font-display text-h3 font-medium text-ivory-50">{about.mission}</p>
          </div>
          <div>
            <h2 className="text-small font-semibold text-jute-300">Vision</h2>
            <p className="mt-4 font-display text-h3 font-medium text-ivory-50">{about.vision}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="values-title" className="surface-ivory py-20 md:py-28">
        <div className="container-site">
          <h2 id="values-title" className="text-h2">
            How we work together
          </h2>
          <dl className="mt-12 grid gap-x-12 md:grid-cols-2 lg:grid-cols-3">
            {about.values.map((v) => (
              <div key={v.name} className="border-t border-line py-6">
                <dt className="font-display text-[1.375rem] font-semibold text-navy-900">{v.name}</dt>
                <dd className="mt-2 text-ink-600">{v.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <LeadershipBlock />
      <CTABanner />
    </>
  );
}
