# E2E local setup

Playwright suites for the Apex web app. All backend commands below run from **`apex`** (the backend package at repo root) unless noted.

## What lives in the database

| Layer | Created by | Contents |
|-------|------------|----------|
| **Catalog** | `npx prisma db seed` (auto after `migrate reset`) | `CatalogTrack` / `CatalogCar` only — **no users** |
| **E2E personas** | `npm run seed:e2e` | 12 `@example.com` users + active challenge |
| **Billing sandbox** | Manual signup in the app | Real Gmail accounts from `.env.e2e.local` — **not** re-created by seed scripts |
| **Test artifacts** | `pnpm test:e2e` | Sessions, laps, follows, discussions, etc. |

`prisma db seed` no longer creates `admin@example.com` or `seed@example.com`. Use `seed:e2e` for test users. If your DB still has those legacy rows from an older seed, run `prisma:migrate:reset` once to clear them.

---

## Prerequisites

1. **Backend env** — `apex/.env` with `DATABASE_URL`, `SECRET_PEPPER`, `JWT_SECRET`, and billing/R2 keys as needed.
2. **Playwright env** — `apex-frontend/.env.e2e.local` (gitignored), copied from `.env.e2e.example`.
3. Set **`E2E_USER_PASSWORD`** in `.env.e2e.local` (min 8 chars). All seeded personas share this password.

Load E2E env when running backend seed/cleanup scripts:

```bash
cd apex
set -a && source ../apex-frontend/.env.e2e.local && set +a
export E2E_SEED_PASSWORD="$E2E_USER_PASSWORD"
```

---

## First-time bootstrap

### Option A — bootstrap script (from repo root)

```bash
chmod +x scripts/e2e-bootstrap.sh
E2E_USER_PASSWORD='YourSecureTestPassword9!' ./scripts/e2e-bootstrap.sh
```

Runs `seed:e2e`, links IBT fixtures, installs Playwright Chromium. Does **not** run migrations — ensure the DB is migrated first.

### Option B — step by step

```bash
# 1. Backend env
cp apex/.env.example apex/.env   # configure DATABASE_URL, secrets, etc.

# 2. Database: wipe + migrations + catalog (no users)
cd apex
npm run prisma:migrate:reset -- --force

# 3. Playwright env
cp apex-frontend/.env.e2e.example apex-frontend/.env.e2e.local
# Edit E2E_USER_PASSWORD in .env.e2e.local

# 4. E2E personas (12 users + challenge)
set -a && source ../apex-frontend/.env.e2e.local && set +a
E2E_SEED_PASSWORD="$E2E_USER_PASSWORD" npm run seed:e2e

# 5. IBT fixture symlinks (requires repo-root .ibt-files/)
npm run setup:e2e-fixtures

# 6. Playwright browser
cd ../apex-frontend && pnpm exec playwright install chromium
```

On an existing DB (no wipe), use `npm run prisma:migrate:deploy` instead of `migrate reset`.

---

## Seeding commands

All run from `apex`.

| Command | Creates | When to use |
|---------|---------|-------------|
| `npm run prisma:migrate:reset -- --force` | Drops DB → migrations → **catalog only** | Full dev wipe (destroys all data) |
| `npx prisma db seed` | Catalog tracks/cars only | After deploy, or to refresh catalog |
| `npm run seed:catalog` | Same as `prisma db seed` | Standalone catalog refresh |
| `E2E_SEED_PASSWORD='…' npm run seed:e2e` | 12 personas + E2E challenge + catalog upsert | Before first E2E run, or after `purge:e2e` |

`seed:e2e` requires `E2E_SEED_PASSWORD` or `E2E_USER_PASSWORD` and `SECRET_PEPPER` in `apex/.env`.

**Typical fresh DB:**

```bash
npm run prisma:migrate:reset -- --force
set -a && source ../apex-frontend/.env.e2e.local && set +a
E2E_SEED_PASSWORD="$E2E_USER_PASSWORD" npm run seed:e2e
```

---

## Run tests

```bash
# Terminal 1 — API (:10000)
cd apex && npm run dev

# Terminal 2 — SPA (:8080)
cd apex-frontend && pnpm dev

# Terminal 3 — Playwright
cd apex-frontend && pnpm test:e2e
```

Billing checkout/portal tests need sandbox Gmail users registered in the app after a DB reset — see [E2E_BILLING.md](./E2E_BILLING.md).

---

## Cleanup after E2E runs

Playwright leaves sessions, follows, discussions, leaderboard entries, and sometimes **dynamic users** (e.g. `e2e-signup-*@example.com` from signup tests). Two targeted cleanup commands remove **only E2E-scoped data**:

- **12 seeded personas** (`e2e-admin@example.com`, …) and env overrides
- **Any `e2e-*@example.com` user** created during Playwright runs (signup, contact form, etc.)
- **Optionally** billing sandbox Gmail accounts (`--include-billing`)

They also remove email-keyed orphans (`EmailCode`, `PasswordResetCode`, guest `ContactSubmission` rows on `@example.com`). They never touch catalog tracks/cars or unrelated users.

```bash
cd apex
set -a && source ../apex-frontend/.env.e2e.local && set +a
export E2E_SEED_PASSWORD="$E2E_USER_PASSWORD"
```

