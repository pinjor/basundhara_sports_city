# WAMAK GROUP website

B2B website for WAMAK GROUP (Dhaka, Bangladesh). The buyer's path runs from product discovery, through capability and commercial fit, to a Request for Quotation.

| Document | What it's for |
|---|---|
| [`docs/handoff.md`](./docs/handoff.md) | **Start here.** Editing content, adding products, replacing images and the logo, environment variables, deploying to Vercel |
| [`CONTENT-TODO.md`](./CONTENT-TODO.md) | Launch blockers and everything awaiting client input |
| [`CLAUDE.md`](./CLAUDE.md) | Verified facts, truth rules, design system, quality gates |
| [`docs/design-plan.md`](./docs/design-plan.md) | Design rationale and the review log for each checkpoint |
| [`docs/contrast.md`](./docs/contrast.md) | WCAG contrast audit (`npm run contrast`) |
| [`docs/analytics-events.md`](./docs/analytics-events.md) | GA4 events |

```bash
npm install
npm run dev            # http://localhost:3000, design system at /styleguide
npm run build && npm run test:e2e
```
