#!/usr/bin/env bash
# beforeShellExecution: block destructive scripts on main, or unconfirmed prod env switches.
set -euo pipefail

input="$(cat || true)"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

command="$(INPUT_JSON="$input" python3 -c '
import json, os
raw = os.environ.get("INPUT_JSON") or ""
try:
    data = json.loads(raw or "{}")
except Exception:
    data = {}
print(data.get("command") or data.get("command_string") or "")
')"

cwd="$(INPUT_JSON="$input" python3 -c '
import json, os
raw = os.environ.get("INPUT_JSON") or ""
try:
    data = json.loads(raw or "{}")
except Exception:
    data = {}
print(data.get("cwd") or data.get("working_directory") or "")
')"

resolve_branch() {
  local start="$1"
  local dir="$start"
  while [ -n "$dir" ] && [ "$dir" != "/" ]; do
    if [ -d "$dir/.git" ]; then
      git -C "$dir" rev-parse --abbrev-ref HEAD 2>/dev/null || true
      return
    fi
    dir="$(dirname "$dir")"
  done
  git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || true
}

branch="$(resolve_branch "${cwd:-$ROOT}")"

is_main=false
if [ "$branch" = "main" ] || [ "$branch" = "master" ]; then
  is_main=true
fi

is_destructive=false
is_prod_env_switch=false

if echo "$command" | grep -Eq '(^|[[:space:];|&])(npm|pnpm|yarn)[[:space:]]+run[[:space:]]+(seed:e2e|purge:e2e|reset:e2e|setup:e2e-fixtures|test:e2e|test:e2e:ui|test:e2e:headed|payment:test|smoke:test|prisma:migrate:reset|delete-user|env:prod|env:api:prod|dev:prod|build:prod:mac|build:prod:win|build:prod:linux)\b'; then
  is_destructive=true
fi
if echo "$command" | grep -Eq 'prisma[[:space:]]+migrate[[:space:]]+reset'; then
  is_destructive=true
fi
if echo "$command" | grep -Eq 'delete-user-by-email'; then
  is_destructive=true
fi
if echo "$command" | grep -Eq '(env:prod|env:api:prod|dev:prod|build:prod:(mac|win|linux))\b'; then
  is_prod_env_switch=true
  is_destructive=true
fi

deny_json() {
  local user_msg="$1"
  local agent_msg="$2"
  INPUT_USER="$user_msg" INPUT_AGENT="$agent_msg" python3 -c 'import json,os; print(json.dumps({"permission":"deny","user_message":os.environ["INPUT_USER"],"agent_message":os.environ["INPUT_AGENT"]}))'
}

if [ "$is_destructive" = true ]; then
  if [ "$is_prod_env_switch" = true ]; then
    if echo "$command" | grep -Eq -- '--i-know-what-im-doing' && echo "$command" | grep -Eq 'CONFIRM_PROD_ENV=PRODUCTION'; then
      echo '{"permission":"allow"}'
      exit 0
    fi
    deny_json \
      "Blocked: switching to production env requires an explicit confirm flag." \
      "Refuse env:prod / env:api:prod / build:prod:* / dev:prod unless the command includes --i-know-what-im-doing and CONFIRM_PROD_ENV=PRODUCTION."
    exit 0
  fi

  if [ "$is_main" = true ]; then
    if echo "$command" | grep -Eq 'ALLOW_DESTRUCTIVE_ON_MAIN=1'; then
      echo '{"permission":"allow"}'
      exit 0
    fi
    deny_json \
      "Blocked: destructive/e2e command on git main. Switch to the dev branch first." \
      "Repository is on main/master. Do not run seed/purge/e2e/reset/migrate-reset/delete-user. Ask the user to git checkout dev."
    exit 0
  fi
fi

echo '{"permission":"allow"}'
exit 0
