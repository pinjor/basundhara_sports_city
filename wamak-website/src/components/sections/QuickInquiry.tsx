import { QuickInquiryForm } from "@/components/forms/QuickInquiryForm";
import { home } from "@/content/home";
import { site } from "@/content/site";

export function QuickInquiry() {
  const q = home.quick;
  return (
    <section aria-labelledby="quick-title" className="bg-mist-100 py-20 md:py-28">
      <div className="container-site grid-site gap-y-10">
        <div className="col-span-full lg:col-span-4">
          <h2 id="quick-title" className="text-h1">
            {q.title}
          </h2>
          <p className="mt-6 measure text-body-l text-ink-600">{q.body}</p>
          <p className="mt-6 text-ink-600">
            Prefer email? Write to{" "}
            <a href={`mailto:${site.email}`} className="font-medium text-leaf-700 underline decoration-leaf-700/50 underline-offset-4 hover:decoration-leaf-700">
              {site.email}
            </a>
            .
          </p>
        </div>
        <div className="col-span-full rounded-card bg-white p-6 md:p-10 lg:col-span-7 lg:col-start-6">
          <QuickInquiryForm cta={q.cta} />
        </div>
      </div>
    </section>
  );
}
