# Content to-do

Everything on the site that is a placeholder, temporary, or needs client verification.
Final version at handoff (**Phase 6**). How to make each change is in `docs/handoff.md`.

## A. Launch blockers
These must be done before the site goes public.

- [ ] **Domain.** Register or confirm it, then set `NEXT_PUBLIC_SITE_URL`. Until then, `robots.txt` blocks search engines, and canonical and share URLs point to a placeholder.
- [ ] **Email delivery.**
  - Create a Resend account and verify the sending domain.
  - Set `RESEND_API_KEY` and `LEAD_FROM_EMAIL`.
  - Confirm `LEAD_NOTIFY_EMAIL` (default wamakgroup@gmail.com).
  - Without these, RFQs and messages are only written to the server log.
- [ ] **Upload limit on Vercel.** Set `NEXT_PUBLIC_MAX_UPLOAD_MB=4`, because Vercel functions accept at most 4.5MB.
- [ ] **Privacy notice and Terms of use.** Both need legal review; they show `[DRAFT — REQUIRES LEGAL REVIEW BEFORE LAUNCH]`. The privacy notice also needs a data retention period.
- [ ] **Leadership messages.** They need approval by the Chairman and the MD. Remove the draft badges once approved (`about/leadership/page.tsx`).
- [ ] **Business phone number.** It shows `[BUSINESS PHONE TO BE CONFIRMED]` in the footer and on the contact page.
- [ ] **Office hours.** They show `[OFFICE HOURS TO BE CONFIRMED]` on the contact page.
- [ ] **Product catalogue PDF.** Add the file, then set `PENDING.catalogueUrl`. Until then, "Download catalogue" leads to a "being prepared" page with a request option.

## B. Brand assets
- [ ] **Logo vector master (SVG, AI or EPS).** The current PNG is 332×311px with a white ground. It renders with `mix-blend-mode: multiply` on light surfaces and on a white plate over navy.
- [ ] **White or reversed logo** for the navy footer and menus.
- [ ] **Horizontal lockup** (optional). "GOOD PRODUCTS • LASTING VALUE" is unreadable at header size.
- [ ] **Exact brand colours** from the vector. The current tokens are sampled from the PNG. Update them, then run `npm run contrast`.
- [x] Favicon and app icon: generated from the supplied logo, which is not redrawn (`npm run build:icons`). Regenerate once the vector exists.

## C. Photography
Every image slot currently shows a labelled material placeholder. The briefs are in `src/content/images.ts`.

- [ ] Product photography for all 8 divisions: 3 slots per product (main shot, close-up, and packed or in-use).
- [ ] Artwork photography. This is the highest priority, because the canvas placeholder is the weakest stand-in.
- [ ] Category hero images (8), plus the homepage hero mosaic (3), material story and catalogue images.
- [ ] Leadership portraits: Md. Wazed Ali and Khandaker Maruf Hossain. Monograms are shown until then.
- [ ] Never use photos that imply WAMAK facilities, staff, ships or customers unless they genuinely are WAMAK's.

## D. Business details (`src/content/site.ts` → `PENDING`)
- [ ] WhatsApp number. It is `null`, so no WhatsApp buttons render; setting it enables the mobile WhatsApp button.
- [ ] Official social profile URLs. None are shown until supplied.
- [ ] Registration details the client wants published (trade licence, BIN/VAT, TIN, ERC/IRC). Nothing is shown until supplied.

## E. Product data needing confirmation
- [ ] **Product list per division** (`products.ts`). Names come from the company brief; remove anything WAMAK cannot currently supply.
- [ ] **Homepage featured products** (currently 10, marked `featured: true`).
- [ ] **Feature bullets** (3 per product): confirm they are accurate.
- [ ] **Verified specifications.** All spec rows currently read "Confirmed on request".
- [ ] **Private label per product.** It is off for sisal fibre and yarn, traditional handicrafts, art, agriculture and seafood.
- [ ] **Art sizes.** The brief mentions 30×24, 36×24 and 48×36 in; these are not published until confirmed.
- [ ] **Art filter tags** (medium and subject) per painting type.

## F. Copy needing approval
- [ ] **Homepage** (`home.ts`):
  - the hero, which is from the brief;
  - "More than products" (8 coordination points);
  - the 6 Why WAMAK benefits;
  - the material story;
  - "Led from Dhaka".
- [ ] **Category pages** (`categories.ts`): "Who buys this", "Customization and private label", "Packaging", "What to include in your requirement", and each intro.
- [ ] **FAQs** (`faqs.ts`): the general questions and 2–3 per category.
- [ ] **Services** (`services.ts`): the "What we coordinate" and "What you provide" lists. Confirm especially "third-party inspection on request" and "shipment tracking updates".
- [ ] **About:** profile, mission, vision and value explanations, adapted from the brief.
- [ ] **Why WAMAK:** the 8 reasons and the audience list.
- [ ] **Global markets:** the region descriptions and "What changes by destination". Only regions are shown, not the brief's named countries.
- [ ] **Commercial terms:** the plain-language Incoterm summaries, which are not legal definitions.
- [ ] **Careers:** the "no open positions" wording.
- [ ] **Buyer confirmation email** wording (`src/lib/lead-delivery.ts`).

## G. Hidden until real content exists (no action needed)
- Testimonials, client logos and key figures (`src/content/proof.ts`) render nothing while empty. Add entries only with written approval and a named source.
- Insights (`/insights/<slug>`) and case studies (`/case-studies/<slug>`) are templates that return 404 and are linked nowhere while empty.
- The gallery shows only photos marked `final`.

## H. Housekeeping
- [ ] `/styleguide` is internal, excluded from search engines and blocked in `robots.txt`. Keep it as a living reference, or delete `src/app/styleguide/`.
- [ ] After the first production deploy, re-measure Lighthouse and PageSpeed on the real domain (see `docs/handoff.md` §9).
