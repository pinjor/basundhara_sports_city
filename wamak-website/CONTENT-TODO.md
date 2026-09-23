# Content to-do

Everything on the site that is a placeholder, temporary, or needs client verification.
Updated at the end of every phase. Last update: **Phase 1**.

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

## Copy needing approval
- [ ] Hero headline "Reliable sourcing from Bangladesh, built for global buyers." (from the brief; confirm)
- [ ] Leadership messages (Phase 5). These will be drafted and marked `[DRAFT — REQUIRES APPROVAL BY CHAIRMAN/MD]`.
- [ ] Target-market wording: regions only, or named countries as in the company brief?

## Downloads
- [ ] Product catalogue PDF (slot to be built in Phase 5)

## Temporary pages
- [ ] `/` is a Phase 1 holding page and is replaced in Phase 2.
- [ ] `/styleguide` is internal (`noindex`). Decide whether to keep it or remove it before launch.
