import type { MaterialVariant } from "@/components/brand/MaterialPlaceholder";

/**
 * The eight product divisions. Product ranges come from the client's
 * company brief (assets/company-brief.docx). No specifications, MOQs or
 * prices are stated anywhere — those are confirmed per quotation.
 */

export const categorySlugs = [
  "jute-eco-friendly",
  "handicrafts-home-decor",
  "sisal-natural-fibre",
  "loofah-bath",
  "art-paintings",
  "agriculture",
  "seafood",
  "customized-sourcing",
] as const;

export type CategorySlug = (typeof categorySlugs)[number];

export type Category = {
  slug: CategorySlug;
  name: string;
  /** Short label for menus and chips. */
  shortName: string;
  /** One commercial sentence for tiles and menus. */
  summary: string;
  /** Category hero paragraph. */
  intro: string;
  /** Placeholder texture until photography exists. */
  material: MaterialVariant;
  imageId: string;
  /** Filter values on the products hub (only values with content). */
  materials: string[];
  uses: string[];
  /** "range" = products WAMAK offers; "sourcing" = requirement-led desk. */
  kind: "range" | "sourcing";
  /** Seasonal / regulatory conditions must be shown. */
  regulated: boolean;
  buyers: string[];
  customization: string[];
  /** "What to include in your requirement". */
  requirementChecklist: string[];
  /** Packaging options that can be coordinated. */
  packaging: string[];
  /** Service slugs (src/content/services.ts). */
  relatedServices: string[];
  /** Category slugs shown as "Related categories". */
  related: CategorySlug[];
  /** SEO description for the category page. */
  metaDescription: string;
};

