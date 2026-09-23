import type { Metadata } from "next";
import { CTABanner } from "@/components/sections/CTABanner";
import { PageHero } from "@/components/sections/PageHero";
import { ProcessThread } from "@/components/sections/ProcessThread";
import { Button } from "@/components/ui/Button";
import { howWeWork } from "@/content/pages";

export const metadata: Metadata = {
  title: "How we work",
  description: "The ten steps from your inquiry to long-term supply, and what you provide at each stage when sourcing from Bangladesh with WAMAK GROUP.",
  alternates: { canonical: "/how-we-work" },
};

export default function HowWeWorkPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "How we work", href: "/how-we-work" }]}
        title="From your first message to repeat supply"
        intro={howWeWork.intro}
        actions={<Button href="/request-quote">Start with a requirement</Button>}
        divider={false}
      />
      <div className="-mt-28 md:-mt-40">
        <ProcessThread
          title="The sequence"
          intro="Samples, packaging and private label slot in where your product needs them."
          link={{ label: "Commercial terms and ordering", href: "/commercial-terms" }}
          steps={howWeWork.steps}
        />
      </div>
      <CTABanner />
    </>
  );
}
