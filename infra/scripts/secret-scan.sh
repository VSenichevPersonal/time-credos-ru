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

# Файлы под скан (portable: bash 3.2 на macOS не имеет mapfile)
FILES=()
while IFS= read -r line; do
  [ -n "$line" ] && FILES+=("$line")
done < <(
  if [ "$MODE" = "--all" ]; then git ls-files; else git diff --cached --name-only --diff-filter=ACM; fi
)

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
      hits=$(grep -cEI "$rx" "$f" 2>/dev/null || echo "?")
      echo "✗ [$name] в $f ($hits совпад.):"
      # обрезка строк (однострочные JSON-дампы бывают мегабайтными)
      grep -nEoI "$rx" "$f" | head -3 | cut -c1-120 | sed 's/^/    …/'
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
