# Arete

> **Arete** — an adaptive running-coach app that builds personalised, periodised training plans, generates GPS routes, syncs with your calendar, and responds intelligently to injuries and life getting in the way.
>
> See [`arete-spec.md`](./arete-spec.md) for the full product specification.

---

## This repository

This branch contains the **Phase 1 — Foundation** implementation: the
PostgreSQL data model and Prisma persistence layer that every other feature
builds on. It is a **pure schema + tooling** layer — no API endpoints, no UI,
no business logic.

Stack: **Node.js 20+ · TypeScript (strict) · Prisma 7 · PostgreSQL 16 · Vitest**

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | ≥ 20 | [nvm](https://github.com/nvm-sh/nvm) recommended |
| npm | ≥ 10 | Bundled with Node |
| Docker Desktop | any recent | Runs the Postgres containers |

---

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/magnuslchristensen/arete.git
cd arete
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

The defaults in `.env.example` match the Docker Compose services exactly — you
only need to fill in `CREDENTIAL_ENCRYPTION_KEY` (a 32-byte hex string):

```bash
# generate a key:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start Postgres

```bash
npm run db:up
# Starts two containers:
#   arete-db-1       → localhost:5432 (dev)
#   arete-db_test-1  → localhost:5433 (tests)
```

### 4. Apply migrations

```bash
npm run migrate
# Equivalent to: prisma migrate dev
# Applies prisma/migrations/..._init/migration.sql to the dev DB.
```

### 5. Seed the dev database

```bash
npm run seed
# Populates all 9 tables with representative data (idempotent — safe to re-run).
```

### 6. Run the tests

```bash
npm test
# Applies migrations to the test DB, runs 13 schema integration tests.
# All tests should pass in < 5 seconds.
```

---

## Project structure

```
arete/
├── arete-spec.md             # Product specification (source of truth)
├── prisma/
│   ├── schema.prisma         # Prisma schema — 16 enums + 9 entity models
│   ├── seed.ts               # Dev seed (all 9 tables)
│   └── migrations/
│       └── ..._init/
│           └── migration.sql # Initial migration (all tables + indexes)
├── prisma.config.ts          # Prisma 7 connection config (PrismaPg adapter)
├── src/
│   ├── index.ts              # Re-exports (entry point placeholder)
│   └── db/
│       ├── client.ts         # Singleton PrismaClient + newId() (UUID v7)
│       ├── generated/        # Prisma-generated client (git-ignored)
│       └── __tests__/
│           ├── setup.ts      # Vitest global setup (migrate test DB)
│           ├── helpers.ts    # createTestClient(), truncateAll(), newId()
│           └── schema.test.ts # 13 integration tests
├── docker-compose.yml        # Postgres 16 dev + test containers
├── vitest.config.ts          # Vitest config (global setup, sequential)
├── tsconfig.json             # Strict TypeScript (ES2022, NodeNext)
└── eslint.config.mjs         # ESLint v9 flat config + prettier
```

---

## Entity-relationship overview

> All entities from `arete-spec.md §8`. Full field definitions: [`prisma/schema.prisma`](./prisma/schema.prisma).

```
User
 ├── Credential[]          (encrypted tokens — auth + calendar)
 ├── TrainingPlan[]
 │    └── Session[]
 │         └── CalendarEvent? (1-1, links to external calendar)
 │         └── Route?          (optional planned route)
 ├── Route[]               (personal GPS route library)
 ├── Milestone[]           (achievements: PBs, streaks, challenge completions)
 ├── Challenge[]           (optional mini-challenges proposed by the app)
 └── InjuryReport[]        (injury/illness log driving plan adaptation)
```

**Key design notes:**

- **Primary keys** — UUID v7 (client-generatable, time-ordered). Use `newId()` from `src/db/client.ts`.
- **SI canonical units** — distances in **metres**, durations in **seconds**, pace in **seconds/km**. Convert to metric/imperial at the display layer only.
- **Secrets** — `auth_tokens` and `calendar_token` are stored as encrypted `Bytes` in `Credential`, never in plain columns on `User`.
- **Race goals** — `User.goalEvent` / `User.goalDate`. `Milestone` is an *achievement marker* (PBs, streaks, challenge completions), not a race target.
- **Offline support** — UUID v7 ids can be generated client-side. `updatedAt` timestamps support last-write reconciliation when offline records sync.

---

## npm scripts

| Script | Description |
|---|---|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | ESLint |
| `npm run format` | Check formatting (Prettier) |
| `npm run format:write` | Auto-fix formatting |
| `npm test` | Run integration tests (Vitest) |
| `npm run db:up` | Start Postgres containers (Docker Compose) |
| `npm run db:down` | Stop Postgres containers |
| `npm run migrate` | Apply pending migrations to dev DB |
| `npm run seed` | Seed dev DB with representative data |

---

## What's next

| Phase | Feature |
|---|---|
| Phase 2 — Plan Engine | AI plan generation, session scheduling, plan adaptation |
| Phase 3 — GPS & Routes | Route generation, live GPS tracking, turn-by-turn |
| Phase 4 — Calendar Sync | Google/Apple Calendar integration, conflict detection |
| Phase 5 — Motivation | Rolling goals, streaks, mini-challenges, progress visibility |
| Phase 6 — Injury Handling | Plan restructuring, cross-training, goal-risk detection |
