# WAMAK GROUP — design plan

Status: Phase 2, Checkpoint 2. Live references: `/` (homepage) and `/styleguide`.

## 1. Concept

**Natural material, handled with precision.**

Bangladesh's material culture (golden jute, plied sisal, loofah, handwork, the delta's water and
harvest) paired with the calm order of a serious trade partner. Images carry the warmth. The
interface around them stays quiet: navy, ivory, generous space, exact alignment.

A procurement director should feel two things in the first screen:
1. *These people know the material* (tactile, specific imagery and language).
2. *These people will handle my order properly* (order, clarity, a visible process, no hype).

### The one device: the fibre thread
One fine, continuous jute thread with a single small loop. It is the only decorative element.

| Where | Behaviour |
|---|---|
| Home hero | Draws itself once on load (≤ 1.2s together with the headline reveal). It stitches the three material images together and runs off the page edge towards the world. It never crosses text. |
| How we work | A vertical spine linking 10 steps. Fills with scroll progress (scroll-linked, never scroll-jacked). |
| Global markets | Route lines from Bangladesh towards the five target regions. |
| Category heroes | A thin divider under the hero. Cropped at the edges, never stretched, so the loop keeps its shape. |

Reduced motion: the thread is simply present, fully drawn.

## 2. Palette

Provisional values sampled from the logo. Full audit in `docs/contrast.md`.

| Token | Hex | Role |
|---|---|---|
| navy-900 | #05245C | Brand, headings, header, primary buttons, navy chapters |
| navy-950 | #031738 | Footer, deepest sections |
| leaf-500 | #3C9426 | Thread, logo leaf, graphics only |
| leaf-700 | #287433 | Links and focus ring on light surfaces |
| ivory-50 | #F7F5EE | The page |
| jute-300 | #C9A66B | Material accent, fine rules, highlights and focus ring on navy |
| ink-900 | #1B222B | Body text |
| mist-100 | #E9EEF3 | Cool secondary surfaces (forms, RFQ panels) |
| white | #FFFFFF | Cards on ivory, form fields |

Supporting: `ink-600` (secondary text), `jute-700` (jute-toned text on light), `navy-200`
(secondary text on navy), `navy-800` (hover), `field` (input borders, ≥ 3:1), `line` (decorative
hairlines), `danger` (errors).

Proportion guide per page: about 70% ivory/white, 25% navy, 5% jute. Leaf appears as a thread and
in link states only.

## 3. Type

Manrope (display, headings) + Inter (body, UI), self-hosted with `next/font`.

| Style | Size (360 → 1440px) | Weight | Tracking | Leading |
|---|---|---|---|---|
| Display | 44 → 80px | 800 | −0.035em | 1.02 |
| H1 | 40 → 64px | 700 | −0.03em | 1.05 |
| H2 | 32 → 48px | 700 | −0.025em | 1.1 |
| H3 | 22 → 30px | 600 | −0.02em | 1.2 |
| Body L | 18 → 20px | 400 | 0 | 1.6 |
| Body | 16 → 17px | 400 | 0 | 1.6 |
| Small | 14px | 400/500 | 0 | 1.5 |

Hierarchy comes from size contrast and space, not decoration. Sentence case everywhere, with no
tracked-caps eyebrows and no highlighted words. Line length is capped at 70ch.

## 4. Layout principles

- 12 / 8 / 4 column grid, 1280px content max, full-bleed imagery allowed.
- Asymmetric splits (7/5, 5/7, 4/8), left-aligned text, deliberate grid-breaks for imagery.
- Section rhythm varies: tight (48–64px) for supporting strips, generous (96–128px) for chapters.
- Ivory and navy alternate as chapters. A navy block means "here is how we operate", not decoration.
- Radius: 4px controls, 12px image cards, 0 full-bleed. Borders, tone and space instead of shadows.
- Leading content is split into different shapes (large tile, list, split, table), never six identical cards.

## 5. Wireframes

### 5.1 Home hero, desktop 1440

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [logo]   Products▾ Services Why WAMAK Global markets About Resources Contact │
│                                                          [Request a quote]   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ◎ Dhaka, Bangladesh                             ┌───────────────┐ ┌──────┐  │
│                                                  │               │ │weave │  │
│  Reliable sourcing                               │               │ │      │  │
│  from Bangladesh, built                          │  jute fibre   │ └──────┘ ~~~~▶ off page
│  for global buyers.            (Display, 7 col)  │  macro  4:5   │   ~ᴑ~       │
│                                                  │         ~~~~~~~~~~/      │  │
│  WAMAK GROUP connects international buyers  ~~~~~~~~~~~/      │ ┌──────┐  │
│  with jute, natural fibres, … (Body L, 70ch)     │               │ │loofah│  │
│                                                  └───────────────┘ └──────┘  │
│  [Request a quote] [Explore products]  ⤓ Download catalogue    (mosaic 5 col)│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
  ~~~ = fibre thread: enters under the mosaic, crosses the large image, loops (ᴑ)
        in the gutter between the small images, exits right. Never over text.
