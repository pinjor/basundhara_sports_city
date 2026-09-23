import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm } from "@/components/forms/ContactForm";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { EmailLink } from "@/components/ui/EmailLink";
import { Icon } from "@/components/ui/Icon";
import { PENDING, site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact WAMAK GROUP in West Dhanmondi, Dhaka, Bangladesh. Email ${site.email}, or send a message or a request for quotation.`,
  alternates: { canonical: "/contact" },
};

const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${site.address.streetAddress}, Dhaka ${site.address.postalCode}, Bangladesh`,
)}`;

export default function ContactPage() {
  return (
    <section className="surface-ivory pt-8 pb-20 md:pt-12 md:pb-28">
      <div className="container-site">
        <Breadcrumbs items={[{ name: "Contact", href: "/contact" }]} />
        <div className="grid-site mt-10 gap-y-12 md:mt-14">
          <div className="col-span-full lg:col-span-5">
            <h1 className="text-h1">Contact WAMAK GROUP</h1>
            <p className="mt-6 measure text-body-l text-ink-600">
              For prices and availability, the quickest route is a request for quotation. For anything else, write to us
              and we&apos;ll reply by email.
            </p>
            <div className="mt-8">
              <Button href="/request-quote">Request a quote</Button>
            </div>

            <dl className="mt-12 flex flex-col border-t border-line">
              <div className="relative border-b border-line py-5 ps-10">
                <dt className="text-small text-ink-600">
                  <Icon name="mail" className="absolute start-0 top-5 text-leaf-700" />
                  Email
                </dt>
                <dd className="mt-1">
                  <EmailLink email={site.email} location="contact_page" className="font-medium text-navy-900 underline decoration-leaf-700/50 underline-offset-4 hover:decoration-leaf-700" />
                </dd>
              </div>
              <div className="relative border-b border-line py-5 ps-10">
                <dt className="text-small text-ink-600">
                  <Icon name="phone" className="absolute start-0 top-5 text-leaf-700" />
                  Phone
                </dt>
                <dd className="mt-1 text-ink-900">{PENDING.phone}</dd>
            </div>
            <div className="relative border-b border-line py-5 ps-10">
              <dt className="text-small text-ink-600">
                <Icon name="pin" className="absolute start-0 top-5 text-leaf-700" />
                Office
              </dt>
                <dd className="mt-1 not-italic text-ink-900">
                  <address className="not-italic">
                    {site.name}
                    {site.address.lines.map((l) => (
                      <span key={l} className="block">
                        {l}
                      </span>
                    ))}
                  </address>
                </dd>
              </div>
              <div className="relative border-b border-line py-5 ps-10">
                <dt className="text-small text-ink-600">
                  <Icon name="info" className="absolute start-0 top-5 text-leaf-700" />
                  Office hours
                </dt>
                <dd className="mt-1 text-ink-900">{PENDING.officeHours}</dd>
            </div>
          </dl>

            {/* Lightweight location card instead of a heavy embedded map. */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="surface-navy group mt-8 flex items-center justify-between gap-6 rounded-card p-6 transition-colors hover:bg-navy-800"
            >
              <span>
                <span className="block font-display font-semibold text-ivory-50">West Dhanmondi, Dhaka</span>
                <span className="mt-1 block text-small text-navy-200">Open the office location in Google Maps</span>
              </span>
              <Icon name="external" className="shrink-0 text-jute-300" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>

          <div className="col-span-full rounded-card bg-white p-6 ring-1 ring-line sm:p-8 lg:col-span-6 lg:col-start-7 lg:p-10">
            <h2 className="text-h3">Send a message</h2>
            <div className="mt-8">
              <Suspense fallback={<p className="text-ink-600">Loading the form…</p>}>
                <ContactForm />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
