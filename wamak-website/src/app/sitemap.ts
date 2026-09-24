import type { MetadataRoute } from "next";
import { categories } from "@/content/categories";
import { categoryHref, productHref } from "@/content/navigation";
import { products } from "@/content/products";
import { caseStudies, insights } from "@/content/proof";
import { services } from "@/content/services";
import { absolute } from "@/lib/schema";

/** Every public, indexable route. Hidden templates appear only once they have content. */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "/",
    "/products",
    "/services",
    "/how-we-work",
    "/why-wamak",
    "/global-markets",
    "/commercial-terms",
    "/about",
    "/about/leadership",
    "/resources/catalogue",
    "/resources/gallery",
    "/resources/faq",
    "/careers",
    "/contact",
    "/request-quote",
    "/privacy",
    "/terms",
    "/accessibility",
  ];
  const routes = [
    ...staticRoutes,
    ...categories.map((c) => categoryHref(c.slug)),
    ...products.map((p) => productHref(p.category, p.slug)),
    ...services.map((s) => `/services/${s.slug}`),
    ...insights.map((a) => `/insights/${a.slug}`),
    ...caseStudies.map((c) => `/case-studies/${c.slug}`),
  ];
  const priority = (r: string) => (r === "/" ? 1 : r === "/request-quote" || r === "/products" ? 0.9 : r.startsWith("/products/") ? 0.8 : 0.6);
  return routes.map((r) => ({ url: absolute(r), changeFrequency: "monthly", priority: priority(r) }));
}
