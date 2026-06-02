# Billing E2E tests (Playwright)

End-to-end tests for Apex Pro billing: Stripe checkout, customer portal redirect, and RevenueCat webhooks.

## Prerequisites

1. **Database** migrated and running (`cd apex && npm run db:up` if using Docker).
2. **Backend** env ([`apex/.env`](../apex/.env)) with sandbox billing configured:
   - `BILLING_MODE=sandbox`
   - `REVENUECAT_PUBLIC_API_KEY_SANDBOX`, `REVENUECAT_SECRET_API_KEY_SANDBOX`
   - `REVENUECAT_WEBHOOK_SECRET`
   - `STRIPE_SECRET_KEY_SANDBOX`
   - `STRIPE_BILLING_PORTAL_RETURN_URL=http://localhost:8080/settings`
   - `ADMIN_SECRET` (optional; enables dev entitlement setup in webhook tests)
3. **Test users** in sandbox (verified email, known passwords).
4. Optional API smoke: `cd apex && npm run payment:test`

## Setup

```bash
cd apex-frontend
pnpm install
pnpm exec playwright install chromium   # once per machine

cp .env.e2e.example .env.e2e.local
# Set E2E_USER_PASSWORD in .env.e2e.local only (never commit that file)
```

`.env.e2e.local` is gitignored (`.env.e2e.local` + `*.local`). Use these sandbox roles:

| Variable | Account | Role |
|----------|---------|------|
| `E2E_CHECKOUT_USER_EMAIL` | `hello.worlda1220@gmail.com` | Free / new user — monthly checkout test |
| `E2E_PRO_USER_EMAIL` | `iamrohanilyas863@gmail.com` | Admin with Pro — portal test |

Webhook secret can live in `apex/.env` only; Playwright loads both files.

## Run tests

With servers already running (`apex` on `:10000`, frontend on `:8080`):

```bash
pnpm test:e2e
```

Playwright can also start both servers automatically (disabled reuse when `CI=true`):

```bash
pnpm test:e2e:headed    # debug Stripe UI
pnpm test:e2e:ui        # interactive runner
pnpm typecheck:e2e      # strict TS for tests/
```

## Test suites (`tests/billing.spec.ts`)

| Suite | User | What it verifies |
|-------|------|------------------|
| Checkout | `E2E_CHECKOUT_USER_EMAIL` | Monthly subscribe → Stripe test card → Pro UI + `hasPro` |
| Portal | `E2E_PRO_USER_EMAIL` | `POST /api/billing/portal` → `billing.stripe.com` |
| Webhook | API only | Auth rejection, TEST event, EXPIRATION (free user), EXPIRATION (active sub stays Pro), CANCELLATION |

**Notes**

- Checkout user must **not** already have Pro (or the test skips).
- Portal user must have **active Pro** and preferably a Stripe customer id (otherwise portal may 409).
- Webhook `EXPIRATION` always re-syncs from RevenueCat. If the user still has an active sandbox subscription, `hasPro` stays `true` (covered by a dedicated test). To test revoke-to-free, use a user with no Pro in RC or set `E2E_WEBHOOK_USER_EMAIL`.
- Stripe checkout UX can flake; re-run with `--headed` or inspect `playwright-report/`.

## CI

Set `CI=true` and provide secrets:

- `E2E_USER_PASSWORD`
- `E2E_CHECKOUT_USER_EMAIL`, `E2E_PRO_USER_EMAIL`
- Billing keys via `apex/.env` or CI env
- Install browsers: `pnpm exec playwright install chromium --with-deps`

Artifacts: `playwright-report/`, `test-results/` (gitignored).
