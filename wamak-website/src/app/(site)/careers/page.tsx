import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { EmailLink } from "@/components/ui/EmailLink";
import { careers } from "@/content/pages";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Careers",
  description: "Working at WAMAK GROUP in Dhaka: international trade, sourcing, merchandising, quality, documentation and logistics.",
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return (
    <>
      <PageHero crumbs={[{ name: "Careers", href: "/careers" }]} title="Careers" intro={careers.intro} />
      <section className="surface-ivory pb-20 md:pb-28">
        <div className="container-site">
          <div className="max-w-2xl rounded-card bg-mist-100 p-8 md:p-10">
            <h2 className="text-h3">How to get in touch</h2>
            <p className="mt-4 text-ink-600">{careers.how}</p>
            <p className="mt-6">
              <EmailLink
                email={site.email}
                location="careers"
                className="inline-flex min-h-11 items-center font-display text-body-l font-semibold text-navy-900 underline decoration-leaf-700/50 underline-offset-4 hover:decoration-leaf-700"
              />
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
