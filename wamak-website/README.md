# WAMAK GROUP website

B2B website for WAMAK GROUP (Dhaka, Bangladesh): product discovery → capability → commercial fit → Request for Quotation.

- Project rules and verified facts: [`CLAUDE.md`](./CLAUDE.md)
- Design plan: [`docs/design-plan.md`](./docs/design-plan.md), contrast audit: [`docs/contrast.md`](./docs/contrast.md)
- Placeholders awaiting client input: [`CONTENT-TODO.md`](./CONTENT-TODO.md)

## Develop

```bash
npm install
cp .env.example .env.local   # optional; forms log to the console without keys
npm run dev                  # http://localhost:3000, design system at /styleguide
```

## Check

```bash
npm run lint && npm run typecheck
npm run build && npm run test:e2e      # axe + overflow checks via Playwright
npm run screenshots -- /styleguide screenshots 390 768 1280 1440   # needs a running server on :3100
```
