/**
 * Single source of verified company facts.
 * Anything not in this file (or clearly marked PENDING) must not appear on the site.
 * See CLAUDE.md → "Truth rules".
 */

export const PENDING = {
  phone: "[BUSINESS PHONE TO BE CONFIRMED]",
  /** WhatsApp buttons must NOT render while this is null. */
  whatsapp: null as string | null,
  domain: "[DOMAIN TO BE CONFIRMED]",
  officeHours: "[OFFICE HOURS TO BE CONFIRMED]",
} as const;

export const site = {
  name: "WAMAK GROUP",
  shortName: "WAMAK",
  brandLine: "Connecting Bangladesh to the Global Market",
  campaignLine: "From Bangladesh to the World",
  /** Part of the logo lockup — never restyle or re-typeset as a tagline. */
  logoLockup: "GOOD PRODUCTS • LASTING VALUE",
  positioning:
    "Bangladesh-based exporter, importer, international trader and global sourcing partner for B2B and wholesale buyers.",
  location: "Dhaka, Bangladesh",
  email: "wamakgroup@gmail.com",
  address: {
    lines: [
      "House No. 164 (5th Floor, B-5)",
      "Road No. 19 (Old), 9/A (New)",
      "West Dhanmondi",
      "Dhaka-1209, Bangladesh",
    ],
    streetAddress:
      "House No. 164 (5th Floor, B-5), Road No. 19 (Old), 9/A (New), West Dhanmondi",
    locality: "Dhaka",
    postalCode: "1209",
    country: "Bangladesh",
    countryCode: "BD",
  },
  leadership: [
    { name: "Md. Wazed Ali", role: "Chairman", initials: "WA" },
    { name: "Khandaker Maruf Hossain", role: "Managing Director", initials: "KM" },
  ],
  values: [
    "Integrity",
    "Quality",
    "Customer commitment",
    "Competitive sourcing",
    "Sustainability",
    "Long-term partnership",
  ],
  /** Regions WAMAK welcomes inquiries from — targets, not proven markets. */
  targetRegions: ["North America", "Europe", "Middle East", "Asia", "Africa"],
  commercial: {
    pricing: "Quotation-based",
    moq: "Subject to quotation",
    samples: "Available depending on product and terms",
    incoterms: ["EXW", "FOB", "CFR", "CIF"],
    incotermsNote: "EXW, FOB, CFR, CIF or as agreed",
    origin: "Bangladesh",
  },
  /** Official social profiles. Render nothing while empty. */
  social: [] as { label: string; href: string }[],
} as const;

export type Site = typeof site;
