import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { DraftBadge } from "@/components/ui/DraftBadge";
import { Prose } from "@/components/ui/Prose";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Terms for using the WAMAK GROUP website.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <PageHero crumbs={[{ name: "Terms", href: "/terms" }]} title="Terms of use" intro="The terms that apply when you use this website." divider={false} />
      <section className="surface-ivory pb-20 md:pb-28">
        <div className="container-site">
          <DraftBadge>[DRAFT — REQUIRES LEGAL REVIEW BEFORE LAUNCH]</DraftBadge>
          <Prose>
            <h2>Information on this website</h2>
            <p>Product descriptions and images on this website are for general information. They are not an offer to sell. Specifications, minimum order quantities, availability and prices are confirmed only in a written quotation.</p>
            <p>Some images are placeholders until product photography is available, and are labelled as such.</p>
            <h2>Quotations and orders</h2>
            <p>A request for quotation does not create an obligation for either party. Orders are subject to a written quotation, confirmed specifications and agreed commercial and payment terms.</p>
            <h2>Regulated products</h2>
            <p>Agricultural products and seafood are subject to seasonal availability and to the import regulations of the destination country. Eligibility is reviewed for each inquiry.</p>
            <h2>Intellectual property</h2>
            <p>The {site.name} name and logo belong to {site.name}. Don&apos;t reuse them without written permission.</p>
            <h2>Contact</h2>
            <p>
              Questions about these terms: <a href={`mailto:${site.email}`}>{site.email}</a>.
            </p>
          </Prose>
        </div>
      </section>
    </>
  );
}
