# E2E local setup

One-time bootstrap for Playwright suites (personas, fixtures, browsers).

## Quick start

```bash
# From repo root
chmod +x scripts/e2e-bootstrap.sh
E2E_USER_PASSWORD='YourSecureTestPassword9!' ./scripts/e2e-bootstrap.sh
```

Or step by step:

```bash
# 1. Backend env (DATABASE_URL, JWT_SECRET, SECRET_PEPPER, R2, billing keys)
cp apex/.env.example apex/.env   # if needed

# 2. Database: migrations + catalog only (no default users)
cd apex && npm run prisma:migrate:deploy   # or migrate reset --force on fresh DB

# 3. Playwright env
cp apex-frontend/.env.e2e.example apex-frontend/.env.e2e.local
# Set E2E_USER_PASSWORD in .env.e2e.local

# 4. Seed 12 personas + active challenge
cd apex && E2E_SEED_PASSWORD="$E2E_USER_PASSWORD" npm run seed:e2e

# 5. Link IBT fixtures (requires repo-root .ibt-files/)
cd apex && npm run setup:e2e-fixtures

# 6. Playwright
cd apex-frontend && pnpm exec playwright install chromium
```

## Personas (Strategy D)

All `@example.com` users are **email-verified** in the database except `e2e-unverified@example.com`, which has known code `12345678`.

| Key | Default email | Notes |
|-----|---------------|-------|
| admin | e2e-admin@example.com | ADMIN + seeded PRO |
| checkoutSeed | e2e-checkout@example.com | Free (non-billing) |
| proSeed | e2e-pro@example.com | Seeded PRO subscription row |
| webhookFree | e2e-webhook-free@example.com | Webhook revoke tests |
| standard | e2e-standard@example.com | Sessions, settings |
| socialA / socialB | e2e-social-a/b@example.com | B already follows A |
| private | e2e-private@example.com | privateProfile + manual approval |
| sacrificial | e2e-sacrificial@example.com | Account delete tests |
| suspended | e2e-suspended@example.com | Login blocked |
| unverified | e2e-unverified@example.com | Code `12345678` |
| challenge | e2e-challenge@example.com | Joined E2E challenge |

**Billing suites** still use `E2E_CHECKOUT_USER_EMAIL` / `E2E_PRO_USER_EMAIL` (real sandbox Gmail accounts).

## Email bypass

- **Primary:** pre-verified seed users (`loginViaApi` / `loginPersona`).
- **Signup verify:** `assignKnownVerificationCode(email)` in `tests/helpers/email-bypass.ts` (runs `apex/scripts/e2e/assign-verification-code.ts`).
- **Unverified persona:** `unverifiedPersonaCredentials()`.

## Fixtures

| Path | Purpose |
|------|---------|
| `apex/tests/fixtures/ibt/*.ibt` | Symlinks to `.ibt-files/` (gitignored) |
| `apex/tests/fixtures/sessions/*.json` | Race/qualify/warmup JSON uploads |
| `apex/tests/fixtures/avatar-e2e.png` | Profile avatar upload |
| `apex-frontend/tests/helpers/fixtures.ts` | Path resolvers for Playwright |

## Run tests

```bash
cd apex && npm run dev          # :10000
cd apex-frontend && pnpm dev    # :8080
cd apex-frontend && pnpm test:e2e
```

## Reset E2E data (without full DB reset)

Playwright creates sessions, discussions, follows, etc. Two cleanup commands target **only** E2E personas (`e2e-*@example.com` and optional billing sandbox emails). They never touch catalog tracks/cars or non-E2E users.

```bash
cd apex
set -a && source ../apex-frontend/.env.e2e.local && set +a
E2E_SEED_PASSWORD="$E2E_USER_PASSWORD" npm run reset:e2e   # keep users, wipe test data, re-seed
# or
npm run purge:e2e                                        # delete E2E users + all related rows (no re-seed)
# or, to purge then recreate personas:
E2E_SEED_PASSWORD="$E2E_USER_PASSWORD" npm run purge:e2e -- --reseed
```

| Command | What it does |
|---------|----------------|
| **`reset:e2e`** | Deletes sessions, follows, discussions, challenge entries, etc. for E2E users. **Keeps** the user rows. Re-runs `seed:e2e` to restore baseline. |
| **`purge:e2e`** | Deletes the E2E challenge, then **removes E2E user rows** (cascades sessions, laps, subscriptions, participants, follows, …). **Does not** re-seed unless you pass `--reseed`. |

Shared options:

- `--dry-run` — show row counts, change nothing
- `--include-billing` — also target Gmail sandbox users (`E2E_CHECKOUT_USER_EMAIL`, `E2E_PRO_USER_EMAIL`)

`reset:e2e` only:

- `--skip-reseed` — delete test data without running `seed:e2e`

`purge:e2e` only:

- `--reseed` — run `seed:e2e` after purge (recreates 12 personas + challenge)
- `--skip-anonymized-deletes` — keep soft-deleted placeholder users (`deleted_*@deleted.local` from account-deletion tests)

This is faster than `prisma migrate reset` when you only need a clean slate for the next E2E run.

See also [E2E_BILLING.md](./E2E_BILLING.md).
