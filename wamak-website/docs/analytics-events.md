# Analytics events

Sent through `track()` in `src/lib/analytics.ts`. It does nothing unless `NEXT_PUBLIC_GA_ID` is set.
GA4 loading is wired up in Phase 4. No personal data (names, emails) is ever sent as an event parameter.

| Event | When | Parameters | Status |
|---|---|---|---|
| `add_to_rfq` | Buyer adds a product to the RFQ list | `product`, `category` | Live (Phase 2) |
| `quick_inquiry_submit` | Homepage quick inquiry passes validation | `country` | Live (Phase 2) |
| `whatsapp_click` | WhatsApp button pressed (only renders once a number exists) | `location` | Live, hidden |
| `rfq_start` | RFQ wizard opened | `source` | Phase 4 |
| `rfq_step_complete` | Wizard step completed | `step` | Phase 4 |
| `rfq_submit` | RFQ sent | `items`, `incoterm` | Phase 4 |
| `spec_upload` | Specification file attached | `type` | Phase 4 |
| `contact_submit` | Contact form sent | `topic` | Phase 4 |
| `catalogue_download` | Catalogue downloaded | — | Phase 5 |
| `product_view` | Product page viewed | `product`, `category` | Phase 3 |
| `category_view` | Category page viewed | `category` | Phase 3 |
| `email_click` | `mailto:` link pressed | `location` | Phase 4 |
| `phone_click` | Phone link pressed (once a number exists) | `location` | Phase 4 |
