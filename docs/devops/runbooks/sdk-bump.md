# Runbook — Bump twenty-sdk

**Триггер:** dev-сервер Twenty обновился (DevOps заметил `V2_X` в логах / Railware redeploy). Текущий локальный SDK: `2.14.0`.

> Это специфика SDK-app (не форк). Делает **arch** (push-право), DevOps готовит вводные и проверяет совместимость.

## Шаги

1. **Зафиксировать версию сервера**
   ```bash
   set -a; source .env; set +a
   RAILWAY_TOKEN="$RAILWAY_TOKEN" railway logs --service Twenty | grep -iE "V2_[0-9]+|version" | head
   ```
2. **Сверить с локальным SDK** (`apps/time/package.json`): `twenty-sdk`, `twenty-client-sdk`, `engines.twenty`.
3. **arch правит версии** → `yarn install` в `apps/time`.
4. **Проверки** (до push):
   ```bash
   cd apps/time
   yarn lint
   yarn twenty dev --once --dry-run   # typecheck на новом SDK + diff
   ```
   - Breaking changes SDK (изменился `define`-API, типы) → фиксит arch/Dev, `yarn test`.
5. **arch коммит**: `chore(time): bump twenty-sdk vX.Y.Z` → push. Сигнал `[sdk-bumped] vX.Y.Z` + ссылка на release Twenty.
6. **DevOps накат**: `./infra/scripts/sync.sh` → health → QA полный smoke.

## Совместимость
- `engines.twenty` (`>=2.14.0`) ↔ версия сервера. Несовпадение → `SERVER_VERSION_INCOMPATIBLE` при publish/install.
- Версия app в `package.json` строго растёт (иначе `VERSION_ALREADY_EXISTS`).
</content>
