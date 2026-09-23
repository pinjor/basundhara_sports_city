import type { Metadata } from "next";
import { CapabilityStrip } from "@/components/sections/CapabilityStrip";
import { CatalogueCTA } from "@/components/sections/CatalogueCTA";
import { CategoryGrid } from "@/components/sections/CategoryGrid";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { Hero } from "@/components/sections/Hero";
import { LeadershipBlock } from "@/components/sections/LeadershipBlock";
import { MarketsMap } from "@/components/sections/MarketsMap";
import { MaterialStory } from "@/components/sections/MaterialStory";
import { ProcessThread } from "@/components/sections/ProcessThread";
import { ClientLogoWall, Metrics, Testimonials } from "@/components/sections/Proof";
import { QuickInquiry } from "@/components/sections/QuickInquiry";
import { SourcingChapter } from "@/components/sections/SourcingChapter";
import { WhyWamak } from "@/components/sections/WhyWamak";
import { home } from "@/content/home";

export const metadata: Metadata = {
  title: { absolute: home.meta.title },
  description: home.meta.description,
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <CapabilityStrip />
      <CategoryGrid />
      <SourcingChapter />
      <WhyWamak />
      {/* Proof blocks render nothing until verified data exists (src/content/proof.ts). */}
      <Metrics />
      <Testimonials />
      <ClientLogoWall />
      <FeaturedProducts />
      <MaterialStory />
      <ProcessThread />
      <MarketsMap />
      <LeadershipBlock />
      <CatalogueCTA />
      <QuickInquiry />
    </>
  );
}
