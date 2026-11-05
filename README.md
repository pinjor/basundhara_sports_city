# ABG Sports City — Digital Management Platform

Production-grade operations platform for staff running the ABG
Sports City complex day to day: venue managers, gate officers, hospitality
teams, F&B outlets, parking marshals and fleet dispatchers. This is **not**
the visitor-facing consumer app referenced in the brand pitch — it's the
internal Command Centre.

Built as a monorepo:

```
apps/api      NestJS + Prisma + PostgreSQL — REST API, auth/RBAC, audit log
apps/web      React + Vite + TypeScript + Tailwind — the Command Centre UI
packages/shared  Design tokens, RBAC roles, domain enums, nav IA, DTOs
                 shared between api and web so both stay in lockstep
```

## Delivery status — Phase 4 of 5

This build follows the phased delivery plan. **Phases 1 through 4 are
complete and fully functional end-to-end** — all 12 in-scope modules are
built and live, not a disconnected demo:

**Phase 1 — Foundation**
- ✅ JWT auth with role-based access control (9 roles, Section 3 of the spec)
- ✅ Audit logging — every mutating action is attributed to a user and timestamped
- ✅ Design system matching the brand's dark navy/gold tokens exactly, with
  Big Shoulders Display + Inter typography
- ✅ Command Centre shell with live KPIs and a merged activity feed
- ✅ **Zones & Complex Map** — full CRUD, status transitions, schematic
  complex map with live occupancy, audit trail per zone
- ✅ **Venues & Facilities** — full CRUD, a real status state machine
  (Available → Reserved → In Use → Maintenance, enforced server-side),
  audit trail per facility

**Phase 2 — Core guest journey**
- ✅ **Bookings & Reservations** — full CRUD, server-side conflict detection
  (rejects overlapping slots on the same facility/day), a status state
  machine (Pending → Confirmed → Completed/Cancelled/No-show), payment
  status tracking, QR confirmation code
- ✅ **Gym, Pool & Membership** — full CRUD, check-in (increments count,
  blocked unless Active), renew, a status state machine (Active/Frozen/Expired)
- ✅ **Access Control & Gates** — gate online/offline toggle, a scan endpoint
  that denies every credential while a gate is offline, a live merged
  access-log feed across all gates
- ✅ **Visitors & Guests** — registration, check-in/check-out state machine,
  QR visitor pass, escort flag

**Phase 3 — Hospitality & commercial**
- ✅ **VIP/VVIP & Protocol** — arrival-sequence timeline, an
  Scheduled → Arrived → Departed state machine, and a privacy flag that
  hides a guest from every role except Protocol Officer and Super Admin
  (enforced server-side, not just hidden in the UI)
- ✅ **Hospitality & Lounges** — lounge capacity cards with party
  check-in/out (occupancy clamps to capacity and flips the lounge to "At
  Capacity" automatically), a service-request Kanban (Pending → Preparing
  → Delivered)
- ✅ **Restaurant & Concessions** — outlet open/closed toggle (closed
  outlets reject new orders server-side), an order Kanban (Order Received
  → Preparing → Ready for Pickup → Delivered)

**Phase 4 — Logistics & surface ops**
- ✅ **Parking** — zone occupancy cards, vehicle entry/exit logging that
  clamps to capacity and rejects entry once a zone is full
- ✅ **Transport & Fleet** — vehicle status cards, a trip request that
  auto-dispatches the nearest Available vehicle and rejects the request if
  none are free, a trip Kanban (Requested → In Progress → Completed) that
  returns the vehicle to Available on completion
- ✅ **Surfaces & Equipment** — per-facility surface condition and closure
  state machine (Open ↔ Closed for Maintenance/Recovery, enforced
  server-side), an equipment inventory table

All 12 in-scope modules (Section 4 of the spec) are now built — only
Phase 5's real-time layer and hardening pass remain.

| Phase | Modules | Status |
|---|---|---|
| 1 | Auth/RBAC, Zones, Facilities | ✅ Done |
| 2 | Bookings, Membership, Access Control, Visitors | ✅ Done |
| 3 | VIP/Protocol, Hospitality/Lounges, Restaurant/Concessions | ✅ Done |
| 4 | Parking, Fleet, Surfaces & Equipment | ✅ Done |
| 5 | Real-time (WebSockets), offline-tolerant gates, load/security/a11y hardening | Not started |

## Running locally

One command builds the images and starts Postgres, Redis, the API, and the web app. It also migrates and seeds an empty database.

Host ports stay off 80, 3306, and 5432:

| Service | URL |
|---|---|
| Web | http://localhost:18480 |
| API | http://localhost:18481/api |
| Postgres | localhost:18432 |
| Redis | localhost:18479 |

```bash
npm run docker:up
```

Stop with `npm run docker:down`.

### Host dev servers (optional)

```bash
cp apps/api/.env.example apps/api/.env
bun install
bun run db:migrate
bun run db:seed
bun run dev
```

`bun run dev` uses the same web port 18480 and API port 18481. Do not run it while `docker:up` is serving those ports. Postgres for that path is `localhost:18432` in `apps/api/.env.example`.

Seed accounts (password for all: `Password123!`):

| Email | Role |
|---|---|
| admin@bsc.com.bd | Super Admin |
| venue.manager@bsc.com.bd | Venue / Facility Manager |
| bookings@bsc.com.bd | Bookings Officer |
| gate.officer@bsc.com.bd | Gate / Security Officer |
| protocol@bsc.com.bd | Protocol Officer |
| hospitality@bsc.com.bd | Hospitality Lead |
| parking@bsc.com.bd | Parking Marshal |
| fleet@bsc.com.bd | Fleet Dispatcher |
| executive@bsc.com.bd | Read-only Executive |

## Design system

Tokens live in `packages/shared/src/tokens.ts` and are mirrored into
`apps/web/tailwind.config.js`. Do not introduce colors or fonts outside this
set — see Section 2 of the product spec for the rationale (grounded in the
brand's night-lit stadium photography, not generic SaaS dashboard defaults).

## RBAC model

Enforced at the API layer (`RolesGuard` + `@Roles()` decorator per endpoint)
and reflected in the UI (sidebar dims modules a role can't reach). Read-only
Executive can `GET` everything but no writes; Super Admin bypasses all
checks. See `packages/shared/src/roles.ts`.
