import { Button } from "@/components/ui/Button";

type Props = {
  title?: string;
  body?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string } | null;
};

/** Closing call to action used at the end of inner pages. */
export function CTABanner({
  title = "Tell us what you need.",
  body = "Send your specification and quantity. We reply with questions or a quotation, not an automated price.",
  primary = { label: "Request a quote", href: "/request-quote" },
  secondary = { label: "Download catalogue", href: "/resources/catalogue" },
}: Props) {
  return (
    <section className="surface-ivory pb-20 md:pb-28">
      <div className="container-site">
        <div className="grid gap-8 rounded-card bg-mist-100 p-8 md:grid-cols-12 md:items-center md:p-12">
          <div className="md:col-span-7">
            <h2 className="text-h2">{title}</h2>
            <p className="mt-4 measure text-ink-600">{body}</p>
          </div>
          <div className="flex flex-wrap gap-3 md:col-span-5 md:justify-end">
            <Button href={primary.href}>{primary.label}</Button>
            {secondary && (
              <Button href={secondary.href} variant="secondary" icon={secondary.href.includes("catalogue") ? "download" : undefined}>
                {secondary.label}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
