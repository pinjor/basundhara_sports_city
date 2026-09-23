# Content to-do

Everything on the site that is a placeholder, temporary, or needs client verification.
Updated at the end of every phase. Last update: **Phase 4**.

## Brand assets
- [ ] **Logo vector master (SVG/AI/EPS)**. The current `assets/wamak-logo.png` is 332×311px with an opaque white ground. It renders with `mix-blend-mode: multiply` on light surfaces and on a white plate over navy. Keep it ≤ 72px tall until the vector arrives.
- [ ] **White/reversed logo** for navy header states and the footer.
- [ ] **Horizontal logo lockup** (optional). The stacked lockup's "GOOD PRODUCTS • LASTING VALUE" line is unreadable at header size.
- [ ] **Favicon / app icon** (square mark). The default Next.js favicon is still in `src/app/favicon.ico`.
- [ ] **Exact brand colours** from the vector master. Current tokens are sampled from the PNG; re-run `node scripts/contrast.mjs` after updating them.

## Contact & business details (`src/content/site.ts` → `PENDING`)
- [ ] Business phone: `[BUSINESS PHONE TO BE CONFIRMED]`
- [ ] WhatsApp number: `null`, so no WhatsApp buttons render
- [ ] Final domain: `[DOMAIN TO BE CONFIRMED]` (needed for canonical URLs, sitemap, OG images, email sender)
- [ ] Office hours: `[OFFICE HOURS TO BE CONFIRMED]`
- [ ] Official social profile URLs (none shown until supplied)
- [ ] Registration details the client *wants published* (trade licence, BIN/VAT, TIN, ERC/IRC). Nothing is shown until supplied.

## Photography (every image slot is currently a `MaterialPlaceholder`)
- [ ] Real product photography for all 8 divisions (no stock images could be downloaded in the build environment, and none that imply WAMAK facilities will ever be used)
- [ ] Artwork photography. This is the highest priority because the `canvas` placeholder is the weakest stand-in.
- [ ] Leadership portraits: Md. Wazed Ali (Chairman), Khandaker Maruf Hossain (Managing Director). Monograms are shown until then.

## Product data (`src/content/categories.ts`, `src/content/products.ts`)
- [ ] Confirm the product list per division. Names come from the company brief. Please remove anything WAMAK cannot currently supply.
- [ ] Featured products on the homepage (currently 10, flagged `featured: true`). Confirm which products to lead with.
- [ ] Art sizes: the brief mentions 30×24, 36×24 and 48×36 in. These are **not published** until confirmed as standard sizes.
- [ ] Any verified specifications per product. Spec tables show Dimensions, Material, Colour and finish, and Packing as "Confirmed on request" until values are added to `specs` in `products.ts`.
- [ ] Product feature bullets (3 per product), written from the brief's descriptions. Please confirm they are accurate.
- [ ] Category page lists in `categories.ts`: "Who buys this", "Customization and private label", "Packaging" and "What to include in your requirement".
- [ ] Private-label availability per product (the `privateLabel` flag). Currently off for sisal fibre and yarn, traditional handicrafts, art, agriculture and seafood.
- [ ] Category FAQs in `src/content/faqs.ts` (2–3 per category) and the general FAQs.
- [ ] Art gallery filter tags (medium and subject) per painting type.

## Copy needing approval
- [ ] Hero headline "Reliable sourcing from Bangladesh, built for global buyers." (from the brief; confirm)
- [ ] Leadership messages (Phase 5). These will be drafted and marked `[DRAFT — REQUIRES APPROVAL BY CHAIRMAN/MD]`.
- [ ] Target-market wording: the homepage shows **regions only**. Named countries from the brief are not shown.
- [ ] Homepage section copy in `src/content/home.ts`, especially:
  - "More than products" chapter (8 coordination points)
  - the 6 "Why WAMAK" benefits
  - the material story ("Grown, retted, spun and woven by hand")
  - "Led from Dhaka" (states the head office is in West Dhanmondi)

## Lead delivery (forms)
- [ ] **Resend account + verified sending domain.** Set `RESEND_API_KEY` and `LEAD_FROM_EMAIL` (e.g. `quotes@<domain>`). Until then, submissions are only written to the server log.
- [ ] `LEAD_NOTIFY_EMAIL` defaults to wamakgroup@gmail.com. Confirm, or name a team inbox.
- [ ] Optional CRM: set `LEAD_WEBHOOK_URL` (HubSpot, Zoho, Make or Zapier). It receives the same fields as the email, as JSON.
- [ ] **Hosting upload limit.** Specification uploads allow 10MB, but Vercel functions accept at most 4.5MB. Set `NEXT_PUBLIC_MAX_UPLOAD_MB=4` on Vercel, or add direct-to-storage uploads later.
- [ ] Wording of the buyer confirmation email (in `src/lib/lead-delivery.ts`).
- [ ] The consent checkbox links to `/privacy`. The privacy notice text needs client or legal review (Phase 5 draft).

## Downloads
- [ ] Product catalogue PDF (slot to be built in Phase 5)

## Pages linked but not yet built
- [ ] Links to services, about, resources, commercial terms and legal pages return 404 until Phase 5.
- [ ] "Download catalogue" links to `/resources/catalogue` (Phase 5). No PDF exists yet.

## Photography slots added in Phase 3
- [ ] Each product has 3 gallery slots: the main product shot, a close-up, and a packed or in-use view. See `images.ts` for the brief for each slot.

## Temporary pages
- [ ] `/styleguide` is internal (`noindex`). Decide whether to keep it or remove it before launch.
