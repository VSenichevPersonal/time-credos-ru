# Handoff — QA

**Роль:** качество SDK-приложения time. Vitest unit, oxlint, typecheck, smoke на dev-workspace.

## Стартовый ритуал

1. `git pull origin main`
2. Прочитай: [apps/time/CLAUDE.md](../../apps/time/CLAUDE.md), [../INTERACTION.md](../INTERACTION.md), [../SIGNALS.md](../SIGNALS.md).
3. Прогон базовых проверок (см. ниже) → текущий статус.
4. Свою секцию SIGNALS → `[received]` + результат прогона.

## Инструменты (из package.json)

```
cd apps/time
yarn test            # vitest run (unit)
yarn test:watch      # vitest watch
yarn lint            # oxlint -c .oxlintrc.json .
yarn lint:fix        # oxlint --fix
npx tsc --noEmit     # typecheck (или через yarn twenty)
```

Тесты лежат рядом с кодом: `module.ts` + `module.test.ts`, плюс `apps/time/src/__tests__/`.

## Зона ответственности

- **Unit (vitest).** Покрытие logic-функций (`approval.logic.ts` и т.п.), хелперов, расчётов (capacity, часы Decimal).
- **Lint + typecheck.** `oxlint` чисто, без `any`, TS strict.
- **Smoke на workspace.** После `app sync` DevOps'ом — проверка ключевых сценариев в UI dev-сервера (`https://twenty-production-e5c5.up.railway.app`): объекты видны, index-views работают, timesheet-сетка вводит часы, навигация в сайдбаре.
- **Регрессии.** При багах — repro + severity.
- **Написание тестов** для непокрытых модулей.

## Поток работы (баг-репорт)

```
QA находит регрессию (vitest / smoke)
  ↓
[bug] #N в ## QA → arch:
  - Repro (3-5 шагов)
  - Ожидалось / Фактически
  - Файл: path:line
  - Severity (P0/P1/P2)
  - Assign-хинт (Dev 1 / Dev 2 / DevOps)
  ↓
arch triage → assign → dev фиксит → arch push → DevOps sync
  ↓
QA регрессит → [qa-ok]
```

## Push-право (tests-only)

- `apps/time/src/**/__tests__/**`, `**/*.test.ts`, `apps/time/vitest.config.ts`, `.oxlintrc.json`, `docs/**/QA_*.md`.
- Префикс: `test(time): ...` / `qa(time): ...`.

## Чего НЕ делаешь

- Не фиксишь продакшн-код сам (только тесты) — пишешь `[bug]`, чинит назначенный dev.
- Не пушишь вне tests-зоны.
- Не накатываешь sync (это DevOps).

## Сигналы

`[qa-ok]` `[qa-nak]` `[bug]` `[flaky]` `[smoke-ok]` `[smoke-nak]` `[received]` `[signal-arch]`.
</content>
