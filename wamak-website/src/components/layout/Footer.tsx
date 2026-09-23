import Link from "next/link";
import { FibreThread } from "@/components/brand/FibreThread";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { footerNav, legalNav } from "@/content/navigation";
import { PENDING, site } from "@/content/site";

const footLink = "inline-block py-1.5 leading-snug text-navy-200 transition-colors hover:text-ivory-50 hover:underline hover:decoration-jute-300 hover:underline-offset-4";

export function Footer() {
  return (
    <footer className="surface-deep" aria-labelledby="footer-title">
      <h2 id="footer-title" className="sr-only">
        Site footer
      </h2>
      <div className="container-site">
        {/* Brand band */}
        <div className="grid-site items-end gap-y-8 border-b border-line-navy py-14 md:py-20">
          <div className="col-span-full flex flex-col gap-8 lg:col-span-7">
            <Logo height={64} surface="dark" />
            <p className="font-display text-h2 font-bold tracking-[-0.025em] text-ivory-50">{site.brandLine}</p>
          </div>
          <div className="col-span-full flex flex-wrap gap-3 lg:col-span-5 lg:justify-end">
            <Button href="/request-quote" variant="inverse">
              Request a quote
            </Button>
            <Button href="/resources/catalogue" variant="inverse-secondary" icon="download">
              Download catalogue
            </Button>
          </div>
        </div>

        {/* Details and navigation */}
        <div className="grid-site gap-y-12 py-14">
          <address className="col-span-full flex flex-col gap-6 not-italic lg:col-span-3">
            <div>
              <p className="font-display font-semibold text-ivory-50">{site.name}</p>
              <p className="mt-2 text-small leading-relaxed text-navy-200">
                {site.address.lines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </p>
            </div>
            <ul className="flex flex-col gap-1 text-small">
              <li>
                <a href={`mailto:${site.email}`} className={`${footLink} inline-flex items-center gap-2`}>
                  <Icon name="mail" size={18} className="text-jute-300" />
                  {site.email}
                </a>
              </li>
              <li className="inline-flex items-center gap-2 py-1.5 text-navy-200">
                <Icon name="phone" size={18} className="text-jute-300" />
                <span>{PENDING.phone}</span>
              </li>
            </ul>
          </address>

          <div className="col-span-full grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 lg:col-span-9">
          {footerNav.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="font-display text-[1rem] font-semibold text-ivory-50">{col.title}</h3>
              <ul className="mt-3 flex flex-col text-small">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={footLink}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          </div>
        </div>

        {/* Legal */}
        <div className="flex flex-col gap-4 border-t border-line-navy py-8 text-small text-navy-200 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. {site.campaignLine}.
          </p>
          <FibreThread variant="short" tone="jute" className="hidden h-6 w-40 md:block" />
          <ul className="flex flex-wrap gap-x-6">
            {legalNav.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={footLink}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
