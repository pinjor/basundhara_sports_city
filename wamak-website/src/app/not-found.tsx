import type { Metadata } from "next";
import { FibreThread } from "@/components/brand/FibreThread";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { TextLink } from "@/components/ui/TextLink";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/** Designed 404. Rendered in the root layout, so it brings its own header and footer. */
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="surface-ivory relative overflow-hidden">
        <div className="container-site grid-site min-h-[70dvh] items-center gap-y-8 py-20">
          <div className="col-span-full lg:col-span-7">
            <p className="font-display text-h3 font-semibold text-jute-700">404</p>
            <h1 className="mt-4 text-h1">This thread doesn&apos;t lead anywhere.</h1>
            <p className="mt-6 measure text-body-l text-ink-600">
              The page you were looking for has moved or doesn&apos;t exist. The products and the quote form are
              still exactly where they should be.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button href="/products">Browse products</Button>
              <Button href="/request-quote" variant="secondary">
                Request a quote
              </Button>
              <TextLink href="/" className="inline-flex min-h-11 items-center sm:ms-2">
                Back to the homepage
              </TextLink>
            </div>
          </div>
        </div>
        <FibreThread variant="short" tone="jute" className="pointer-events-none absolute end-[-4rem] bottom-16 hidden h-24 w-[40rem] opacity-80 lg:block" />
      </main>
      <Footer />
    </>
  );
}
