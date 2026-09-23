# Analytics events

Sent through `track()` in `src/lib/analytics.ts`. It does nothing unless `NEXT_PUBLIC_GA_ID` is set.
GA4 loads through `@next/third-parties` in the root layout, and only when `NEXT_PUBLIC_GA_ID` is set. No personal data (names, emails) is ever sent as an event parameter.

| Event | When | Parameters | Status |
|---|---|---|---|
| `add_to_rfq` | Buyer adds a product to the RFQ list | `product`, `category` | Live (Phase 2) |
| `quick_inquiry_submit` | Homepage quick inquiry passes validation | `country` | Live (Phase 2) |
| `whatsapp_click` | WhatsApp button pressed (only renders once a number exists) | `location` | Live, hidden |
| `rfq_start` | RFQ wizard opened | `source` | Live (Phase 4) |
| `rfq_step_complete` | Wizard step completed | `step` | Live (Phase 4) |
| `rfq_submit` | RFQ sent | `items`, `incoterm` | Live (Phase 4) |
| `spec_upload` | Specification file attached | `type` | Live (Phase 4) |
| `contact_submit` | Contact form sent | `topic` | Live (Phase 4) |
| `catalogue_download` | Catalogue downloaded | — | Phase 5 |
| `product_view` | Product page viewed | `product`, `category` | Live (Phase 3) |
| `category_view` | Category page viewed | `category` | Live (Phase 3) |
| `email_click` | `mailto:` link pressed (contact page) | `location` | Live (Phase 4) |
| `phone_click` | Phone link pressed (once a number exists) | `location` | Phase 4 |
