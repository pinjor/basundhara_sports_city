import type { Metadata } from "next";
import { Suspense } from "react";
import { RfqWizard } from "@/components/forms/RfqWizard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Request a quote",
  description:
    "Send your product requirement to WAMAK GROUP in three short steps: product and quantity, delivery, and your details. We reply with questions or a quotation.",
  alternates: { canonical: "/request-quote" },
};

const next = [
  "We review your requirement, usually with a few clarifying questions.",
  "We identify suitable producers in Bangladesh and check feasibility.",
  "You receive a quotation with the commercial terms that apply.",
];

export default function RequestQuotePage() {
  return (
    <section className="surface-ivory pt-8 pb-20 md:pt-12 md:pb-28">
      <div className="container-site">
        <Breadcrumbs items={[{ name: "Request a quote", href: "/request-quote" }]} />
        <div className="grid-site mt-10 gap-y-10 md:mt-14">
          <div className="col-span-full lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <h1 className="text-h1">Request a quote</h1>
              <p className="mt-6 measure text-body-l text-ink-600">
                Three short steps. Only a few details are required. Add what you know and we&apos;ll ask about the rest.
              </p>
              <h2 className="mt-10 font-display text-[1.125rem] font-semibold">What happens next</h2>
              <ol className="mt-4 flex flex-col gap-4">
                {next.map((n, i) => (
                  <li key={n} className="flex gap-3 text-ink-600">
                    <span className="font-display font-semibold text-jute-700 tabular-nums">{i + 1}</span>
                    {n}
                  </li>
                ))}
              </ol>
              <p className="mt-10 flex items-start gap-3 border-t border-line pt-6 text-small text-ink-600">
                <Icon name="mail" size={20} className="shrink-0 text-leaf-700" />
                <span>
                  Prefer email? Send your requirement to{" "}
                  <a href={`mailto:${site.email}`} className="font-medium text-leaf-700 underline underline-offset-4">
                    {site.email}
                  </a>
                  .
                </span>
              </p>
            </div>
          </div>
          <div className="col-span-full rounded-card bg-white p-6 ring-1 ring-line sm:p-8 lg:col-span-7 lg:col-start-6 lg:p-10">
            <Suspense fallback={<p className="text-ink-600">Loading the form…</p>}>
              <RfqWizard />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
