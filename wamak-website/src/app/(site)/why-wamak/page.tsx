import type { Metadata } from "next";
import { CTABanner } from "@/components/sections/CTABanner";
import { PageHero } from "@/components/sections/PageHero";
import { SourcingChapter } from "@/components/sections/SourcingChapter";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { whyPage } from "@/content/pages";

export const metadata: Metadata = {
  title: "Why WAMAK",
  description:
    "Why international buyers source from Bangladesh with WAMAK GROUP: supply access, one partner across categories, sourcing to your brief, private label, packaging and clear communication.",
  alternates: { canonical: "/why-wamak" },
};

export default function WhyPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "Why WAMAK", href: "/why-wamak" }]}
        title="A sourcing partner you can rely on in Bangladesh"
        intro={whyPage.intro}
        actions={
          <>
            <Button href="/request-quote">Request a quote</Button>
            <Button href="/contact" variant="secondary">
              Contact us
            </Button>
          </>
        }
      />
      <section aria-label="Reasons" className="surface-ivory pb-20 md:pb-28">
        <div className="container-site">
          <ul className="grid gap-x-12 md:grid-cols-2">
            {whyPage.reasons.map((r) => (
              <li key={r.title} className="flex gap-5 border-t border-line py-8">
                <Icon name={r.icon as IconName} size={28} className="mt-1 shrink-0 text-leaf-700" />
                <div>
                  <h2 className="text-[1.375rem] leading-tight font-semibold tracking-[-0.015em]">{r.title}</h2>
                  <p className="mt-2 measure text-ink-600">{r.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <SourcingChapter />
      <section aria-labelledby="audiences-title" className="surface-ivory py-20 md:py-28">
        <div className="container-site grid-site gap-y-8">
          <h2 id="audiences-title" className="col-span-full text-h2 lg:col-span-4">
            Who we work with
          </h2>
          <ul className="col-span-full flex flex-wrap gap-2 lg:col-span-8">
            {whyPage.audiences.map((a) => (
              <li key={a} className="rounded-full border border-line bg-white px-4 py-2 text-navy-900">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <CTABanner />
    </>
  );
}
