@AGENTS.md

# WAMAK GROUP website — project rules

Production B2B site for WAMAK GROUP (Dhaka, Bangladesh). One job: make an overseas importer,
wholesaler, retailer or procurement manager trust WAMAK, understand what it can source, and send
a serious **Request for Quotation**. Path: product discovery → capability & process → commercial
fit → RFQ. No e-commerce, no prices, no cart, no checkout.

Stack: Next.js 16 (App Router, Turbopack, async `params`), TypeScript strict, Tailwind v4 (tokens in
`src/app/globals.css` `@theme`), motion (minimal), lucide-react, zod + react-hook-form, Resend.
Read `node_modules/next/dist/docs/` before using any Next API you are unsure of.

## 1. Verified facts — the ONLY facts allowed
All live in `src/content/site.ts`. Never hard-code them elsewhere.
- WAMAK GROUP, Dhaka, Bangladesh. Exporter, importer, international trader, global sourcing partner (B2B/wholesale).
- Brand line "Connecting Bangladesh to the Global Market". Campaign line "From Bangladesh to the World".
- Logo lockup "GOOD PRODUCTS • LASTING VALUE" — never alter.
- Md. Wazed Ali — Chairman. Khandaker Maruf Hossain — Managing Director.
- House No. 164 (5th Floor, B-5), Road No. 19 (Old), 9/A (New), West Dhanmondi, Dhaka-1209, Bangladesh. wamakgroup@gmail.com
- Values: integrity, quality, customer commitment, competitive sourcing, sustainability, long-term partnership.
- Target regions (targets, NOT proven markets): North America, Europe, Middle East, Asia, Africa.
- Commercial: quotation-based pricing; MOQ varies ("Subject to quotation"); samples subject to product and terms; Incoterms EXW, FOB, CFR, CIF or as agreed.
- 8 divisions: Jute & eco-friendly · Handicrafts & home décor · Sisal & natural fibre · Loofah & bath · Original art & paintings · Agricultural products · Seafood · Customized product sourcing.
- Services: export; import & trading; international sourcing; supplier identification; buyer–supplier coordination; product development; OEM/private label; customized packaging; sampling; quality/inspection coordination; export documentation; logistics/shipment coordination; international business development.
- Source brief: `assets/company-brief.docx` (product lists per division come from here).

## 2. Truth rules (non-negotiable)
- Never invent: founding year, headcount, revenue, volumes, customers, client logos, testimonials, certifications, licence/TIN/BIN/ERC/IRC numbers, factories, countries served, awards, response-time or delivery guarantees, capacity, specs, MOQs, prices, statistics.
- Missing data → typed placeholder in `PENDING` (`src/content/site.ts`). `PENDING.whatsapp === null` ⇒ no WhatsApp UI anywhere.
- No AI/stock portraits of leadership — `Monogram` until real photos arrive.
- Testimonials, logo wall, metrics, case studies, insights: build components/types, render nothing while data arrays are empty; do not link them.
- Banned words: "leading", "best", "world-class", "No. 1". Be specific and buyer-centred.
- Agriculture & seafood always state: availability can be seasonal; eligibility depends on destination-country regulations; specs need confirmation; quotation follows requirement review.
- Spec fields without verified data show "Specification confirmed on request"; MOQ shows "Subject to quotation".
- Leadership messages are drafts, visibly marked `[DRAFT — REQUIRES APPROVAL BY CHAIRMAN/MD]`.
- Update `CONTENT-TODO.md` at the end of every phase.

## 3. Design system (see docs/design-plan.md)
Concept: **natural material, handled with precision** — warm tactile imagery, quiet navy-anchored, highly ordered interface.
- Colour tokens (Tailwind names): `navy-900` #05245C brand/headings/primary · `navy-950` #031738 footer/deep · `leaf-500` #3C9426 graphics only · `leaf-700` #2B7A35 links + focus on light · `ivory-50` #F7F5EE page · `jute-300` #C9A66B accent/rules on navy · `ink-900` #1B222B body · `ink-600` secondary text · `mist-100` #E9EEF3 form panels · `white` cards/fields · `field` input borders · `line` decorative hairlines · `danger` errors. Never raw hex in components. Green is rationed; the site never turns "eco-green".
- Contrast results: `docs/contrast.md` (regenerate with `node scripts/contrast.mjs`). Focus ring: 2px leaf-700 + offset; jute-300 inside `.surface-navy`.
- Type: Manrope (display/headings, tight tracking) + Inter (body/UI) via next/font. Utilities `text-display|h1|h2|h3|body-l|body|small` (fluid clamp). Line length ≤ 70ch (`measure`).
- Layout: `container-site` (1280 max), `grid-site` 12/8/4 columns. Spacing 4·8·12·16·24·32·48·64·96·128; vary section rhythm. Radius: 4px controls (`rounded-control`), 12px image cards (`rounded-card`), 0 full-bleed. Shadows almost never.
- Surfaces: `surface-ivory`, `surface-navy` (a deliberate chapter), `surface-deep`.
- ONE brand device: `FibreThread` (hero draw ≤1.2s once; process spine linked to scroll; map routes; category divider). Nothing else decorative.
- Imagery: manifest in `src/content/images.ts`; `MaterialPlaceholder` until real photos (materials only — never facilities, staff, ships, customers). Logo PNG used as supplied via `Logo` (multiply on light, white plate on navy).
- Icons: `Icon` component only (Lucide base, 1.5px stroke).
- Motion: one orchestrated hero moment; everything else responds to user action (150–250ms micro, 300–500ms larger). Respect reduced motion.

## 9. Anti-patterns — do not
Fake reviews/certificates/logos/numbers/offices/factories/shipping claims/leadership photos · stock photos implying WAMAK infrastructure · hero sliders · fade-up on every section · parallax · scroll-jacking · decorative gradients · glassmorphism · neon/tech look · identical rounded cards with grey shadows · all-caps eyebrows above headings · one highlighted/italic word in headlines · "→" on every link · middle-dot meta strings everywhere · low-contrast grey text · tiny nav · "Add to cart"/prices/checkout · empty blog · pricing table · duplicate CTAs in every block · vague hero lines · editing or redrawing the logo. CTAs never say "Learn more", "Click here", "Submit".

## 10. Quality gates (definition of done)
- First screen tells a new international buyer what WAMAK does; 8 families obvious; customized sourcing clearly distinct.
- Requesting a quote is easier than writing an email; product context flows into the RFQ.
- Journeys A–E (Home→Category→Product→RFQ→Thank you; Customized sourcing→RFQ; multi-product RFQ list; Catalogue→Contact; About→Why WAMAK→Contact) work on mobile and desktop.
- Zero axe violations (`npm run test:e2e`); Lighthouse ≥ 90 all categories on mobile; CLS ≤ 0.1, LCP ≤ 2.5s, INP ≤ 200ms; no horizontal overflow from 360px.
- One H1 per page, semantic headings, keyboard-operable everything, labelled inputs, `aria-live` errors, targets ≥ 44px.
- Final test: would a procurement director in London, Dubai, Amsterdam, New York or Tokyo confidently send a real requirement through this site?

## Commands
`npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm run test:e2e` (starts `next start` on :3100; build first) · `npm run screenshots -- /route <outDir> 390 768 1280 1440`
