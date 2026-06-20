#!/usr/bin/env bash
# Прозвон здоровья dev-сервера Twenty (Railway «Twenty Credos Time»).
# Кодифицирует PLAYBOOK §6. Read-only, ничего не меняет.
#
# Запуск:
#   ./infra/scripts/health.sh          # человекочитаемо
#   ./infra/scripts/health.sh --quiet  # только итог OK/FAIL + код возврата
#
# Требует .env (gitignored) в корне: TWENTY_DEV_URL, TWENTY_DEV_API_KEY.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
QUIET="${1:-}"

# shellcheck disable=SC1091
set -a; source "$ROOT/.env"; set +a

URL="${TWENTY_DEV_URL:?нет TWENTY_DEV_URL в .env}"
KEY="${TWENTY_DEV_API_KEY:?нет TWENTY_DEV_API_KEY в .env}"

fail=0
probe() { # name url [auth]
  local name="$1" path="$2" auth="${3:-}"
  local code
  if [ -n "$auth" ]; then
    code=$(curl -s -m 15 -o /dev/null -w '%{http_code}' "$URL$path" -H "authorization: Bearer $KEY" || echo 000)
  else
    code=$(curl -s -m 15 -o /dev/null -w '%{http_code}' "$URL$path" || echo 000)
  fi
  if [ "$code" = "200" ]; then
    [ "$QUIET" = "--quiet" ] || printf '  ✓ %-28s %s\n' "$name" "$code"
  else
    [ "$QUIET" = "--quiet" ] || printf '  ✗ %-28s %s\n' "$name" "$code"
    fail=1
  fi
}

[ "$QUIET" = "--quiet" ] || echo "Health: $URL"
probe "/healthz"                 "/healthz"
probe "/rest/metadata/objects"   "/rest/metadata/objects" auth
probe "/graphql"                 "/graphql"

# MCP — POST tools/list
mcp=$(curl -s -m 15 -o /dev/null -w '%{http_code}' -X POST "$URL/mcp" \
  -H "authorization: Bearer $KEY" \
  -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' || echo 000)
if [ "$mcp" = "200" ]; then
  [ "$QUIET" = "--quiet" ] || printf '  ✓ %-28s %s\n' "/mcp (tools/list)" "$mcp"
else
  [ "$QUIET" = "--quiet" ] || printf '  ✗ %-28s %s\n' "/mcp (tools/list)" "$mcp"
  fail=1
fi

if [ "$fail" = "0" ]; then
  echo "OK"
else
  echo "FAIL"
fi
exit "$fail"
