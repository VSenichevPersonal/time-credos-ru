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

# Секрет-паттерны (scope=secret): блок ВЕЗДЕ (кроме allowlist).
# ПДн-паттерн (scope=pii): блок только в коде apps/** и infra/**.
# В research/**, docs/**, .AITEAM/** ПДн — политика CISO (см. runbooks/secrets-pii.md),
# скан туда не лезет, чтобы не блокировать pre-existing источники-интел.
PATTERNS=(
  "secret|JWT/playground-токен|eyJhbGciOiJ[A-Za-z0-9._-]{20,}"
  "secret|RAILWAY_TOKEN со значением|RAILWAY_TOKEN=[A-Za-z0-9]"
  "secret|Bearer-ключ в коде|Bearer [A-Za-z0-9._-]{20,}"
  "pii|реальный email @credos.ru (ПДн)|[A-Za-z0-9._%+-]+@credos\\.ru"
)

# ПДн-скан только для кода (не для интел-источников/доков/канала).
pii_in_scope() { case "$1" in apps/*|infra/*) return 0 ;; *) return 1 ;; esac; }

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
    apps/time/vitest.config.ts) return 0 ;;         # демо-JWT тест-фикстуры workspace 20202020 (подтв. arch 00:20 #9, не живой секрет)
    *) return 1 ;;
  esac
}

violations=0
for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue
  is_allowed "$f" && continue
  for p in "${PATTERNS[@]}"; do
    scope="${p%%|*}"; rest="${p#*|}"; name="${rest%%|*}"; rx="${rest#*|}"
    # ПДн-паттерн — только в коде apps/** infra/**
    if [ "$scope" = "pii" ] && ! pii_in_scope "$f"; then continue; fi
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