```

### 5.2 Home hero, mobile 390

```
┌──────────────────────────┐
│ [logo]            [≡]    │
├──────────────────────────┤
│ ◎ Dhaka, Bangladesh      │
│ Reliable                 │
│ sourcing from            │
│ Bangladesh, built        │
│ for global buyers.       │
│ Body L intro …           │
│ [ Request a quote      ] │  full width
│ [ Explore products     ] │
│ ⤓ Download catalogue     │
│ ┌──────────┐ ┌────┐      │
│ │ jute 4:5 │ │    │ ~~▶  │  mosaic follows; thread still links the images
│ └──────────┘ └────┘      │
├──────────────────────────┤
│ [Request quote] sticky   │  sticky bottom bar (+WhatsApp only once a number exists)
└──────────────────────────┘
```

### 5.3 Products hub, desktop

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Products                                                                     │
│ Eight product families from Bangladesh,       Everything is quoted to your   │
│ and a sourcing desk for everything else.      specification. Filter by       │
│ (H1, 7 col)                                   material or use. (Body, 4 col) │
│                                                                              │
│ Division ▾   Material: [Jute] [Sisal] [Loofah] [Natural fibre] …   Use ▾     │
│ ──────────────────────────────────────────────────────────────────────────── │
│ ┌──────────────────────────────┐ ┌──────────────────────────────┐            │
│ │ Jute & eco-friendly    (4:5) │ │ Handicrafts & home décor     │  two large │
│ │ image                        │ │ image                        │  tiles     │
│ │ Name · one commercial line   │ │ Name · one commercial line   │            │
│ └──────────────────────────────┘ └──────────────────────────────┘            │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                              │
│ │ Sisal   │ │ Loofah  │ │ Art     │ │ Agri    │   smaller tiles             │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                              │
│ ┌─────────┐ ┌──────────────────────────────────────────────┐                 │
│ │ Seafood │ │ NAVY TILE  Don't see your product?           │                 │
│ └─────────┘ │ Tell us the specification.  [Send your req.] │                 │
│             └──────────────────────────────────────────────┘                 │
│ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ᴑ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ (thread divider)  │
│ How quotation works: 3 short steps  →  [Request a quote]                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

Filters only offer values that have content. Seafood and agriculture tiles carry a short,
calm "Seasonal and subject to destination regulations" note.

## 6. Imagery

- No real WAMAK photography yet, and the preview environment cannot download stock images, so
  every slot uses `MaterialPlaceholder`: seven material studies (fibre, weave, twine, loofah,
  harvest, tide, canvas). Each is labelled "Product photography to be supplied".
- `src/content/images.ts` (Phase 2) lists every slot with its alt text, aspect ratio, a
  description of the ideal real shot, and `status: "temp" | "final"`.
- Ratios: hero 16:9 desktop / 4:5 mobile, category 4:5, product 1:1.
- The logo is used as supplied. Because the PNG has an opaque white ground, it gets
  `mix-blend-mode: multiply` on light surfaces and a white plate on navy. The file itself is never
  edited. A vector master is requested in `CONTENT-TODO.md`.

## 7. Motion

| Moment | Spec |
|---|---|
| Hero load | Headline, intro and CTAs rise 8px and fade (600ms, 60–200ms stagger). Thread draws over 1.0s after a 0.2s delay, 1.2s in total. |
| Process spine | Scroll-linked stroke progress. No pinning. |
| Menus, accordions, drawer | 200–300ms, ease-out. |
| Buttons | Colour 200ms, 1px press. |
| Reduced motion | No animation. The thread is shown fully drawn. |

No fade-up on scroll, no parallax, no carousels, no loaders.

## 8. Self-critique: what looked generic, and what changed

I reviewed the first pass against the question *"would I build this for any exporter?"*

1. **Hero thread crossed the body copy.** The first render ran the thread across the whole hero, so
   it cut through the intro paragraph. That looked like a decorative swoosh. **Changed:** the thread
   is now anchored to the image mosaic. It stitches the three materials together and exits off the
   page edge, which reads as material that is connected and on its way out.
2. **50/50 hero split made a five-line headline** and pushed the CTAs below the fold at 1440×900.
   A symmetrical split is the default template move. **Changed:** 7/5 split. The headline sets in
   four lines, and all three CTAs sit in the first screen.
3. **Stretched divider distorted the loop** into a thin oval, like a stock squiggle. **Changed:** the
   divider is wider than any container and cropped at the edges, so the loop is always round.
4. **Sisal texture read as abstract scales,** not rope. **Changed:** it was redrawn as coiled
   three-ply rope with cylindrical shading.
5. **Monograms disappeared on navy.** **Changed:** added a deep tone, so the portrait card sits
   *on* the chapter instead of blending into it.
6. **Things removed before they were built,** because every generic exporter site has them:
   - a stats band ("20+ countries, 500+ products"), which the facts don't support;
   - a world map covered in pins, now replaced by thread routes to five regions labelled "Markets we welcome inquiries from";
   - six identical icon cards for "Why us", now an asymmetric list with a lead statement;
   - a container ship or handshake hero, now material macro photography;
   - a "Get in touch" CTA repeated in every block, now one primary action per block, with the RFQ always in the header.
7. **Known weak spot, still open:** the `canvas` (art) placeholder is the least convincing study.
   Real artwork photography should replace it first. It is flagged in `CONTENT-TODO.md`.

## 9. Open questions for the client

- Is a vector/SVG logo master (and a white-reversed version) available?
- Can we have the business phone and WhatsApp numbers, office hours and the final domain?
- Is there any real photography: products, samples, packing, the Dhaka office? Even phone photos help with art direction.
- Is there a catalogue PDF, or should we design one later?
- The project brief lists five target regions. The company brief also names countries. Should named countries appear, or regions only (recommended: regions only, to avoid implying active trade)?

## 10. Checkpoint 2: screenshot review (390 / 768 / 1280 / 1440)

What the self-review found, and the fixes:

| Found | Fix |
|---|---|
| The page was 2,792px wide at 1440px. Screen-reader-only text inside the product scroller escaped its `overflow` container. | Cards are now `position: relative`. An overflow check runs in every screenshot pass and in the tests. |
| The header logo showed a white box. `mix-blend-mode` had nothing to blend with inside the sticky header's transparent stacking context. | The header is always solid ivory. It still reads as transparent over the ivory hero, and a hairline appears on scroll. |
| The material-story text panel was painted under the full-bleed image. | The panel is layered above the image. The image caption moved to the top-right corner, so the panel never hides it. |
| The jute and handicrafts tiles differed in height by about 8px, so their names didn't align. | The lead pair shares one image height on desktop. |
| Small division tiles were cramped at two per row on phones. | Below 640px they become rows with the image on the left. |
| The chapter headline wrapped to five lines, and the jute rules grew in width, which looked accidental. | The title column is wider, and the rules are now one consistent length. |
| Product placeholders repeated one texture across a row. | Textures alternate within a category. |
| The map was unreadable at 390px. | It's cropped and enlarged towards Bangladesh on phones. The region list below names all five regions. |
| The header "Request a quote" duplicated the sticky bar below 1280px. | Only one copy of the action shows at each breakpoint. |
| The footer Services column wrapped awkwardly. | The navigation now sits in a nested four-column grid. |

## 11. Checkpoint 3: product templates

- **Products hub:** Material and Use filters are generated from category data, so only values that actually have content appear. The navy sourcing tile is never filtered out. The page ends with a text index of every product.
- **Category template (one file, 8 entries):**
  - Page structure: hero with image, then the thread divider, commercial summary, range, buyers / customization / packaging, a navy requirement checklist, related services and FAQ, a closing CTA and related categories.
  - Variants: agriculture and seafood carry the required notice (seasonal, destination rules, specs confirmed, quote after review). Art becomes a gallery with a filter by real tags and a "Commission a painting" action. Customized sourcing replaces the range with the 5-step sourcing process.
- **Product template:**
  - A gallery with three slots and a `<dialog>` lightbox: arrow keys move between images, and Esc closes it and returns focus to the image that opened it.
  - The spec table lists standard rows marked "Confirmed on request". No Product schema is published, because there are no verified specs or prices.
  - Actions: quote this product, Add to RFQ, and Ask about private label (only where available). The sticky mobile bar carries the product into the RFQ.
- **RFQ list:**
  - A slide-over `<dialog>` drawer with a per-item "Quantity or notes" field and Remove. The list is stored in sessionStorage. A toast confirms each addition and offers "View list".
  - It never uses cart language, and shows no prices or checkout.
- **Review fixes:** H1s use non-breaking hyphens ("eco‑friendly"). Art placeholders vary their palette, so the gallery wall isn't one repeated image.

## 12. Checkpoint 4: RFQ and forms

- **RFQ wizard (`/request-quote`)**
  - Three steps with a progress bar (`aria-current="step"`). When the step changes, focus moves to the new step's heading. Errors are specific, appear under the field, and focus goes to the first problem in on-screen order.
  - Required fields: product or category, quantity, destination country, company, contact name, business email and consent. Everything else is optional or tucked into the "Packaging, customization and files" panel.
  - Prefills come from the RFQ list, `?product=`, `?category=`, `?privateLabel=1` and the homepage quick inquiry. Progress is saved to sessionStorage and survives a reload.
  - Step 3 shows a "Your request so far" summary, with Edit links back to the earlier steps.
- **Server actions:** checks run in this order:
  1. Honeypot. A bot that fills the hidden field gets a normal-looking success and no lead is sent.
  2. Per-IP rate limit (5 per 10 minutes).
  3. The same zod schema the browser used.
  4. File checks: type, size, and the file's first bytes must match its claimed type.
  5. Delivery.
- **Delivery:** Resend sends an internal email (reply-to the buyer, file attached, source page and UTM tags included) and a buyer confirmation. An optional JSON webhook carries the same fields. Without keys, the lead is written to the server log, so local development works.
- **Thank-you page:** shows the reference, what was sent, and what happens next. The summary lives only in that browser tab's session storage.
- **Contact page:** details list, a lightweight location card that links to Google Maps (no heavy map embed), and a contact form with `?topic=catalogue` prefill.
- **Tests:** Journeys A–C run end to end on desktop and mobile. They check the exact webhook payload WAMAK would receive: products with notes, source page, UTM tags and attachment.

## 13. Checkpoint 5: remaining pages

- **Built:** services hub and 7 service pages, How we work (the thread process with "What you provide" at each step), Why WAMAK, Global markets (the map plus "What changes by destination"), Commercial terms (with a navy Incoterms chapter), About (profile, mission, vision, values, leadership), Leadership messages (marked as drafts), Catalogue, Gallery, FAQ (grouped, with FAQPage JSON-LD), Careers, Privacy, Terms, Accessibility, and a designed 404.
- **Honesty guards:**
  - The catalogue download appears only once `catalogueUrl` is set.
  - The gallery shows only photos marked `final`.
  - Proof blocks (testimonials, logos, figures) render nothing while empty.
  - Insights and case studies 404 and are linked nowhere.
- **Review fixes:**
  - The link green failed contrast on the sunken ivory background (4.47:1), a pair the audit never checked. The `leaf-700` token was tuned from #2B7A35 to #287433 (4.85:1 there, 5.29:1 on ivory), and the audit now covers every `ivory-100` pair.
  - The page hero now has consistent spacing after the divider.
  - The How we work intro no longer repeats its H1.
- **Tests:** a crawler follows every internal link from the main pages and confirms none returns a 404.

## 14. Final checkpoint: quality pass

- **SEO:**
  - `metadataBase` comes from `NEXT_PUBLIC_SITE_URL`. The Open Graph and Twitter defaults, a sitemap of 67 routes, and a `robots.txt` that blocks crawlers until a production URL exists are all in place.
  - Structured data: `Organization` JSON-LD (verified fields only), breadcrumbs and FAQ.
  - Branded share images in Manrope, with the thread kept clear of text. A first version ran it through the headline, and I moved it.
- **Performance:**
  - Placeholder textures and the map dots were inline SVG, repeated again in the page payload: the homepage HTML was 999KB. They are now static cached files loaded lazily: homepage 999KB → 252KB, category page 550KB → 190KB.
  - The favicon went from 145KB to 15KB, and the unused `motion` dependency was removed.
  - Lighthouse (mobile, simulated): performance 93–97; accessibility, best practices and SEO 100; CLS 0. Simulated LCP is 2.7–3.1s against an observed 0.1–0.3s, and it's driven by the framework's JavaScript baseline. Re-measure on Vercel.
- **Found and fixed:**
  - **Mobile quick inquiry:** clearing an error when a field lost focus shifted the layout at the exact moment the buyer tapped submit, so the tap missed the button. Errors now clear while the buyer types. The contact form now works the same way.
  - **Tapping before hydration:** a tap before the page's JavaScript loaded reloaded the homepage. The quick inquiry now submits natively to the wizard (without the email address) until JavaScript loads.
  - **Stale test server:** Playwright was reusing a leftover server that served an old build. It now refuses to reuse one.
  - **Layout overflow:** long unbroken words could widen grid layouts. Text now uses `overflow-wrap: anywhere`.
  - **Missing images:** a missing image entry used to throw an error. It now shows a labelled placeholder.
  - **Homepage canonical:** it was missing, and is now set.
- **Tests:** 119 Playwright checks, including an axe, SEO and 360px overflow crawl of every sitemap route, keyboard-only and skip-link paths, reduced motion, structured data, a content stress test, the no-JavaScript quick inquiry, and journeys A–E.
