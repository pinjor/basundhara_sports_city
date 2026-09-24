# WAMAK GROUP website: handoff guide

This guide is for whoever maintains the site next: developer, agency or in-house team. Read `CLAUDE.md` first.
It holds the verified facts, the truth rules and the design system in one page.

- **Stack:** Next.js 16 (App Router) with TypeScript, Tailwind CSS v4, react-hook-form with zod (RFQ and contact forms only), Resend for email, and Playwright with axe for tests.
- **Location:** the site lives in `wamak-website/` inside this repository.
- **Content:** all copy and data live in typed files under `src/content/`. There is no database or CMS yet. The files are structured so they can move to Sanity, headless WordPress or Webflow later without a redesign.

---

## 1. Run it

```bash
cd wamak-website
npm install
cp .env.example .env.local        # optional: without keys, forms log to the terminal
npm run dev                       # http://localhost:3000 (design system at /styleguide)
```

`npm run dev` and `npm run build` first generate the placeholder textures into `public/placeholders/`.
Those files are generated, not committed.

| Command | What it does |
|---|---|
| `npm run dev` | Local development |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` / `npm run typecheck` | Code checks |
| `npm run test:e2e` | Playwright: journeys A–E, axe on every sitemap route, keyboard, reduced motion, SEO checks. Build first. |
| `npx lhci autorun` | Lighthouse (mobile) on key pages. Build first, with `NEXT_PUBLIC_SITE_URL` set, see §9. |
| `npm run contrast` | Regenerates `docs/contrast.md` from the colour tokens |
| `npm run review -- <outDir> /route …` | Screenshots at 390, 768, 1280 and 1440 px, tiled for review |
| `npm run build:map` | Regenerates the world map data (only if the anchors change) |
| `npm run build:icons` | Regenerates the favicons from `assets/wamak-logo.png` |

---

## 2. Edit content

Everything visible comes from `src/content/`. Change the file, and the site updates on the next build.

| What | File |
|---|---|
| Company facts, address, email, leadership names, commercial wording | `site.ts` |
| Pending details: phone, WhatsApp, domain, office hours, catalogue PDF | `site.ts` → `PENDING` |
| Homepage copy | `home.ts` |
| Product families (8) | `categories.ts` |
| Products | `products.ts` |
| Services (7) | `services.ts` |
| About, leadership messages, Why WAMAK, How we work, markets, commercial terms, careers, catalogue | `pages.ts` |
| FAQs | `faqs.ts` |
| Navigation and footer | `navigation.ts` |
| Image slots | `images.ts` |
| Testimonials, client logos, key figures, insights, case studies | `proof.ts` (empty on purpose) |

**Truth rules still apply.** Add only facts the client has confirmed in writing. Leave anything unknown as a `PENDING` value, never an invented one.

### Pending details
- **Phone:** set `PENDING.phone` to the real number. It appears in the footer and on the contact page.
- **WhatsApp:** set `PENDING.whatsapp` to a number in international format (for example `+8801XXXXXXXXX`). The WhatsApp button then appears in the mobile action bar automatically. While the value is `null`, no WhatsApp button renders anywhere.
- **Catalogue:** put the PDF in `public/catalogue/` and set `PENDING.catalogueUrl` (for example `/catalogue/wamak-group-catalogue.pdf`). The "Download catalogue (PDF)" button then appears, and each download is tracked.

### Leadership messages
When the Chairman and MD approve their messages:
1. Update the text in `pages.ts` → `leadershipMessages`.
2. Remove the `<DraftBadge />` line in `src/app/(site)/about/leadership/page.tsx`.

### Proof: testimonials, logos, figures, case studies, insights
Add entries to the arrays in `proof.ts` **only with the client's written approval and a named source**.
- The testimonials, client-logo and key-figure blocks render nothing while their arrays are empty. Once an array has entries, the block appears on the homepage.
- Insights and case studies have templates at `/insights/<slug>` and `/case-studies/<slug>`. They return 404 and are linked nowhere until entries exist. Add navigation links when you publish the first one.

---

## 3. Add a product

1. Open `src/content/products.ts`. Add a line to the right family:
   ```ts
   p("loofah-bath", "loofah-soap-pads", "Loofah soap pads", "One honest commercial sentence.", ["Feature", "Feature", "Feature"]),
   ```
   Options: `{ featured: true }` shows it on the homepage row, `{ privateLabel: false }` hides "Ask about private label", and `tags` feeds the art gallery filters.
2. Specifications: add **verified** values to `specs`, e.g. `specs: [{ label: "Dimensions", value: "12 × 8 cm" }]`, using the labels in the product page's `SPEC_ROWS`. Anything missing reads "Confirmed on request".
3. Images: the product gets three placeholder slots automatically (`product-<slug>`, `-detail`, `-packed`). See §4 to replace them with photos.
4. Nothing else is needed. The product page, category listing, products index and sitemap all update, and the product can be added to the RFQ list straight away.

To add a **new product family**, add an entry to `categories.ts`. Its slug must also be added to `categorySlugs`. Then add its FAQs to `faqs.ts` (TypeScript will flag the missing key).

---

## 4. Replace images and the logo

### Product and page photography
Every image slot is listed in `src/content/images.ts`, with alt text, aspect ratio and a photographer's brief.
1. Add the photo to `public/images/`, e.g. `public/images/products/jute-tote-bags.jpg`. Large, sharp JPGs are fine: Next.js serves resized AVIF and WebP automatically.
2. Find the entry by `id` and set:
   ```ts
   status: "final", src: "/images/products/jute-tote-bags.jpg", width: 2000, height: 2000,
   ```
3. Check the `alt` text describes the real photo.

A slot with `status: "final"` renders the photo; otherwise it shows a labelled material placeholder. The gallery page lists only `final` photos.
**Never** use photos that imply WAMAK facilities, staff, ships or customers unless they are genuinely WAMAK's.

### Logo
The site uses the supplied PNG unchanged (`assets/wamak-logo.png`, copied to `public/brand/`).
- **When a vector master arrives:** save it as `public/brand/wamak-logo.svg`. In `src/components/brand/Logo.tsx`, set `LOGO.src` to the SVG and update `width` and `height` to its proportions. Then remove the white-plate treatment for dark surfaces if a reversed version is supplied.
- **Favicons** (`src/app/icon.png`, `apple-icon.png`) and **share images** (`src/lib/og.tsx`) are generated from `assets/wamak-logo.png`. Replace that file, then run `npm run build:icons`, or export the icons from the vector master.

### Brand colours
Tokens live in `src/app/globals.css` (`@theme`). If the vector master gives exact values:
1. Update the tokens there.
2. Update the same values in `scripts/contrast.mjs`.
3. Run `npm run contrast` and check nothing fails.

---

## 5. Forms and leads

The RFQ wizard and the contact form post to server actions (`src/lib/actions/`). Each submission is handled in this order:

1. **Honeypot:** a bot that fills the hidden field gets a normal-looking success, and no lead is sent.
2. **Rate limit:** 5 submissions per 10 minutes per IP. The counter is kept per server instance; for several instances, swap in Upstash Redis.
3. **Validation:** the same zod schemas the browser uses (`src/lib/validators.ts`).
4. **File check** (RFQ only): PDF, JPG or PNG, where the type, the size and the file's first bytes must agree.
5. **Delivery** (`src/lib/lead-delivery.ts`):
   - an email to WAMAK, with reply-to set to the buyer, the file attached, and the source page and UTM tags;
   - a confirmation email to the buyer;
   - an optional JSON webhook for a CRM.

   Without keys, the lead is written to the server log.

| Env var | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend API key. Verify the sending domain in Resend first. |
| `LEAD_FROM_EMAIL` | Verified sender, e.g. `WAMAK GROUP <quotes@yourdomain.com>` |
| `LEAD_NOTIFY_EMAIL` | Who receives leads (default `wamakgroup@gmail.com`) |
| `LEAD_WEBHOOK_URL` | Optional CRM endpoint (HubSpot, Zoho, Make, Zapier) |
| `NEXT_PUBLIC_MAX_UPLOAD_MB` | Upload limit. **Set `4` on Vercel**, whose functions accept at most 4.5MB. Default 10. |
| `RATE_LIMIT_MAX` | Submissions per 10 minutes per IP (default 5) |

The webhook receives the same fields as the email:
`{ kind: "rfq" | "contact", ref, submittedAt, fields: { "Company": "…", "Quantity": "…", … } }`.

The homepage quick inquiry also works before JavaScript loads. It submits product, quantity and country to `/request-quote` by GET, but never the email address.

---

## 6. Analytics

Set `NEXT_PUBLIC_GA_ID` (GA4 measurement ID). Nothing loads without it. The events are listed in `docs/analytics-events.md`. No names or email addresses are ever sent to analytics.

---

## 7. SEO

- **`NEXT_PUBLIC_SITE_URL`:** set it to the production URL, e.g. `https://www.wamakgroup.com`. It drives canonical URLs, Open Graph URLs, the sitemap and structured data.
- **`robots.txt`:** blocks all crawlers until `NEXT_PUBLIC_SITE_URL` is set, and always on Vercel preview deployments. This keeps previews out of search results.
- **Sitemap:** `/sitemap.xml` lists every public route. Insights and case studies are added automatically once they exist.
- **Structured data:**
  - `Organization` on every page (verified fields only; the phone number is added once confirmed);
  - `BreadcrumbList` on inner pages;
  - `FAQPage` on the FAQ page.
  - There is deliberately **no `Product` schema**, because there are no verified specs or prices.
