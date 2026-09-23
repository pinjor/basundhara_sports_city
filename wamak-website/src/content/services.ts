import type { IconName } from "@/components/ui/Icon";

export type Service = {
  slug: string;
  name: string;
  summary: string;
  icon: IconName;
};

/** Service pages (Phase 5). Summaries describe coordination, never guarantees. */
export const services: Service[] = [
  { slug: "export", name: "Export from Bangladesh", summary: "Bangladesh-origin products matched to your requirement and coordinated through to shipment.", icon: "ship" },
  { slug: "global-sourcing", name: "Global sourcing", summary: "Send a specification, quantity and target price, and we assess and source it for you.", icon: "globe" },
  { slug: "oem-private-label", name: "OEM & private label", summary: "Branding, labelling and private-label production arranged with manufacturing partners.", icon: "customize" },
  { slug: "product-development", name: "Product development", summary: "Specifications, samples and adjustments worked through before an order is confirmed.", icon: "sample" },
  { slug: "packaging", name: "Customized packaging", summary: "Retail, gift and export packaging coordinated to your market and brand.", icon: "package" },
  { slug: "quality-coordination", name: "Quality & inspection coordination", summary: "Products checked against the agreed specification before packing and dispatch.", icon: "quality" },
  { slug: "documentation-shipment", name: "Documentation & shipment", summary: "Export documentation support and freight coordination to your port or airport.", icon: "document" },
];

export const getService = (slug: string) => services.find((s) => s.slug === slug);
