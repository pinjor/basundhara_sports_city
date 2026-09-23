import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { DraftBadge } from "@/components/ui/DraftBadge";
import { Prose } from "@/components/ui/Prose";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How WAMAK GROUP uses the details you send through this website.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero crumbs={[{ name: "Privacy", href: "/privacy" }]} title="Privacy notice" intro="How we use the details you send us through this website." divider={false} />
      <section className="surface-ivory pb-20 md:pb-28">
        <div className="container-site">
          <DraftBadge>[DRAFT — REQUIRES LEGAL REVIEW BEFORE LAUNCH]</DraftBadge>
          <Prose>
            <h2>Who we are</h2>
            <p>
              {site.name}, {site.address.lines.join(", ")}. Contact: <a href={`mailto:${site.email}`}>{site.email}</a>.
            </p>
            <h2>What we collect</h2>
            <p>When you request a quote or send a message, we collect the details you enter, such as your name, company, business email, phone or WhatsApp number, country, product requirements and any file you upload.</p>
            <p>We also record which page you came from and any campaign tags in the link you followed (UTM parameters), so we understand which products buyers are interested in.</p>
            <p>If analytics are enabled, Google Analytics collects anonymised usage data such as pages viewed and actions taken. We do not send your name or email address to analytics.</p>
            <h2>Why we use it</h2>
            <ul>
              <li>To reply to your request and prepare a quotation.</li>
              <li>To follow up on an order or inquiry you started.</li>
              <li>To improve the website and our product information.</li>
            </ul>
            <p>We don&apos;t sell your details, and we don&apos;t add you to a marketing list without asking.</p>
            <h2>Who processes it</h2>
            <p>Form submissions are delivered by email through our email provider and, where configured, to our customer-relationship system. These providers act on our instructions.</p>
            <h2>How long we keep it</h2>
            <p>We keep inquiry records for as long as needed to respond and to maintain a business relationship, and then delete them. [Retention period to be confirmed.]</p>
            <h2>Your choices</h2>
            <p>You can ask us to see, correct or delete the details we hold about you by emailing <a href={`mailto:${site.email}`}>{site.email}</a>.</p>
            <h2>Storage in your browser</h2>
            <p>The site stores your RFQ list and form progress in your browser&apos;s session storage so they survive navigation. This data stays on your device and is cleared when you close the tab.</p>
          </Prose>
        </div>
      </section>
    </>
  );
}