- **Share images:** generated per page family (`src/lib/og.tsx`).

---

## 8. Deploy to Vercel

1. In Vercel: **Add New… → Project** and import this repository.
2. Set **Root Directory** to `wamak-website`. The framework is detected as Next.js, and the install uses npm (`package-lock.json`).
3. Add the environment variables from §5–§7: at minimum `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_MAX_UPLOAD_MB=4`, plus the Resend variables once the domain is verified.
4. Deploy, then add the domain under **Settings → Domains**.
5. After the first production deploy, check the following:
   - send a real RFQ with an attachment, and confirm both emails arrive;
   - `https://<domain>/robots.txt` allows crawling;
   - submit `https://<domain>/sitemap.xml` in Google Search Console;
   - run PageSpeed Insights on the homepage and a product page (see §9).

Node.js 20.9 or later is required; Vercel's default is fine.

---

## 9. Quality status at handoff

- **Tests:** Playwright covers the following, on desktop (1440px) and mobile (390px, plus a 360px pass):
  - journeys A–E;
  - axe (WCAG 2.2 AA) on every sitemap route;
  - one H1, unique titles and descriptions, and a canonical on every page;
  - no horizontal overflow;
  - the keyboard-only path, skip link, reduced motion, structured data and content stress;
  - the no-JavaScript quick inquiry;
  - a crawl that confirms no internal link returns a 404.
- **Lighthouse (mobile, simulated slow 4G, local server):**
  - All four categories score 90 or above on every page tested. Accessibility, best practices and SEO are 100; performance is 93–97.
  - Cumulative layout shift is 0.
  - **LCP is 2.7–3.1s simulated**, just above the 2.5s target. The observed (unthrottled) LCP is under 0.3s, and the gap comes from the framework's JavaScript baseline plus simulated latency against a local server. Re-measure on the Vercel deployment, where edge caching removes most of the TTFB.
  - `lighthouserc.json` treats LCP as a warning, and the four category scores as hard failures.
- **Contrast:** every text and interface colour pair passes AA (`docs/contrast.md`).

---

## 10. Adding languages later (Bangla, Arabic)

- UI strings live in `src/content/`, not in components. Move them into per-locale files with the same shape.
- Layout uses logical properties (`ps-`, `pe-`, `ms-`, `start-`, `end-`), so the layout mirrors when `dir="rtl"` is set on `<html>` in `src/app/layout.tsx`.
- Add a Bangla-capable font next to Manrope and Inter in `layout.tsx` for Bangla.
- The Next.js internationalisation guide is in `node_modules/next/dist/docs/01-app/02-guides/internationalization.md`.
