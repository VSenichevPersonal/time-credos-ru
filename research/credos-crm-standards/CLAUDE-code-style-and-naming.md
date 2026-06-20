## Стиль кода (Twenty + наши правила)
- TypeScript strict, без `any`
- Только functional components, без class components
- Только named exports, без default exports
- Types вместо interfaces (кроме расширения сторонних)
- String literals вместо enum (кроме GraphQL)
- Без сокращений: `user` а не `u`, `fieldMetadata` а не `fm`
- Короткие комментарии `//`, не JSDoc-блоки (объясняем ЗАЧЕМ, не ЧТО)
- Файлы: компоненты <150 строк, сервисы <200 строк, хуки <100 строк
- Thin components (рендер) → hooks (оркестрация) → services (логика)
- SSOT: типы в `types.ts`, константы в `constants.ts`
- Переиспользование: Twenty UI → shadcn/ui → кастом (последний вариант)
- i18n через Lingui, строки НЕ хардкодить
- Тесты рядом с файлом: `module.ts` + `module.test.ts`

## Git
- Conventional commits: `feat(credos):`, `fix(credos):`, `chore:`
- Ветки: `feature/credos-<модуль>-<описание>`, `fix/credos-<описание>`
- Слияние upstream: `merge: upstream twenty vX.Y.Z`

## Язык
- Документация, общение, описания PR: **русский**
- Код, коммиты, комментарии в коде: **английский**
- UI-строки: русский через i18n (Lingui)

## Ключевые файлы

### Обязательно к прочтению перед доработкой
- `credos/docs/CUSTOMIZATION_GUIDE.md` — **КАК** кастомизировать: префиксы, зоны безопасности, паттерны кода
- `credos/docs/CODEBASE_MAP.md` — **ГДЕ** что лежит: навигация по задачам, ключевые пути
- `credos/docs/CREDOS_MODULES.md` — **ЧТО** мы строим: реестр модулей, статусы, custom objects
- `credos/docs/lead-parser/PARSING_PATTERNS.md` — **ЕСЛИ ТРОГАЕШЬ ПАРСЕР ЛИДОВ** журнал багов + правила: HTML labels с `:`, COALESCE+NULLIF, BlockNote, multipart, decodeEntities. Дополняй после каждого пойманного edge case.

### Стандарты и архитектура
- `DEVELOPMENT_STANDARDS.md` — Полные стандарты разработки (gold/silver/bronze)
- `ARCHITECTURE.md` — Архитектура, деплой Railway, фазы разработки
- `CRM_REQUIREMENTS.md` — Требования и результаты исследования CRM
- `.cursorrules` — Правила для Cursor AI

### Справочники Twenty CRM
- `credos/docs/INDEX.md` — Каталог всей документации (3500+ строк)
- `credos/docs/twenty-reference/extensibility-guide.md` — API, custom objects, webhooks, Apps SDK
- `credos/docs/core-changes.md` — Журнал изменений ядра (обязательно обновлять!)

## Рабочий процесс
1. **Исследовать** — прочитать существующий код, понять паттерны Twenty
2. **Спланировать** — обсудить подход перед реализацией
3. **Кодить** — одно изменение за раз, инкрементально
4. **Проверить** — `npx nx typecheck && npx nx test --related`
5. **Документировать** — dev-report + обновить CREDOS_MODULES.md (см. ниже)

## Документирование сессий (ОБЯЗАТЕЛЬНО)

Каждая сессия, в которой добавляются поля, интеграции, модули или значимые изменения,
ОБЯЗАНА завершаться документированием:

1. **Dev Report** — файл `credos/docs/dev-reports/NNN-YYYY-MM-DD-описание.md`
   - Номер (NNN) — инкрементальный (001, 002, 003...)
   - Содержание: цель, что сделано, файлы, API, тестирование, ограничения
2. **CREDOS_MODULES.md** — обновить статус модуля, добавить файлы и чеклист
3. **core-changes.md** — если менялись файлы ядра Twenty (жёлтая/красная зона)

Шаблон dev-report: `credos/docs/dev-reports/001-2026-03-14-dadata-integration.md`

## Правила кастомизации (критично!)

### Префиксы — ОБЯЗАТЕЛЬНО
- Custom Objects: `credosTender`, `credosProject` (camelCase с `credos`)
- Custom Fields на стандартных объектах: `credosInn`, `credosContractNumber`
- DB таблицы (code-level): `credos_pipeline_stage` (snake_case с `credos_`)
- i18n ключи: `credos.tenders.statusWon`
- Env переменные: `CREDOS_EXCHANGE_CLIENT_ID`

### Зоны безопасности
- **Зелёная** (свободно): `*/credos/`, `credos-integrations/`, `credos/docs/`
- **Жёлтая** (осторожно, документировать в core-changes.md): `modules.module.ts`, routes, `.env.example`
- **Красная** (НЕ ТРОГАТЬ): `engine/`, `twenty-orm/`, `workspace-schema-builder/`, `auth/`

### Маркеры правок ядра (ОБЯЗАТЕЛЬНО для жёлтой зоны)
Любая правка в файлах ядра Twenty должна быть обёрнута маркером `CREDOS`,
чтобы все кастомные патчи было легко найти перед merge upstream.

- Однострочный: `// CREDOS: <зачем>` — в конце изменённой строки
- Блочный:
  ```
  // CREDOS-BEGIN: <зачем>
  <код>
  // CREDOS-END
  ```
- `<зачем>` — краткое ЗАЧЕМ, не ЧТО. Пример: `// CREDOS: тумблер режима sidePanel/fullPage`
- Каждый маркер — отдельная запись в `credos/docs/core-changes.md`
- Аудит перед merge upstream: `grep -rn "CREDOS:" packages/ | grep -v credos/`
- Логика — в `credos/` namespace; в файле ядра только 1–3 строки вызова нашего кода

### Приоритет подхода
1. Metadata API (custom objects/fields через UI) — 0 кода
2. Workflows (автоматизация через визуальный редактор) — 0 кода
