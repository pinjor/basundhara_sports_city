import type { Metadata } from "next";
import { Suspense } from "react";
import { FibreThread } from "@/components/brand/FibreThread";
import { ThankYouSummary } from "@/components/forms/ThankYouSummary";
import { Button } from "@/components/ui/Button";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Request received",
  robots: { index: false, follow: false },
};

const steps = [
  { title: "Requirement review", body: "We read your request and check the specification, quantity and destination." },
  { title: "Questions, if needed", body: "If anything is unclear, we'll email you before sourcing, not after." },
  { title: "Quotation", body: "You receive a quotation with the commercial terms, and samples where the product allows." },
];

export default function ThankYouPage() {
  return (
    <>
      <section className="surface-ivory pt-14 pb-16 md:pt-20">
        <div className="container-site grid-site gap-y-12">
          <div className="col-span-full lg:col-span-7">
            <h1 className="text-h1">Thank you. We&apos;ve received your request.</h1>
            <div className="mt-6">
              <Suspense>
                <ThankYouSummary />
              </Suspense>
            </div>
          </div>
          <aside aria-labelledby="next-title" className="col-span-full lg:col-span-4 lg:col-start-9">
            <h2 id="next-title" className="text-h3">
              What happens next
            </h2>
            <ol className="mt-6 flex flex-col border-t border-line">
              {steps.map((s, i) => (
                <li key={s.title} className="border-b border-line py-4">
                  <p className="flex gap-3 font-display font-semibold text-navy-900">
                    <span className="text-jute-700 tabular-nums">{i + 1}</span>
                    {s.title}
                  </p>
                  <p className="mt-1 ps-6 text-small text-ink-600">{s.body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-small text-ink-600">
              Questions in the meantime? Email{" "}
              <a href={`mailto:${site.email}`} className="font-medium text-leaf-700 underline underline-offset-4">
                {site.email}
              </a>{" "}
              and quote your reference.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/resources/catalogue" variant="secondary" icon="download">
                Download catalogue
              </Button>
              <Button href="/products" variant="secondary">
                Keep browsing
              </Button>
            </div>
          </aside>
        </div>
      </section>
      <FibreThread variant="divider" tone="jute" className="h-12 w-full" />
    </>
  );
}
