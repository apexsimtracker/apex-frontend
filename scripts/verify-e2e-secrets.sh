#!/usr/bin/env bash
# Fail if .env.e2e.local is tracked, or if branch/API target is unsafe for e2e.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if git ls-files --error-unmatch .env.e2e.local >/dev/null 2>&1; then
  echo "ERROR: .env.e2e.local is tracked by git."
  echo "Remove it from the index (keep the local file):"
  echo "  git rm --cached .env.e2e.local"
  exit 1
fi

if [[ -f .env.e2e.local ]] && grep -qE '^E2E_USER_PASSWORD=.+$' .env.e2e.local; then
  : # local password set — OK for developer machine
fi

# Branch + prod API guard (shared logic with backend)
if [[ -f ../apex/scripts/assert-safe-target.js ]]; then
  node ../apex/scripts/assert-safe-target.js
elif [[ -f scripts/assert-safe-target.cjs ]]; then
  node scripts/assert-safe-target.cjs
elif [[ -f scripts/assert-safe-target.js ]]; then
  node scripts/assert-safe-target.js
else
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  if [[ "$branch" == "main" || "$branch" == "master" ]] && [[ "${ALLOW_DESTRUCTIVE_ON_MAIN:-}" != "1" ]]; then
    echo "ERROR: e2e blocked on git branch '$branch'. Switch to dev."
    exit 1
  fi
  api="$(grep -E '^(VITE_API_URL|VITE_APEX_API_BASE_URL)=' .env .env.local .env.e2e.local 2>/dev/null | tail -1 || true)"
  if echo "$api" | grep -q 'apex-1-y319' && [[ "${ALLOW_PROD_DESTRUCTIVE:-}" != "1" ]]; then
    echo "ERROR: e2e blocked against production API (apex-1-y319)."
    exit 1
  fi
fi

echo "OK: .env.e2e.local is not tracked; target looks safe for e2e."
