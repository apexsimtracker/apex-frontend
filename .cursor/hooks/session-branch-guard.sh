#!/usr/bin/env bash
# sessionStart: warn when this repository is on main/master.
set -euo pipefail

input="$(cat || true)"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PKG="$(basename "$ROOT")"

branch="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"

if [[ "$branch" == "main" || "$branch" == "master" ]]; then
  ctx="MAIN BRANCH GUARD: ${PKG} is on ${branch}. Do not implement tasks until the developer switches to the dev branch (git checkout dev), unless their current message explicitly opts in (e.g. \"work on main\", \"I know I'm on main\")."
  ctx_json=$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$ctx")
  printf '{"additional_context":%s}\n' "$ctx_json"
elif [[ -n "$branch" ]]; then
  ctx="Git branch: ${PKG}=${branch}. Prefer developing on dev; ship via staging then main."
  ctx_json=$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$ctx")
  printf '{"additional_context":%s}\n' "$ctx_json"
else
  echo '{}'
fi
