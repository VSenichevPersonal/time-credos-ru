# Runbook — Накат app на dev-сервер (deploy/sync)

**Триггер:** arch дал `[arch-ok]` на батч (schema-change / новые объекты-поля / logic-функции) и запушил в main.

## Шаги

1. **Pull актуального кода**
   ```bash
   git pull origin main
   ```
2. **Загрузить окружение**
   ```bash
   set -a; source .env; set +a
   ```
3. **Dry-run (обязательно первым)** — typecheck + diff, ничего не применяет:
   ```bash
   ./infra/scripts/sync.sh --dry-run
   # либо вручную: cd apps/time && yarn twenty dev --once --dry-run
   ```
   - Видишь `No metadata changes` → сервер уже в синхроне, накат не нужен.
   - Видишь diff (added/updated/removed) → проверь, что соответствует ожиданию батча.
   - Typecheck упал → **стоп**, `[blocker]` в SIGNALS, эскалация arch (это не задача DevOps — фиксит автор).
4. **Apply** — накат на dev-сервер:
   ```bash
   ./infra/scripts/sync.sh        # dry-run → подтверждение → apply
   # либо: cd apps/time && yarn twenty dev --once
   ```
5. **Проверка** — health + что объекты накатились:
   ```bash
   ./infra/scripts/health.sh
   ```
6. **Рапорт** в SIGNALS, секция DevOps:
   ```
   [synced] <commit-hash> — накатано: <что>. health 200.
   ```
7. **Дёрнуть QA** на smoke по затронутым объектам/вью → ждём `[qa-ok]`.

## Грабли (PLAYBOOK §9)
- `Entity does not have permission` → API-ключ не админский. Взять админ-ключ.
- `App is not installed` на dry-run → сперва `yarn twenty dev --once` (регистрирует app).
- SELECT reject → значения опций должны быть UPPER_SNAKE (ярлыки русские, коды латиница).
- Изменение **опубликованного `universalIdentifier`** → это НЕ обычный sync, а миграция данных. `[blocker]` → arch.

## Откат
Если накат сломал схему/данные — см. [rollback.md](rollback.md).
</content>
