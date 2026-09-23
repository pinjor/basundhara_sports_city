import type { IconName } from "@/components/ui/Icon";

/** Homepage copy. Kept out of components so it can be translated or moved to a CMS. */

export const home = {
  meta: {
    title: "WAMAK GROUP: Bangladesh sourcing and export partner",
    description:
      "Bangladesh-based exporter and sourcing partner for B2B buyers. Jute bags, handicrafts, sisal, natural loofah, original art, pineapple, mud crab and customized sourcing, quoted to your specification.",
  },
  hero: {
    location: "Dhaka, Bangladesh",
    title: "Reliable sourcing from Bangladesh, built for global buyers.",
    intro:
      "WAMAK GROUP connects international buyers with jute, natural fibres, handicrafts, home décor, agriculture, seafood, artwork and customized sourcing from Bangladesh.",
    primary: "Request a quote",
    secondary: "Explore products",
    tertiary: "Download catalogue",
  },
  capabilities: [
    { icon: "handshake", label: "B2B and wholesale supply" },
    { icon: "customize", label: "OEM and private label" },
    { icon: "package", label: "Customized packaging" },
    { icon: "sample", label: "Sampling coordination" },
    { icon: "document", label: "Export documentation support" },
  ] satisfies { icon: IconName; label: string }[],
  divisions: {
    title: "Seven product families, and a sourcing desk for everything else.",
    intro:
      "Each range is quoted to your specification, quantity and destination. Start with a family, or send us a product we don't list.",
    customTitle: "Don't see your product?",
    customBody: "Tell us the specification. We'll find the right producer in Bangladesh.",
    customCta: "Send your requirement",
  },
  chapter: {
    title: "More than products. A sourcing partner on the ground.",
    body: "Buying from a new country is mostly coordination. We stay with your order in Bangladesh, from the first requirement to the shipment leaving port, so you deal with one accountable partner instead of many suppliers.",
    link: "See how we work",
    steps: [
      { term: "Requirement", detail: "We confirm the product, specification, quantity and destination with you." },
      { term: "Supplier identification", detail: "We find and assess producers suited to the order." },
      { term: "Sampling", detail: "Samples or trial pieces are arranged where the product allows." },
      { term: "Specification", detail: "Materials, dimensions and finishes are fixed in writing." },
      { term: "Packaging", detail: "Retail, private-label or export packing is agreed and prepared." },
      { term: "Quality", detail: "Goods are checked against the agreed specification before packing." },
      { term: "Documentation", detail: "Commercial and export documents are prepared with you." },
      { term: "Shipment", detail: "Freight is coordinated to your port or airport on the agreed Incoterm." },
    ],
  },
  why: {
    title: "Why buyers work with WAMAK",
    lead: "You get one partner in Bangladesh who understands your specification, speaks your commercial language and stays with the order.",
    cta: "Why WAMAK",
    items: [
      { icon: "pin", title: "Access to Bangladesh supply", body: "We work with producers, manufacturers, artisans and processors in Bangladesh, from our base in Dhaka." },
      { icon: "fibre", title: "One partner, many categories", body: "Natural fibres, handicrafts, bath products, art, produce and seafood are handled through a single point of contact." },
      { icon: "customize", title: "Sourced to your brief", body: "Quotations follow your specification, quantity, packaging and destination, not a fixed price list." },
      { icon: "quality", title: "Customization and private label", body: "Selected products can carry your design, branding, labels and barcodes, subject to product and quantity." },
      { icon: "package", title: "Packaging coordination", body: "Retail packs, gift packs and export cartons are organised to match your market." },
      { icon: "mail", title: "Clear, responsive communication", body: "Plain answers in international business English, with specifications and terms confirmed in writing." },
    ] satisfies { icon: IconName; title: string; body: string }[],
  },
  featured: {
    title: "Products buyers ask about",
    intro: "A starting point from our ranges. Add products to your RFQ list and request one quotation for all of them.",
    all: "All",
  },
  material: {
    title: "Grown, retted, spun and woven by hand.",
    body: [
      "Much of what we source begins as a plant. Jute is grown and retted in the Bengal delta, then spun and woven into cloth, rope and rugs. Sisal is stripped and twisted into twine. Loofah is dried on the vine and cut into sponges.",
      "Then comes handwork: braiding, weaving, stitching and finishing. Our job is to match that material and skill to your specification, and to make sure what arrives is what you agreed.",
    ],
    materials: ["Jute", "Sisal", "Loofah", "Handwork"],
  },
  process: {
    title: "How we work",
    intro: "A clear sequence from your first message to repeat supply. You always know what happens next and what we need from you.",
    link: "See the full process",
    steps: [
      { title: "Inquiry", body: "You send your product requirement, by RFQ form or email." },
      { title: "Requirement review", body: "We review specification, quantity, packaging and destination." },
      { title: "Sourcing", body: "Suitable supply options are identified and evaluated." },
      { title: "Quotation", body: "Commercial terms are prepared for your requirement." },
      { title: "Sample or trial", body: "Where applicable, samples or a trial shipment are arranged." },
      { title: "Order confirmation", body: "Specifications and commercial terms are finalised." },
      { title: "Production or procurement", body: "Production or procurement is coordinated with suppliers." },
      { title: "Quality and packing", body: "Goods are checked and packed to the agreed specification." },
      { title: "Documentation and shipment", body: "Export documents and freight are coordinated." },
      { title: "Long-term supply", body: "Successful trials can become regular, repeat supply." },
    ],
  },
  markets: {
    title: "Markets we welcome inquiries from",
    body: "We are building buyer relationships from Dhaka towards five regions. Wherever you are, if the destination rules allow the product, we will review your requirement.",
    link: "Global markets",
  },
  leadership: {
    title: "Led from Dhaka",
    body: "WAMAK GROUP is led by its Chairman and its Managing Director from the head office in West Dhanmondi, Dhaka.",
    link: "Read messages from the leadership",
  },
  catalogue: {
    title: "Explore the WAMAK GROUP product catalogue",
    body: "Our ranges in one document, to share with your buying team.",
    download: "Download catalogue",
    request: "Request the latest catalogue",
  },
  quick: {
    title: "Tell us what you need.",
    body: "Four details are enough to start. You can add specifications, packaging and files on the next step.",
    cta: "Start my request",
  },
} as const;
