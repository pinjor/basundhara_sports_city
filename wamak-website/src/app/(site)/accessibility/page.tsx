import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Prose } from "@/components/ui/Prose";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "WAMAK GROUP's accessibility statement for this website.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return (
    <>
      <PageHero crumbs={[{ name: "Accessibility", href: "/accessibility" }]} title="Accessibility" intro="We want every buyer to be able to use this website, whatever device or assistive technology they use." divider={false} />
      <section className="surface-ivory pb-20 md:pb-28">
        <div className="container-site">
          <Prose>
            <h2>Our standard</h2>
            <p>This website is designed to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA.</p>
            <h2>What we have done</h2>
            <ul>
              <li>Colour contrast is checked for every text and interface colour pairing.</li>
              <li>Menus, the RFQ list, image viewer, accordions and forms work with a keyboard, with a visible focus outline.</li>
              <li>Form fields have visible labels, and errors are described in text and announced to screen readers.</li>
              <li>Images have text alternatives, and decorative graphics are hidden from assistive technology.</li>
              <li>Animation is reduced when your device asks for reduced motion.</li>
              <li>Pages work when zoomed to 200% and on small screens.</li>
              <li>Pages are tested with automated accessibility checks during development.</li>
            </ul>
            <h2>Tell us about a problem</h2>
            <p>
              If something on this website is hard to use, email <a href={`mailto:${site.email}`}>{site.email}</a>. Tell us the page and what
              happened, and we&apos;ll respond and fix it.
            </p>
          </Prose>
        </div>
      </section>
    </>
  );
}