export const categories: Category[] = [
  {
    slug: "jute-eco-friendly",
    name: "Jute & eco-friendly products",
    shortName: "Jute",
    summary: "Jute bags, baskets, rugs and home goods, made to your size, print and packing.",
    intro:
      "Jute is Bangladesh's signature natural fibre. We source jute bags, baskets, rugs, mats and home goods from producers in Bangladesh and coordinate size, design, branding and packing to your order.",
    material: "fibre",
    imageId: "category-jute",
    materials: ["Jute"],
    uses: ["Retail & promotional", "Home & living"],
    kind: "range",
    regulated: false,
    buyers: ["Importers and wholesalers", "Supermarkets and eco stores", "Promotional product companies", "Gift shops and online retailers", "Home décor retailers"],
    customization: ["Custom size and design", "Colour selection", "Printed logo or embroidery", "Private label, barcode and hangtags", "Customized packaging"],
    requirementChecklist: ["Product type and intended use", "Dimensions and construction", "Print, logo or embroidery details", "Quantity per design", "Packing and labelling needs", "Destination country and port"],
    packaging: ["Bulk export cartons", "Individual polybags or paper sleeves", "Retail hangtags and barcodes", "Printed gift or retail packaging"],
    relatedServices: ["export", "oem-private-label", "packaging", "quality-coordination"],
    related: ["handicrafts-home-decor", "sisal-natural-fibre", "customized-sourcing"],
    metaDescription:
      "Jute bag and jute product supplier in Bangladesh: shopping bags, totes, baskets, rugs and Shatranji, sourced to your size, print and packing. Request a quote.",
  },
  {
    slug: "handicrafts-home-decor",
    name: "Handicrafts & home décor",
    shortName: "Handicrafts",
    summary: "Handmade baskets, rugs, wall and table décor from Bangladeshi artisans, for retail and hospitality.",
    intro:
      "Bangladesh has a long tradition of handwork in natural fibres. We source handmade baskets, rugs, mats, wall and table décor and gift products for retailers, lifestyle brands and hospitality buyers.",
    material: "weave",
    imageId: "category-handicrafts",
    materials: ["Jute", "Natural fibre"],
    uses: ["Home & living", "Hospitality", "Retail & promotional"],
    kind: "range",
    regulated: false,
    buyers: ["Home décor retailers", "Lifestyle and gift stores", "Hotels and hospitality buyers", "Interior designers", "Sourcing companies"],
    customization: ["Custom shapes, sizes and colours", "Collections developed to a brief", "Private label and hangtags", "Retail-ready packaging"],
    requirementChecklist: ["Reference images or sketches", "Dimensions and colours", "Quantity per item", "Retail or bulk packing", "Target delivery window", "Destination country and port"],
    packaging: ["Bulk export cartons with protective packing", "Individual retail boxes or sleeves", "Hangtags, labels and barcodes", "Gift packaging"],
    relatedServices: ["export", "product-development", "packaging", "quality-coordination"],
    related: ["jute-eco-friendly", "art-paintings", "customized-sourcing"],
    metaDescription:
      "Bangladesh handicraft exporter for retailers and hospitality: handmade baskets, rugs, wall and table décor and gift products. Request a quote.",
  },
  {
    slug: "sisal-natural-fibre",
    name: "Sisal & natural fibre products",
    shortName: "Sisal",
    summary: "Sisal fibre, yarn, twine, rope and cord, supplied to your grade, length and packing.",
    intro:
      "We source sisal fibre and sisal products, from raw and processed fibre to yarn, twine, rope and cord. Grade, dimensions, weight and packing are agreed with you before quotation.",
    material: "twine",
    imageId: "category-sisal",
    materials: ["Sisal", "Natural fibre"],
    uses: ["Industrial & raw material", "Home & living"],
    kind: "range",
    regulated: false,
    buyers: ["Importers and distributors", "Rope and twine manufacturers", "Agricultural and packaging suppliers", "Craft and home goods producers"],
    customization: ["Grade and processing level", "Diameter, length and ply", "Coil, bale or spool packing", "Private-label packing for retail"],
    requirementChecklist: ["Product form (fibre, yarn, twine, rope, cord)", "Grade and technical specification", "Diameter, length or weight", "Quantity and packing format", "Sample requirement", "Destination country and port"],
    packaging: ["Pressed bales for fibre", "Coils, spools or hanks", "Retail cards or labelled bundles", "Export cartons or woven bags"],
    relatedServices: ["export", "global-sourcing", "quality-coordination", "documentation-shipment"],
    related: ["jute-eco-friendly", "handicrafts-home-decor", "customized-sourcing"],
    metaDescription:
      "Natural fibre supplier in Bangladesh: sisal fibre, yarn, twine, rope and cord supplied to your grade, dimensions and packing. Request a quote.",
  },
  {
    slug: "loofah-bath",
    name: "Loofah & bath accessories",
    shortName: "Loofah",
    summary: "Natural loofah sponges, scrubbers and bath accessories, with private-label options.",
    intro:
      "Natural loofah is grown and dried in Bangladesh and cut into sponges, pads and scrubbers. We also source artificial bath products and coordinate private-label packing for retail.",
    material: "loofah",
    imageId: "category-loofah",
    materials: ["Loofah"],
    uses: ["Personal care & bath", "Retail & promotional"],
    kind: "range",
    regulated: false,
    buyers: ["Personal care and bath brands", "Supermarkets and pharmacies", "Spa and hospitality suppliers", "Online retailers"],
    customization: ["Size, shape and cut", "Logo, label and barcode", "Retail packs and gift packs", "Colour for artificial products"],
    requirementChecklist: ["Product type (natural or artificial)", "Size and cut", "Retail or bulk packing", "Private-label artwork", "Quantity per SKU", "Destination country and port"],
    packaging: ["Bulk packing by count or weight", "Retail packs with your label and barcode", "Gift packs and bath sets", "Export cartons"],
    relatedServices: ["oem-private-label", "packaging", "product-development", "export"],
    related: ["handicrafts-home-decor", "jute-eco-friendly", "customized-sourcing"],
    metaDescription:
      "Natural loofah sponges, scrubbers and bath accessories from Bangladesh, including private-label loofah with your branding and retail packs. Request a quote.",
  },
  {
    slug: "art-paintings",
    name: "Original art & paintings",
    shortName: "Art",
    summary: "Original Bangladesh-inspired paintings in acrylic and watercolour, including commissions.",
    intro:
      "Original, Bangladesh-inspired paintings: rural life, rivers and boats, landscapes and nature, in acrylic and watercolour. Framed pieces and commissioned work can be arranged for dealers, interiors and hospitality projects.",
    material: "canvas",
    imageId: "category-art",
    materials: ["Canvas & paint"],
    uses: ["Hospitality", "Home & living"],
    kind: "range",
    regulated: false,
    buyers: ["Art dealers and galleries", "Interior designers", "Hotels and restaurants", "Corporate offices", "Online art retailers"],
    customization: ["Commissioned subjects and palettes", "Custom dimensions", "Framed or unframed", "Series for a single interior"],
    requirementChecklist: ["Subject or style references", "Dimensions and orientation", "Medium (acrylic or watercolour)", "Framing preference", "Number of pieces", "Delivery address"],
    packaging: ["Rolled in protective tubes (unframed)", "Framed pieces with corner protection and crating", "Certificate or artist note on request"],
    relatedServices: ["export", "documentation-shipment"],
    related: ["handicrafts-home-decor", "customized-sourcing"],
    metaDescription:
      "Original Bangladesh-inspired paintings in acrylic and watercolour for dealers, interiors and hospitality, plus commissioned artwork. Request a quote.",
  },
  {
    slug: "agriculture",
    name: "Agricultural products",
    shortName: "Agriculture",
    summary: "Pineapple, selected fresh fruit and seasonal produce, subject to season and destination rules.",
    intro:
      "We source pineapple, selected fresh fruit and other Bangladesh-origin produce for buyers with confirmed destination requirements. Availability follows the season, and every order starts with a review of your specification and your country's import rules.",
    material: "harvest",
    imageId: "category-agriculture",
    materials: ["Fresh produce"],
    uses: ["Food & produce"],
    kind: "range",
    regulated: true,
    buyers: ["Fresh produce importers", "Wholesale markets and distributors", "Supermarket buyers", "Food processors"],
    customization: ["Size and grade selection", "Quality parameters such as Brix", "Export packing format", "Trial shipment before regular supply"],
    requirementChecklist: ["Product and variety", "Size, grade and quality parameters", "Quantity and shipment frequency", "Packing format", "Destination-country import requirements", "Destination port or airport"],
    packaging: ["Export cartons suited to the product", "Grade and size marking", "Packing agreed to the destination's requirements"],
    relatedServices: ["export", "quality-coordination", "documentation-shipment"],
    related: ["seafood", "customized-sourcing"],
    metaDescription:
      "Pineapple, selected fresh fruit and seasonal produce from Bangladesh, sourced to your grade and subject to season and destination import rules. Request a quote.",
  },
  {
    slug: "seafood",
    name: "Seafood",
    shortName: "Seafood",
    summary: "Live mud crab and selected seafood, subject to availability, certification and import rules.",
    intro:
      "We are developing supply of Bangladesh-origin live mud crab and selected seafood for importers who can confirm their destination requirements. Every inquiry is reviewed against availability, certification and the import regulations of the destination country.",
    material: "tide",
    imageId: "category-seafood",
    materials: ["Seafood"],
    uses: ["Food & produce"],
    kind: "range",
    regulated: true,
    buyers: ["Seafood importers", "Wholesale distributors", "Restaurant and hospitality suppliers"],
    customization: ["Size and weight grade", "Male or female grading", "Live export packing", "Shipment frequency"],
    requirementChecklist: ["Species and product form", "Size or weight grade", "Quantity per shipment", "Shipment frequency", "Certification required at destination", "Destination airport"],
    packaging: ["Live export packing agreed for air freight", "Grading and labelling per shipment", "Packing to destination requirements"],
    relatedServices: ["export", "quality-coordination", "documentation-shipment"],
    related: ["agriculture", "customized-sourcing"],
    metaDescription:
      "Live mud crab and selected seafood from Bangladesh for importers, subject to availability, certification and destination import rules. Request a quote.",
  },
  {
    slug: "customized-sourcing",
    name: "Customized product sourcing",
    shortName: "Customized sourcing",
    summary: "Don't see your product? Tell us the specification and we'll look for the right producer.",
    intro:
      "If the product you need isn't listed, send us the specification. We identify suitable manufacturers and producers in Bangladesh, coordinate samples and negotiation, and manage packaging, quality, documentation and shipment through to delivery.",
    material: "weave",
    imageId: "category-customized",
    materials: [],
    uses: [],
    kind: "sourcing",
    regulated: false,
    buyers: ["Importers testing a new category", "Retailers developing private label", "Buying houses and sourcing agents", "Corporate and project buyers"],
    customization: ["Supplier identification", "Specification development", "OEM and private label", "Packaging development"],
    requirementChecklist: ["Product description and use", "Specification, drawings or samples", "Target quantity", "Target price, if available", "Packaging and labelling", "Destination and timing"],
    packaging: ["Retail and gift packaging development", "Private-label artwork coordination", "Export cartons and marking"],
    relatedServices: ["global-sourcing", "oem-private-label", "product-development", "packaging", "quality-coordination", "documentation-shipment"],
    related: ["jute-eco-friendly", "handicrafts-home-decor", "loofah-bath"],
    metaDescription:
      "Customized product sourcing in Bangladesh: send your specification and we identify producers, coordinate samples, packaging, quality and shipment. Send your requirement.",
  },
];

/** Required wording wherever agriculture or seafood is offered. */
export const REGULATED_NOTICE = [
  "Availability can be seasonal.",
  "Eligibility depends on the destination country's import regulations.",
  "Specifications must be confirmed for each order.",
  "A quotation follows our review of your requirement.",
];

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const productCategories = categories.filter((c) => c.kind === "range");
