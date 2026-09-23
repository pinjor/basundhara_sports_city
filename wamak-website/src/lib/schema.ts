import { site } from "@/content/site";

/** Canonical origin. Falls back to a relative-safe placeholder until the domain is confirmed. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const absolute = (path: string) => `${siteUrl}${path}`;

export type Crumb = { name: string; href: string };

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absolute(c.href),
    })),
  };
}

/** Organization schema: verified fields only (no phone until confirmed). */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    slogan: site.brandLine,
    email: site.email,
    url: siteUrl,
    logo: absolute("/brand/wamak-logo.png"),
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.streetAddress,
      addressLocality: site.address.locality,
      postalCode: site.address.postalCode,
      addressCountry: site.address.countryCode,
    },
    employee: site.leadership.map((p) => ({ "@type": "Person", name: p.name, jobTitle: p.role })),
  };
}