### `reset:e2e` — wipe test data, keep user rows

Deletes mutable artifacts (sessions, laps, follows, discussions, challenge entries, notifications, auth sessions, weekly goals, …) for **all scoped users** (personas + dynamic `e2e-*@example.com`). **Keeps** all user rows. Removes subscriptions on dynamic users only (personas are restored by re-seed). Re-runs `seed:e2e` by default to restore persona baseline (passwords, challenge, social graph).

```bash
npm run reset:e2e
```

| Flag | Effect |
|------|--------|
| `--dry-run` | Print row counts only |
| `--skip-reseed` | Delete data without running `seed:e2e` |
| `--include-billing` | Also reset Gmail sandbox users from env |

### `purge:e2e` — remove E2E users entirely

Deletes the E2E challenge, then **removes all scoped user rows** — personas and dynamic `e2e-*@example.com` users (cascades sessions, laps, subscriptions, participants, follows, …). Does **not** re-seed unless you ask.

```bash
npm run purge:e2e                              # delete only
npm run purge:e2e -- --reseed                  # delete + recreate personas
```

| Flag | Effect |
|------|--------|
| `--dry-run` | Print row counts only |
| `--reseed` | Run `seed:e2e` after purge |
| `--include-billing` | Also remove Gmail sandbox users |
| `--skip-anonymized-deletes` | Keep `deleted_*@deleted.local` rows (C8 account-deletion test) |

### Full database reset

When you need everything wiped (not just E2E):

```bash
npm run prisma:migrate:reset -- --force
E2E_SEED_PASSWORD="$E2E_USER_PASSWORD" npm run seed:e2e   # if running E2E again
```

### Which cleanup to use?

| Goal | Command |
|------|---------|
| Clean slate before next E2E run (fast) | `reset:e2e` |
| Remove all E2E users from DB (including dynamic signup users) | `purge:e2e` |
| Remove E2E users then recreate personas | `purge:e2e -- --reseed` |
| Wipe entire database + catalog only | `prisma:migrate:reset -- --force` |
| Preview what would be deleted | `reset:e2e -- --dry-run` or `purge:e2e -- --dry-run` |

**Reset vs purge for dynamic users:** `reset:e2e` clears their sessions/subscriptions but keeps the user row; `purge:e2e` deletes the user row entirely.

---

## Personas (Strategy D)

All `@example.com` users are **email-verified** in the database except `e2e-unverified@example.com` (known code `12345678`).

| Key | Default email | Notes |
|-----|---------------|-------|
| admin | e2e-admin@example.com | ADMIN + seeded PRO |
| checkout | e2e-checkout@example.com | Free (non-billing) |
| pro | e2e-pro@example.com | Seeded PRO subscription row |
| webhookFree | e2e-webhook-free@example.com | Webhook revoke tests |
| standard | e2e-standard@example.com | Sessions, settings |
| socialA / socialB | e2e-social-a/b@example.com | B already follows A |
| private | e2e-private@example.com | privateProfile + manual approval |
| sacrificial | e2e-sacrificial@example.com | Account delete tests |
| suspended | e2e-suspended@example.com | Login blocked |
| unverified | e2e-unverified@example.com | Code `12345678` |
| challenge | e2e-challenge@example.com | Joined E2E challenge |

**Billing suites** use `E2E_CHECKOUT_USER_EMAIL` / `E2E_PRO_USER_EMAIL` (real sandbox Gmail) — see [E2E_BILLING.md](./E2E_BILLING.md).

Challenge ID (stable): `e2e-challenge-road-atlanta-gt3` (`E2E_CHALLENGE_ID` in env).

---

## Email bypass

- **Primary:** pre-verified seed users (`loginViaApi` / `loginPersona`).
- **Signup verify:** `assignKnownVerificationCode(email)` in `tests/helpers/email-bypass.ts` (runs `apex/scripts/e2e/assign-verification-code.ts`).
- **Password reset:** `npm run e2e:assign-reset-code -- <email> <code>` in `apex/` (`scripts/e2e/assign-password-reset-code.ts`).
- **Unverified persona:** `unverifiedPersonaCredentials()`.

---

## Fixtures

| Path | Purpose |
|------|---------|
| `apex/tests/fixtures/ibt/*.ibt` | Symlinks to `.ibt-files/` (gitignored) |
| `apex/tests/fixtures/sessions/*.json` | Race/qualify/warmup JSON uploads |
| `apex/tests/fixtures/avatar-e2e.png` | Profile avatar upload |
| `apex-frontend/tests/helpers/fixtures.ts` | Path resolvers for Playwright |

**IBT fixture inspection (dev):** `cd apex && npm run inspect:ibt-fixtures -- <path-to.ibt>`

---

## Smoke test (optional)

API health check against a running server:

```bash
cd apex
SMOKE_EMAIL=e2e-admin@example.com SMOKE_PASSWORD="$E2E_USER_PASSWORD" \
  npm run smoke:test -- --baseUrl=http://127.0.0.1:10000
```

Requires `seed:e2e` (or any valid user credentials) — there is no default `admin@example.com` after catalog-only seed.
