#!/usr/bin/env bash
# Fail if .env.e2e.local is tracked (must stay gitignored).
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

echo "OK: .env.e2e.local is not tracked."
