#!/usr/bin/env bash
# Скан секретов и ПДн перед коммитом. Расширяет PLAYBOOK §10:
#   - JWT/токены (eyJhbG...), RAILWAY_TOKEN=, явные Bearer-ключи;
#   - ПДн сотрудников Кредо-С: реальные корп-email @credos.ru (CISO-001 P1).
#
# Запуск:
#   ./infra/scripts/secret-scan.sh           # скан staged (git diff --cached)
#   ./infra/scripts/secret-scan.sh --all      # скан всего рабочего дерева (tracked)
#
# Код возврата != 0 → найдено нарушение (используется в pre-commit hook).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

MODE="${1:-}"

# Паттерны. Имя|regex. Исключения для example/шаблонов — ниже по allowlist.
PATTERNS=(
  "JWT/playground-токен|eyJhbGciOiJ"
  "RAILWAY_TOKEN присвоен|RAILWAY_TOKEN=[^\"'[:space:]]"
  "Bearer-ключ в коде|Bearer [A-Za-z0-9._-]{20,}"
  "реальный email @credos.ru (ПДн, CISO-001)|[A-Za-z0-9._%+-]+@credos\\.ru"
)

# Файлы под скан
if [ "$MODE" = "--all" ]; then
  mapfile -t FILES < <(git ls-files)
else
  mapfile -t FILES < <(git diff --cached --name-only --diff-filter=ACM)
fi

# Allowlist: документация-приёмы, .env.example (шаблон без значений), сам скан.
is_allowed() {
  case "$1" in
    infra/scripts/secret-scan.sh) return 0 ;;     # сам паттерн-файл
    .env.example) return 0 ;;                       # шаблон, значений нет
    docs/devops/PLAYBOOK.md|docs/devops/runbooks/*) return 0 ;; # примеры-инструкции
    *) return 1 ;;
  esac
}

violations=0
for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue
  is_allowed "$f" && continue
  for p in "${PATTERNS[@]}"; do
    name="${p%%|*}"; rx="${p#*|}"
    if grep -nEI "$rx" "$f" >/dev/null 2>&1; then
      echo "✗ [$name] в $f:"
      grep -nEI "$rx" "$f" | head -5 | sed 's/^/    /'
      violations=$((violations+1))
    fi
  done
done

if [ "$violations" -gt 0 ]; then
  echo ""
  echo "БЛОК: найдено $violations нарушений (секреты/ПДн). Коммит отклонён."
  echo "  • Токены/секреты → только в .env (gitignored)."
  echo "  • Реальные @credos.ru → обезличить (@example.test) или грузить из gitignored-источника в рантайме."
  echo "  • Ложное срабатывание в доке-примере → добавь файл в allowlist скана."
  exit 1
fi
echo "OK — секретов/ПДн не найдено (${#FILES[@]} файлов)."
