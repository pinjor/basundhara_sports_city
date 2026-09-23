import type { Metadata } from "next";
import Link from "next/link";
import { CTABanner } from "@/components/sections/CTABanner";
import { PageHero } from "@/components/sections/PageHero";
import { Icon } from "@/components/ui/Icon";
import { services } from "@/content/services";

export const metadata: Metadata = {
  title: "Export and sourcing services",
  description:
    "Export, global sourcing, OEM and private label, product development, packaging, quality coordination, documentation and shipment from Bangladesh.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "Services", href: "/services" }]}
        title="Services around the product"
        intro="Buying from Bangladesh is mostly coordination. These are the parts of the order we take on for you, from the first specification to the shipment leaving port."
      />
      <section aria-label="Services" className="surface-ivory pb-20 md:pb-28">
        <div className="container-site">
          <ul className="grid border-t border-line md:grid-cols-2">
            {services.map((s, i) => (
              <li key={s.slug} className={`border-b border-line ${i % 2 === 0 ? "md:border-e md:pe-10" : "md:ps-10"}`}>
                <Link href={`/services/${s.slug}`} className="group flex gap-5 py-8">
                  <Icon name={s.icon} size={28} className="mt-1 shrink-0 text-leaf-700" />
                  <span>
                    <span className="block font-display text-h3 font-semibold text-navy-900 group-hover:underline group-hover:underline-offset-4">{s.name}</span>
                    <span className="mt-2 block text-ink-600">{s.summary}</span>
                  </span>
                </Link>
              </li>
            ))}
            <li className="border-b border-line md:ps-10">
              <Link href="/how-we-work" className="group flex gap-5 py-8">
                <Icon name="fibre" size={28} className="mt-1 shrink-0 text-leaf-700" />
                <span>
                  <span className="block font-display text-h3 font-semibold text-navy-900 group-hover:underline group-hover:underline-offset-4">How we work</span>
                  <span className="mt-2 block text-ink-600">The ten steps from your inquiry to repeat supply.</span>
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </section>
      <CTABanner />
    </>
  );
}
