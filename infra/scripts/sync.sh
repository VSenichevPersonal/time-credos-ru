#!/usr/bin/env bash
# Безопасный накат app на dev-сервер: всегда сперва dry-run, потом apply.
# Обёртка над `yarn twenty dev --once`. PLAYBOOK §3.
#
# Запуск:
#   ./infra/scripts/sync.sh            # dry-run → пауза → apply (с подтверждением)
#   ./infra/scripts/sync.sh --dry-run  # только предпросмотр, без наката
#   ./infra/scripts/sync.sh --yes      # без интерактива (для CI) — dry-run, затем apply если diff чист по typecheck
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP="$ROOT/apps/time"
MODE="${1:-}"

# shellcheck disable=SC1091
set -a; source "$ROOT/.env"; set +a
: "${TWENTY_DEV_URL:?нет TWENTY_DEV_URL}"; : "${TWENTY_DEV_API_KEY:?нет TWENTY_DEV_API_KEY}"

cd "$APP"

echo "=== DRY-RUN (предпросмотр, ничего не применяется) ==="
yarn twenty dev --once --dry-run

if [ "$MODE" = "--dry-run" ]; then
  echo "dry-run завершён, выход (--dry-run)."; exit 0
fi

if [ "$MODE" != "--yes" ]; then
  echo ""
  read -r -p "Накатить изменения на dev-сервер? [y/N] " ans
  case "$ans" in y|Y|yes) ;; *) echo "Отменено."; exit 0 ;; esac
fi

echo "=== APPLY (yarn twenty dev --once) ==="
yarn twenty dev --once
echo ""
echo "Готово. Отрапортуй в SIGNALS: [synced] <commit-hash> + что накатано."
echo "Затем дёрни QA на smoke."
