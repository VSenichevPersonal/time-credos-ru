# Runbook — Откат наката (rollback)

**Триггер:** `yarn twenty dev --once` накатил сломанную схему/код; QA `[qa-nak]`/`[smoke-nak]`; данные/UI поломаны.

> Контекст: мы SDK-app поверх Twenty. «Откат» = вернуть код в рабочее состояние и пере-синкнуть метаданные. Прямого `app:rollback` нет — откатываем через git + повторный sync.

## Быстрый откат (dev-режим, метаданные)

1. **Определить последний рабочий коммит**
   ```bash
   git log --oneline -10
   ```
2. **Откатить код** (вариант А — revert, безопасно для общей ветки):
   ```bash
   git revert <bad-hash>        # или git revert <a>..<b> для диапазона
   ```
   Вариант Б (только локально, до push): `git reset --hard <good-hash>` — **с согласования arch** (INTERACTION §9).
3. **Пере-синк** рабочей схемы на сервер:
   ```bash
   set -a; source .env; set +a
   ./infra/scripts/sync.sh --dry-run    # убедиться, что diff возвращает схему к рабочей
   ./infra/scripts/sync.sh
   ```
4. **Health + smoke**:
   ```bash
   ./infra/scripts/health.sh
   ```
   → дёрнуть QA.
5. **Рапорт**: `[synced] <revert-hash> — откат <bad-hash>, причина: <...>. health 200.`

## Если откат не помог / данные потеряны

- Изменение **опубликованного UUID** удаляет объект+данные при sync. Восстановление: вернуть прежний UUID в `universal-identifiers.ts` (если объект ещё на сервере под старым id — данные целы) → sync. Если объект уже удалён — данные сидим заново:
  ```bash
  node apps/time/scripts/seed-real.mjs --wipe-projects --wipe-entries
  node apps/time/scripts/seed-calendar.mjs
  node apps/time/scripts/check-consistency.mjs
  ```
- БД-уровень: дамп Postgres на Railware (volume `postgres-volume`). Восстановление снапшота — через Railway, согласовать с arch (downtime dev-сервера).

## Прод (позже, CredosCRM1)
Опубликованную версию откатывают установкой предыдущей: `yarn twenty app:install` нужной версии (версии в package.json строго растут, прежние доступны). Детали — когда появится прод-таргет (ADR-0002).
</content>
