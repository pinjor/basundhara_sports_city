import type { CategorySlug } from "./categories";

/**
 * Representative product entries per division, named from the client brief.
 * No specifications, MOQs or prices are invented: every spec field reads
 * "Specification confirmed on request" and MOQ "Subject to quotation".
 */

export type Product = {
  slug: string;
  category: CategorySlug;
  name: string;
  /** Short, honest commercial description. */
  summary: string;
  /** Material/features in plain words, no numbers. */
  features: string[];
  /** Verified specification fields only. Empty = "Confirmed on request". */
  specs: { label: string; value: string }[];
  privateLabel: boolean;
  featured?: boolean;
};

export const SPEC_PENDING = "Specification confirmed on request";
export const MOQ_TEXT = "Subject to quotation";
export const SAMPLES_TEXT = "Available depending on product and terms";

const p = (
  category: CategorySlug,
  slug: string,
  name: string,
  summary: string,
  features: string[],
  opts: { privateLabel?: boolean; featured?: boolean } = {},
): Product => ({
  slug,
  category,
  name,
  summary,
  features,
  specs: [],
  privateLabel: opts.privateLabel ?? true,
  featured: opts.featured,
});

export const products: Product[] = [
  // Jute & eco-friendly
  p("jute-eco-friendly", "jute-shopping-bags", "Jute shopping bags", "Reusable jute shopping bags for retail, supermarket and promotional programmes.", ["Natural jute fabric", "Printed or plain", "Handles and lining to order"], { featured: true }),
  p("jute-eco-friendly", "jute-tote-bags", "Jute tote bags", "Everyday jute totes, made to your size, colour and branding.", ["Natural or dyed jute", "Logo print or embroidery", "Optional lining and gusset"], { featured: true }),
  p("jute-eco-friendly", "promotional-jute-bags", "Promotional and gift jute bags", "Small-format jute bags for events, gifting and bottle packaging.", ["Gift, wine and pouch formats", "Screen-printed branding", "Drawstring or handle closures"]),
  p("jute-eco-friendly", "jute-baskets", "Jute baskets", "Storage and decorative baskets in braided and woven jute.", ["Hand-braided jute", "Nesting sets possible", "Natural or colour-blocked"]),
  p("jute-eco-friendly", "jute-rugs-mats", "Jute rugs and mats", "Floor rugs, runners, door mats and table mats in natural jute.", ["Braided and woven constructions", "Natural and dyed yarns", "Round, rectangular and runner shapes"], { featured: true }),
  p("jute-eco-friendly", "shatranji", "Shatranji flat-woven rugs", "Traditional flat-woven Shatranji rugs from Bangladesh.", ["Flat-woven on traditional looms", "Striped and geometric patterns", "Reversible construction"]),

  // Handicrafts & home décor
  p("handicrafts-home-decor", "handmade-baskets", "Handmade decorative baskets", "Hand-woven baskets for storage, display and gifting.", ["Natural fibres", "Handwoven by artisans", "Sets and single pieces"], { featured: true }),
  p("handicrafts-home-decor", "handmade-rugs-floor-mats", "Handmade rugs and floor mats", "Handmade rugs and mats in natural fibres for living spaces and hospitality.", ["Handwoven", "Natural fibre blends", "Custom colourways"]),
  p("handicrafts-home-decor", "wall-table-decor", "Wall and table décor", "Wall hangings, placemats, coasters and table accessories in natural materials.", ["Natural fibre construction", "Coordinated collections", "Retail-ready packing"]),
  p("handicrafts-home-decor", "gift-lifestyle-products", "Gift and lifestyle products", "Handmade gift and lifestyle items for retailers and corporate gifting.", ["Handmade", "Natural materials", "Gift packaging options"]),
  p("handicrafts-home-decor", "traditional-handicrafts", "Traditional Bangladesh handicrafts", "Traditional craft products that bring Bangladeshi handwork to your range.", ["Traditional techniques", "Natural materials", "Small-batch production"], { privateLabel: false }),

  // Sisal & natural fibre
  p("sisal-natural-fibre", "sisal-fibre", "Sisal fibre, raw and processed", "Raw and processed sisal fibre supplied to your grade and packing.", ["Raw or processed", "Graded to buyer requirement", "Baled for export"], { privateLabel: false }),
  p("sisal-natural-fibre", "sisal-yarn", "Sisal yarn", "Sisal yarn for weaving, carpets and craft production.", ["Spun sisal", "Natural colour", "Spool or bale packing"], { privateLabel: false }),
  p("sisal-natural-fibre", "sisal-rope-twine", "Sisal rope and twine", "Twisted sisal rope and twine for agricultural, packaging and decorative use.", ["Twisted natural fibre", "Range of diameters to order", "Coil or spool packing"], { featured: true }),
  p("sisal-natural-fibre", "sisal-cord", "Sisal cord", "Sisal cord for craft, packaging and home goods production.", ["Natural sisal", "Braided or twisted", "Retail or bulk packing"]),

  // Loofah & bath
  p("loofah-bath", "natural-loofah-sponges", "Natural loofah sponges", "Whole and cut natural loofah sponges for bath and personal care ranges.", ["Plant-based natural loofah", "Whole or cut", "Bulk or retail packed"], { featured: true }),
  p("loofah-bath", "loofah-body-scrubbers", "Loofah body scrubbers and pads", "Body scrubbers, bath pads, facial pads and back scrubbers made from natural loofah.", ["Natural loofah", "Pads, mitts and back straps", "Cotton or fabric trims"]),
  p("loofah-bath", "loofah-bath-accessories", "Loofah bath accessories", "Soap pads, loofah belts and other bath accessories.", ["Natural loofah", "Coordinated bath sets", "Gift pack options"]),
  p("loofah-bath", "mesh-bath-sponges", "Mesh bath sponges and poufs", "Artificial mesh bath sponges and poufs in your colours.", ["Synthetic mesh", "Colour to order", "Retail-ready packing"]),
  p("loofah-bath", "private-label-loofah", "Private-label loofah products", "Natural and artificial loofah products packed under your brand.", ["Your logo, label and barcode", "Retail and gift packs", "Coordinated with manufacturing partners"]),

  // Art & paintings
  p("art-paintings", "acrylic-paintings", "Original acrylic paintings", "Original acrylic paintings inspired by Bangladesh's landscapes and daily life.", ["Original, one-of-a-kind", "Acrylic on canvas", "Framed or unframed"], { privateLabel: false, featured: true }),
  p("art-paintings", "watercolour-paintings", "Watercolour paintings", "Original watercolour paintings of rivers, villages and nature.", ["Original work", "Watercolour on paper", "Framing on request"], { privateLabel: false }),
  p("art-paintings", "rural-life-paintings", "Rural Bangladesh and village-life paintings", "Paintings of rural life, farming and village scenes.", ["Original work", "Acrylic or watercolour", "Series available"], { privateLabel: false }),
  p("art-paintings", "river-boat-paintings", "River and boat paintings", "The rivers and boats of the Bengal delta, painted in original works.", ["Original work", "Acrylic or watercolour", "Landscape formats"], { privateLabel: false }),
  p("art-paintings", "commissioned-paintings", "Commissioned paintings", "Paintings commissioned to your subject, size and palette for interiors and hospitality.", ["Commissioned to brief", "Custom dimensions", "Single pieces or series"], { privateLabel: false }),

  // Agriculture
  p("agriculture", "pineapple", "Pineapple", "Fresh Bangladeshi pineapple, subject to season and destination requirements.", ["Fresh fruit", "Size and grade to order", "Trial shipment before regular supply"], { privateLabel: false, featured: true }),
  p("agriculture", "selected-fresh-fruits", "Selected fresh fruits", "Selected seasonal fresh fruit from Bangladesh, on request.", ["Seasonal availability", "Grade to order", "Export packing"], { privateLabel: false }),
  p("agriculture", "seasonal-produce", "Seasonal agricultural produce", "Other Bangladesh-origin produce, sourced to buyer specification when in season.", ["Seasonal availability", "Buyer-specified", "Subject to export eligibility"], { privateLabel: false }),

  // Seafood
  p("seafood", "mud-crab", "Mud crab", "Live Bangladesh-origin mud crab for importers with confirmed destination requirements.", ["Live export", "Graded by size, weight and sex", "Air freight"], { privateLabel: false, featured: true }),
  p("seafood", "crab-products", "Selected crab products", "Selected crab products, subject to availability and certification.", ["Subject to availability", "Certification per destination", "Packing to requirement"], { privateLabel: false }),
  p("seafood", "seafood-on-request", "Other seafood on request", "Other exportable seafood, reviewed against your requirement and destination rules.", ["Buyer-specified", "Subject to regulation", "Reviewed case by case"], { privateLabel: false }),

  // Customized sourcing
  p("customized-sourcing", "buyer-specified-products", "Buyer-specified products", "Products sourced from Bangladeshi manufacturers to your specification.", ["Supplier identification", "Sampling and negotiation", "Quality and shipment coordination"]),
  p("customized-sourcing", "oem-private-label-programmes", "OEM and private-label programmes", "Your product, made by partner manufacturers and packed under your brand.", ["Manufacturer matching", "Branding and labelling", "Packaging development"]),
  p("customized-sourcing", "custom-packaging", "Custom packaging development", "Retail, gift and export packaging developed around your product.", ["Retail and gift packs", "Barcodes and labels", "Export cartons"]),
];

export const getProduct = (category: string, slug: string) =>
  products.find((x) => x.category === category && x.slug === slug);
export const productsIn = (category: string) => products.filter((x) => x.category === category);
export const featuredProducts = products.filter((x) => x.featured);
