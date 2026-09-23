# Content to-do

Everything on the site that is a placeholder, temporary, or needs client verification.
Updated at the end of every phase. Last update: **Phase 2**.

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
- [ ] Any verified specifications per product (every spec field currently reads "Specification confirmed on request").

## Copy needing approval
- [ ] Hero headline "Reliable sourcing from Bangladesh, built for global buyers." (from the brief; confirm)
- [ ] Leadership messages (Phase 5). These will be drafted and marked `[DRAFT — REQUIRES APPROVAL BY CHAIRMAN/MD]`.
- [ ] Target-market wording: the homepage shows **regions only**. Named countries from the brief are not shown.
- [ ] Homepage section copy in `src/content/home.ts`, especially:
  - "More than products" chapter (8 coordination points)
  - the 6 "Why WAMAK" benefits
  - the material story ("Grown, retted, spun and woven by hand")
  - "Led from Dhaka" (states the head office is in West Dhanmondi)

## Downloads
- [ ] Product catalogue PDF (slot to be built in Phase 5)

## Pages linked but not yet built
- [ ] Nav and footer links to products, services, about, resources, contact, request-quote and legal pages return 404 until Phases 3–5.
- [ ] "Download catalogue" links to `/resources/catalogue` (Phase 5). No PDF exists yet.

## Temporary pages
- [ ] `/styleguide` is internal (`noindex`). Decide whether to keep it or remove it before launch.
