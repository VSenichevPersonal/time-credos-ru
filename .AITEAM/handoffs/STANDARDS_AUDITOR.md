# Handoff — standards-auditor (subagent)

**Тип:** subagent, не роль-чат. Реализация: [.claude/agents/standards-auditor.md](../../.claude/agents/standards-auditor.md). Вызывается из чата любой роли (arch / Dev 1 / Dev 2 / QA) перед commit/push или периодически.

## Как вызвать

```
Agent(subagent_type='standards-auditor', prompt='audit working tree')
Agent(subagent_type='standards-auditor', prompt='audit files: apps/time/src/objects/credos-time-entry.object.ts, ...')
```

Работает в изолированном sub-context'е, возвращает caller'у краткий **pass/fail** отчёт. **Не пишет в SIGNALS** — результат интерпретирует caller.

## Что проверяет (по DEV_STANDARDS.md)

1. **Нейминг `credosTime`** (ADR-0004): объекты = `credosTime` + сущность camelCase; файлы kebab-case (`credos-time-*.object.ts`); запрет «Activity»/голого «Project».
2. **UUID-стабильность:** новые объекты/поля имеют константу в `universal-identifiers.ts` (UUID v4); опубликованные UUID не изменены в диффе.
3. **Лимиты размера:** компоненты <150, logic/сервисы <200, хуки <100 строк.
4. **Стиль:** TypeScript strict без `any`; functional components; named exports (кроме SDK-шаблонов с `export default`); types вместо interfaces; без сокращений.
5. **SSOT:** типы в `types.ts`, константы/статусы/ярлыки в `constants.ts` (не хардкод).
6. **SDK-pitfalls:** object без index-view; view без navigationMenuItem; front-component со scroll вместо респонсива.
7. **Локализация:** ярлыки/справочники — русские; коды enum/string-literal — латиница.
8. **Запреты:** `console.*` в продакшн-логике; секреты/токены в коде.

## Формат ответа caller'у

```
PASS / FAIL
- <file:line>: <нарушение> → <как починить>
...
Итог: N нарушений (X критичных, Y нитов)
```

Не предлагает фичи и рефактор вне scope нарушений. Только соответствие стандартам.

## Источник правил

[docs/standards/DEV_STANDARDS.md](../../docs/standards/DEV_STANDARDS.md) + [apps/time/CLAUDE.md](../../apps/time/CLAUDE.md) (pitfalls) + ADR-0004 (нейминг).
</content>
