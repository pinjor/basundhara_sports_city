import type { CategorySlug } from "./categories";

export type Faq = { q: string; a: string };

/** General buyer questions (FAQ page, Phase 5, and reused on category pages). */
export const generalFaqs: Faq[] = [
  {
    q: "What does WAMAK GROUP supply?",
    a: "Jute and eco-friendly products, handicrafts and home décor, sisal and natural fibre products, loofah and bath accessories, original art and paintings, selected agricultural products and seafood. We also source other products from Bangladesh to your specification.",
  },
  {
    q: "What information do you need for a quotation?",
    a: "The product, the specification (size, material, finish), the quantity, packaging and labelling needs, and the destination country and port or airport. A target price and delivery date help if you have them. You can send all of this through the RFQ form, with files attached.",
  },
  {
    q: "What is your minimum order quantity?",
    a: "It depends on the product, the customization and the producer. We confirm the minimum order quantity in the quotation.",
  },
  {
    q: "Can I get samples?",
    a: "Samples are available depending on the product and the terms. Where a sample or a trial shipment is possible, we arrange it before the order is confirmed and confirm any cost in advance.",
  },
  {
    q: "Which Incoterms do you work with?",
    a: "Terms are agreed per transaction and may include EXW, FOB, CFR or CIF, or other terms if agreed. Tell us your preferred term when you request a quote.",
  },
  {
    q: "Where are you based?",
    a: "Our office is at House No. 164 (5th Floor, B-5), Road No. 19 (Old), 9/A (New), West Dhanmondi, Dhaka-1209, Bangladesh.",
  },
];

/** Category-specific questions shown on each category page. */
export const categoryFaqs: Record<CategorySlug, Faq[]> = {
  "jute-eco-friendly": [
    { q: "Can jute bags carry our logo?", a: "Yes. Printed logos and embroidery can be arranged on most jute bags, along with private-label tags and barcodes. Tell us the artwork, the print method you prefer and the quantity per design." },
    { q: "Can you make a size or shape that isn't listed?", a: "Custom sizes, shapes, handles and linings can be discussed. Send dimensions or a reference image and we'll confirm what is feasible before quoting." },
    { q: "How are jute products packed for export?", a: "Usually in export cartons, with individual polybags, paper sleeves or retail packaging if you need them. Packing is agreed per order." },
  ],
  "handicrafts-home-decor": [
    { q: "Are the products handmade?", a: "The handicraft range is made by hand, so small variations in colour, weave and dimension are part of the product. Tolerances are agreed with you before production." },
    { q: "Can you develop a collection to our brief?", a: "Yes. Send reference images, colours and dimensions. We coordinate samples with producers before you confirm an order." },
    { q: "Do you supply hotels and hospitality projects?", a: "We welcome hospitality inquiries. Tell us the quantities, the finishes and the delivery schedule for the project." },
  ],
  "sisal-natural-fibre": [
    { q: "Which sisal grades can you supply?", a: "Grade depends on availability and processing. Tell us the grade or technical specification you need and we'll confirm what can be sourced before quotation." },
    { q: "Can you supply rope or twine to a specific diameter?", a: "Diameter, ply, length and packing are agreed per order. Include them in your requirement and we'll confirm feasibility." },
  ],
  "loofah-bath": [
    { q: "Can loofah products be private labelled?", a: "Yes, subject to product and quantity. Your logo, labels, barcodes and retail packaging can be coordinated with manufacturing partners." },
    { q: "Do you supply natural and artificial loofah?", a: "Both. Natural loofah is plant-based; artificial mesh sponges and poufs are made from synthetic mesh in the colours you choose." },
  ],
  "art-paintings": [
    { q: "Are the paintings original?", a: "Yes. Each painting is an original work, not a print. Series and commissioned pieces can also be arranged." },
    { q: "What sizes are available?", a: "Sizes vary by work. Custom dimensions can be discussed for commissions. Tell us the space and orientation you are working with." },
    { q: "Can you ship framed artwork?", a: "Framed and unframed shipping can both be arranged. Unframed works are usually rolled in protective tubes, and framed pieces are crated." },
  ],
  agriculture: [
    { q: "Is supply available all year?", a: "No. Fresh produce follows the season. We confirm availability and timing when we review your requirement." },
    { q: "Can you meet our country's import requirements?", a: "Eligibility depends on the product and the destination country's regulations. Tell us your import requirements and we review them before quoting." },
    { q: "Can we start with a trial shipment?", a: "Yes. A trial shipment is the usual way to start before regular supply." },
  ],
  seafood: [
    { q: "Can you ship live mud crab?", a: "Live mud crab is shipped by air freight, subject to availability, certification and the destination country's import requirements." },
    { q: "Which certificates are available?", a: "Certification depends on the product and destination. Tell us what your authorities require and we review it before quoting." },
  ],
  "customized-sourcing": [
    { q: "What kind of products can you source?", a: "Products made or grown in Bangladesh that can be exported to your destination. Send the specification and we'll tell you honestly whether we can source it." },
    { q: "What happens after I send a requirement?", a: "We review it, ask any questions needed to make the specification clear, and then prepare a quotation, or tell you if the product cannot be sourced to your requirement." },
    { q: "Can you manage private label and packaging?", a: "Yes. We coordinate branding, labelling and packaging with manufacturing partners as part of the sourcing work." },
  ],
};
