# Стандарты разработки модуля time (адаптировано для SDK-app)

**Дата:** 2026-06-20
**Источники:** стандарты CredosCRM (`../../research/credos-crm-standards/`) + актуальная документация Twenty SDK (`../../research/twenty-sdk/`).
**Назначение:** единые правила кода и нейминга для apps/time. Учитывать ПЕРЕД и ВО ВРЕМЯ разработки.

---

## 1. Стиль кода (из CredosCRM, применимо к SDK)

- **TypeScript strict, без `any`.**
- Только **functional components**, без class components.
- Только **named exports** (исключение: defineObject/SDK-шаблоны используют `export default` — следуем шаблону SDK там, где он требует).
- **Types вместо interfaces** (кроме расширения сторонних).
- Без сокращений: `employee` не `emp`, `timeEntry` не `te`.
- Короткие `//`-комментарии: объясняем ЗАЧЕМ, не ЧТО. Без JSDoc-простыней.
- **Лимиты размера:** компоненты <150 строк, сервисы/логика <200 строк, хуки <100.
- **Thin components** (рендер) → hooks (оркестрация) → logic-функции (бизнес-логика). Не мешать.
- **SSOT:** типы в `types.ts`, константы (статусы, категории, ярлыки) в `constants.ts`. Не хардкодить.
- Тесты рядом: `module.ts` + `module.test.ts`.

> Примечание по enum: CRM-правило «string literals вместо enum». SDK же требует `FieldType` (enum из twenty-sdk) и свои типы (`NavigationMenuItemType`, `ViewKey`). Их используем как есть. Наши доменные значения (категории/статусы) — string-literal union + SSOT в `constants.ts`.

## 2. Нейминг (выравнивание с CRM — ADR-0004)

Workspace общий с CRM. CRM-конвенция (`CUSTOMIZATION_GUIDE §3.2`) требует префикс **`credos`** для всех custom-объектов. Поэтому модуль time использует префикс **`credosTime`**.

| Тип | Конвенция | Пример |
|---|---|---|
| **Объект (nameSingular)** | `credosTime` + сущность (camelCase) | `credosTimeDepartment`, `credosTimeProject`, `credosTimeStage`, **`credosTimeWorkType`** (не Activity!), `credosTimeEntry`, `credosTimeEmployee`, `credosTimeBillingLink` |
| **Поле** | camelCase, как в CRM | `hours`, `plannedEffort`, `actualEffort`, `startDate`/`endDate`, `budget`/`amount`, `owner`/`manager`, `company` |
| **Личность/сотрудник** | ссылка на стандартный `WorkspaceMember` (owner/manager); `credosTimeEmployee` — только профиль (отдел+ёмкость) | — |
| **universalIdentifier** | стабильный UUID v4 | константа в `universal-identifiers.ts` |
| **Файлы** | kebab-case | `credos-time-entry.object.ts` |
| **i18n/ярлыки** | русские (см. `L10N_GLOSSARY.md`) | «Запись трудозатрат», «Вид работ» |

⚠️ Запреты: НЕ «Activity» (занято `credosActivity`), НЕ голый «Project» (есть `credosProject` в roadmap), НЕ дублировать личность сотрудника (есть `WorkspaceMember`).

## 3. Локализация
- **Все labels и справочники — русские** (см. синтез §7a). Коды enum (FieldType, наши string-literal) — латиница, ярлык русский.
- Дни недели, даты — русская локаль.

## 4. SDK-специфика (из twenty-sdk docs)
- Каждый видимый объект = `defineObject` + `defineView` (дефолтный) + `defineNavigationMenuItem`. Без пары — невидим.
- Серверная логика/мутации из front-компонентов — только через `/s/`-route logic-функции (`RestApiClient`). Front в песочнице (Web Worker), нет прямого доступа к БД/host DOM.
- Ровно одна `defineApplicationRole` (дефолтная); доп. — `defineRole`.
- `universalIdentifier` стабильны между деплоями (иначе пересоздание сущностей).
- `engines.twenty` в package.json (целевая 2.x); версия строго растёт при publish.

## 5. Процесс (адаптировано из CRM)
- **Исследовать → спланировать → кодить инкрементально → проверить → задокументировать.**
- Проверка: `yarn twenty dev --once --dry-run` (предпросмотр) + typecheck + integration-тесты.
- **Dev-report по сессии:** `apps/time/.planning/dev-reports/NNN-YYYY-MM-DD-описание.md` (цель, что сделано, файлы, ограничения) — по образцу CRM.
- Conventional commits: `feat(time):`, `fix(time):`, `chore:`. Описания коммитов — **по-русски** (per CLAUDE.md).
- Документация/общение — русский; код/комментарии — английский; UI — русский.

## 6. Зоны безопасности (зелёная / жёлтая / красная)

Модель зон из CredosCRM (`../../research/credos-crm-standards/CUSTOMIZATION_GUIDE.md`) применяется и здесь. Главное преимущество SDK-app: почти всё — зелёная зона.

| Зона | Что | Правила | Для time-app |
|---|---|---|---|
| 🟢 **Зелёная** | наш изолированный SDK-пакет `apps/time/` (objects, views, front, logic, roles) | свободно | **99% работы здесь** — SDK не трогает ядро |
| 🟡 **Жёлтая** | точечные правки ядра форка: роуты, навигация-ядро, `.env.example`, регистрация | минимально + маркеры `// CREDOS-BEGIN/END` + запись в `core-changes.md` | **только если** понадобится СБИС-рельса (полная смена сайдбара) — отдельный core-PR в CredosCRM1, НЕ в этот репо |
| 🔴 **Красная** | `engine/`, `twenty-orm/`, `workspace-schema-builder/`, `auth/` | **НЕ ТРОГАТЬ** | никогда; SDK-app сюда не лезет |

**Ключевой принцип:** SDK-app спроектирован так, чтобы оставаться в 🟢 — раздел-папка «Время», объекты, сетка/таймер, approval — всё через `defineX`, без правок ядра. Жёлтая зона возникает только для опциональной СБИС-рельсы и живёт в форке (с маркерами + `core-changes.md`), а НЕ в `apps/time/`.

**Если придётся в жёлтую зону:**
- Обернуть правку маркером `// CREDOS-BEGIN: <зачем>` … `// CREDOS-END`.
- Записать в `core-changes.md` форка (дата, файл, причина, риск merge).
- Минимальная поверхность (регистрация, не логика — логика в зелёной зоне).

## 7. Чек-лист перед коммитом
- [ ] Нейминг с префиксом `tt`, без коллизий
- [ ] Labels/справочники русские
- [ ] Лимиты размера файлов соблюдены
- [ ] Типы strict, без `any`
- [ ] Видимый объект имеет view + nav item
- [ ] Мутации из front — через `/s/`-route
- [ ] universalIdentifier стабильны
- [ ] Dev-report при значимых изменениях

---

## Референс-копии стандартов CRM
`../../research/credos-crm-standards/`:
- `DEVELOPMENT_STANDARDS.md` — полные стандарты (gold/silver/bronze)
- `CUSTOMIZATION_GUIDE.md` — зоны безопасности, префиксы, маркеры
- `CLAUDE-code-style-and-naming.md` — стиль кода + нейминг (выжимка)
- `crm-best-practices-it-integrator.md` — практики ИТ-интегратора
- `core-changes.md` — журнал правок ядра (формат)
