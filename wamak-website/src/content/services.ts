import type { IconName } from "@/components/ui/Icon";
import type { CategorySlug } from "./categories";

export type Service = {
  slug: string;
  name: string;
  summary: string;
  icon: IconName;
  intro: string;
  /** What WAMAK coordinates. Coordination, never guarantees. */
  weCoordinate: string[];
  /** What the buyer provides. */
  youProvide: string[];
  relatedCategories: CategorySlug[];
  metaDescription: string;
};

/** Service pages. Summaries describe coordination, never guarantees. */
export const services: Service[] = [
  {
    slug: "export",
    name: "Export from Bangladesh",
    summary: "Bangladesh-origin products matched to your requirement and coordinated through to shipment.",
    icon: "ship",
    intro:
      "We connect international buyers with suitable Bangladesh-origin products and coordinate the export requirements: from the first specification to goods leaving port on the agreed terms.",
    weCoordinate: ["Matching your requirement to suitable producers", "Samples and specification sign-off", "Production or procurement follow-up", "Quality checks against the agreed specification", "Export packing and marking", "Export documentation and freight coordination"],
    youProvide: ["Product and specification", "Quantity and delivery window", "Destination port or airport and preferred Incoterm", "Import requirements in your country"],
    relatedCategories: ["jute-eco-friendly", "handicrafts-home-decor", "sisal-natural-fibre"],
    metaDescription: "Export from Bangladesh with WAMAK GROUP: product matching, samples, quality, packing, export documentation and shipment coordination for B2B buyers.",
  },
  {
    slug: "global-sourcing",
    name: "Global sourcing",
    summary: "Send a specification, quantity and target price, and we assess and source it for you.",
    icon: "globe",
    intro:
      "Send us your specification, quantity, target price and packaging needs. We assess the sourcing opportunity, identify suitable manufacturers and producers in Bangladesh and tell you plainly what is feasible.",
    weCoordinate: ["Supplier identification and assessment", "Supplier communication in your place", "Price negotiation", "Sample coordination", "Specification development", "Import sourcing of selected products for the Bangladesh market"],
    youProvide: ["Specification, drawings, photos or a reference sample", "Target quantity and price, if known", "Packaging and labelling needs", "Destination and timing"],
    relatedCategories: ["customized-sourcing", "handicrafts-home-decor", "loofah-bath"],
    metaDescription: "Bangladesh sourcing company for international buyers: supplier identification, negotiation, samples and specification development to your brief.",
  },
  {
    slug: "oem-private-label",
    name: "OEM & private label",
    summary: "Branding, labelling and private-label production arranged with manufacturing partners.",
    icon: "customize",
    intro:
      "For suitable products and quantities, we arrange production under your brand with manufacturing partners: your design, your logo, your labels and your retail packaging.",
    weCoordinate: ["Checking private-label feasibility per product and quantity", "Artwork, logo, labels, hangtags and barcodes", "Retail and gift packaging", "Pre-production samples for approval", "Consistency checks across the order"],
    youProvide: ["Brand artwork and guidelines", "Label and barcode data", "Target quantities per SKU", "Retail packaging requirements for your market"],
    relatedCategories: ["loofah-bath", "jute-eco-friendly", "customized-sourcing"],
    metaDescription: "OEM and private-label sourcing in Bangladesh: jute bags, loofah and bath products and home goods packed under your brand, subject to product and quantity.",
  },
  {
    slug: "product-development",
    name: "Product development",
    summary: "Specifications, samples and adjustments worked through before an order is confirmed.",
    icon: "sample",
    intro:
      "Many products need adjusting before they suit your market. We work through specifications and samples with producers, so that what you confirm is what can be made, and made consistently.",
    weCoordinate: ["Turning your brief into a written specification", "Material and finish options from producers", "Samples and revisions", "Feasibility and cost feedback before ordering"],
    youProvide: ["Reference images, sketches or samples", "Target market and use", "Must-have and nice-to-have requirements", "Feedback on each sample round"],
    relatedCategories: ["handicrafts-home-decor", "jute-eco-friendly", "customized-sourcing"],
    metaDescription: "Product development in Bangladesh: specifications, samples and revisions coordinated with producers before you confirm an order.",
  },
  {
    slug: "packaging",
    name: "Customized packaging",
    summary: "Retail, gift and export packaging coordinated to your market and brand.",
    icon: "package",
    intro:
      "Packaging decides how goods arrive and how they sell. We coordinate retail packs, gift packs and export cartons to your market's requirements and your brand.",
    weCoordinate: ["Retail packs, sleeves, hangtags and labels", "Gift packs and sets", "Barcodes and carton marks", "Export cartons and protective packing"],
    youProvide: ["Artwork and label information", "Units per pack and per carton", "Market-specific labelling rules", "Pallet or container requirements"],
    relatedCategories: ["loofah-bath", "jute-eco-friendly", "handicrafts-home-decor"],
    metaDescription: "Customized packaging for Bangladesh-sourced products: retail and gift packs, labels, barcodes and export cartons coordinated to your market.",
  },
  {
    slug: "quality-coordination",
    name: "Quality & inspection coordination",
    summary: "Products checked against the agreed specification before packing and dispatch.",
    icon: "quality",
    intro:
      "We coordinate quality checks against the specification you approved, before goods are packed and dispatched. Where you require it, third-party inspection can be arranged.",
    weCoordinate: ["Agreeing checkpoints and tolerances in writing", "In-process and pre-shipment checks", "Photo and written reports", "Third-party inspection on request"],
    youProvide: ["Approved specification or golden sample", "Acceptable tolerances", "Inspection standard or agency, if required"],
    relatedCategories: ["jute-eco-friendly", "sisal-natural-fibre", "agriculture"],
    metaDescription: "Quality and inspection coordination for Bangladesh sourcing: checks against the agreed specification, reports, and third-party inspection on request.",
  },
  {
    slug: "documentation-shipment",
    name: "Documentation & shipment",
    summary: "Export documentation support and freight coordination to your port or airport.",
    icon: "document",
    intro:
      "We prepare the commercial and export documents for each shipment with you and coordinate freight to your port or airport on the agreed Incoterm.",
    weCoordinate: ["Commercial invoice and packing list", "Other export documents required for the product and destination", "Freight booking coordination", "Shipment tracking updates"],
    youProvide: ["Consignee and notify party details", "Documents your customs authority requires", "Preferred forwarder, if you have one", "Delivery port or airport"],
    relatedCategories: ["seafood", "agriculture", "jute-eco-friendly"],
    metaDescription: "Export documentation support and shipment coordination from Bangladesh to your port or airport, on EXW, FOB, CFR, CIF or agreed terms.",
  },
];

export const getService = (slug: string) => services.find((s) => s.slug === slug);
