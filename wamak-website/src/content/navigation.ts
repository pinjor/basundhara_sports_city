import { categories } from "./categories";
import { services } from "./services";

export type NavLink = { label: string; href: string };

export const primaryNav = {
  products: { label: "Products", href: "/products" },
  links: [
    { label: "Services", href: "/services" },
    { label: "Why WAMAK", href: "/why-wamak" },
    { label: "Global markets", href: "/global-markets" },
    { label: "About", href: "/about" },
  ] satisfies NavLink[],
  resources: {
    label: "Resources",
    items: [
      { label: "Product catalogue", href: "/resources/catalogue" },
      { label: "Gallery", href: "/resources/gallery" },
      { label: "Frequently asked questions", href: "/resources/faq" },
      { label: "Commercial terms & ordering", href: "/commercial-terms" },
    ] satisfies NavLink[],
  },
  contact: { label: "Contact", href: "/contact" },
  cta: { label: "Request a quote", href: "/request-quote" },
};

export const categoryHref = (slug: string) => `/products/${slug}`;
export const productHref = (category: string, slug: string) => `/products/${category}/${slug}`;

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Products",
    links: [
      ...categories.map((c) => ({ label: c.name, href: categoryHref(c.slug) })),
      { label: "All products", href: "/products" },
    ],
  },
  {
    title: "Services",
    links: [
      ...services.map((s) => ({ label: s.name, href: `/services/${s.slug}` })),
      { label: "How we work", href: "/how-we-work" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About WAMAK GROUP", href: "/about" },
      { label: "Leadership", href: "/about/leadership" },
      { label: "Why WAMAK", href: "/why-wamak" },
      { label: "Global markets", href: "/global-markets" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Product catalogue", href: "/resources/catalogue" },
      { label: "Gallery", href: "/resources/gallery" },
      { label: "FAQ", href: "/resources/faq" },
      { label: "Commercial terms", href: "/commercial-terms" },
      { label: "Request a quote", href: "/request-quote" },
    ],
  },
];

export const legalNav: NavLink[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Accessibility", href: "/accessibility" },
];
