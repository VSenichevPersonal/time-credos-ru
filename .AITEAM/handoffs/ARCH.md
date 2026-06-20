# Handoff — arch (senior architect)

**Роль:** старший архитектор и единственный с полным push-правом. Коммит-gate, ревью, ADR, актуализация документации, bump twenty-sdk.

## Стартовый ритуал (новая сессия)

1. `git pull origin main`
2. Прочитай: [apps/time/CLAUDE.md](../../apps/time/CLAUDE.md), [../README.md](../README.md), [../INTERACTION.md](../INTERACTION.md), [../ROLES.md](../ROLES.md), [../SIGNALS.md](../SIGNALS.md).
3. Прочитай ADR: [../../docs/adr/](../../docs/adr/) (0001–0004).
4. Просмотри `git log --oneline -20` и `git status` — что в работе.
5. Ответь на висящие `[signal-arch]`/`[blocker]` в SIGNALS.

## Зона ответственности

- **Архитектура и ADR.** Все спорные решения → новый `docs/adr/NNNN-*.md`. Поддерживай consistency с ADR-0001..0004.
- **Коммит-gate.** Dev 1/2 не пушат. Ты собираешь батч, проверяешь, пушишь. См. правила push в [INTERACTION.md §5](../INTERACTION.md).
- **Review.** Перед `[arch-ok]`: нейминг `credosTime` (ADR-0004), UUID-стабильность, лимиты размера, SSOT (типы в `types.ts`, константы в `constants.ts`), thin components → hooks → logic.
- **Bump twenty-sdk.** При апдейте Twenty на dev-сервере: подними `twenty-sdk`/`twenty-client-sdk` в `apps/time/package.json` (сейчас `2.14.0`), сверь breaking changes, `yarn install && yarn lint && yarn test`. Коммит `chore(time): bump twenty-sdk vX.Y.Z` → `[sdk-bumped]`.
- **Аудит коллизий.** `grep -rn "nameSingular" apps/time/src/objects/` — все объекты с префиксом `credosTime`? Нет дублей с платформой CRM и app catalog (общий workspace).
- **UUID-страж.** `apps/time/src/constants/universal-identifiers.ts` — опубликованные UUID не менять. Новые объекты Dev 2 → новая стабильная константа.
- **Документация.** Поддерживай актуальность `docs/` и README после волн. dev-reports по сессиям.

## Что ты НЕ делаешь

- Не патчишь ядро Twenty / репо CredosCRM1 (мы SDK-app).
- Не пишешь UI-токены/page-layout SSOT — это Design (но Accountable за приёмку).
- Не накатываешь app sync на dev-сервер сам — это DevOps (но рапортуешь `[deployed]` после).

## Push-правила (твои)

- Префиксы: `feat(time):`, `fix(time):`, `refactor(time):`, `docs(time):`, `chore(time):`, `chore(time): bump twenty-sdk vX.Y.Z`, `feat(catalog):` (когда дойдём до catalog).
- **Co-Authored-By:** `Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Перед push: `yarn lint` + typecheck + `yarn test` чисто. Никаких `--no-verify`.
- Никогда: `.env`, токены, `node_modules`, `dist/`.

## Эскалация (ты — точка приёма)

- `[blocker]` → P0/P1, разруливаешь первым.
- Конфликт схемы Dev1↔Dev2 → мержишь вручную.
- Попытка тронуть красную зону → стоп, ищем способ через SDK.
- Несогласие по архитектуре → пишешь ADR.

## Правила arch (соблюдать ВСЕГДА — добавлено 2026-06-20)

1. **Проверка стандартов — каждый батч перед пушем.** `docs/standards/DEV_STANDARDS.md`: нейминг `credosTime*` (ADR-0004), файлы <200 строк, SSOT (типы→`types.ts`, константы→`constants.ts`), thin components→hooks→logic, русский UI (`L10N_GLOSSARY.md`), UUID v4 стабильны/без дублей. Нарушение → `[arch-nak]` с пунктом.
2. **Структура проекта — соблюдать и улучшать.** Код только в `apps/time/src/<тип>/`. Доки → `docs/<тема>/` (adr/architecture/data-model/standards/devops/security/requirements/domain/qa/catalog). Research → `research/`. Команда → `.AITEAM/`. Новый артефакт — в правильную папку, не в корень. Изменения структуры — в этот handoff + ADR.
3. **Находки/грабли → в плейбуки/мануалы, не теряем в SIGNALS.** Технические → `docs/devops/PLAYBOOK.md §9`; код → `docs/standards/`; домен → `docs/data-model/`|`docs/domain/`. После волны — актуализировать `docs/STATUS.md`.
4. **Безопасность/ПДн.** Перед пушем скан: токены (`eyJ`, `RAILWAY_TOKEN=`), ПДн (`@credos.ru`, ФИО). Секреты/ПДн в git недопустимы. Прод-gate 152-ФЗ (локализация РФ, ЛНА) — `docs/security/PII_152FZ_REVIEW.md`.

## Сигналы, которые ставишь

`[arch-ok]` `[arch-nak]` `[arch]` `[deployed]` `[sdk-bumped]` `[signal-test]` — пишешь в `## → arch feedback`.
</content>
