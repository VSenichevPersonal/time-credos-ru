# ADR-0008 — Паттерн журнала изменений полей (field change-log)

**Статус:** Accepted (2026-06-22)
**Контекст-теги:** аудит, ПДн (152-ФЗ), юр-разрешения, трудозатраты, identity

## Контекст

Где изменения данных юридически/операционно значимы — нужен аудит «**кто · когда · было → стало**» по конкретному полю:
- разрешения публикации / NDA проекта (кто снял NDA, разрешил публикацию);
- трудозатраты (кто добавил / стёр / изменил часы или статус);
- правки карточки клиента/контакта (кто что добавил/удалил);
- согласия ПДн, отписки.

**Ядро Twenty SDK 2.14 полную per-field историю НЕ даёт** (исследовано):
- `timelineActivity` / relation `timelineActivities` — только для объектов ядра (person/company/opportunity/…), generic-таргета на кастом-объекты нет;
- `isAuditLogged` — есть в read-only метаданных, но во входном `ObjectManifest` (`defineObject`) недоступен → декларативно не включить;
- нативные `createdAt`/`updatedAt`/`createdBy`/`updatedBy` — есть бесплатно, но **whole-record** (вся запись), без diff по полю.

## Решение

Свой **change-log по образцу** (применён к 2 доменам, обобщается на любой объект):

1. **Объект-журнал** `{entity}Log` (ADDITIVE, технический — nav скрыт, в `TECHNICAL_VIEWS` schema-guard):
   - `{entity}` relation MANY_TO_ONE → родитель, **onDelete CASCADE** (лог производный);
   - `fieldName` TEXT (labelIdentifier, searchable), `oldValue` / `newValue` TEXT nullable;
   - `actor` TEXT nullable — **server-truth** «кто» (НЕ client-supplied);
   - `changedAt` DATE_TIME default now;
   - обратная сторона `{Entity}.{...}Logs` ONE_TO_MANY (вынести в `src/fields/`).
2. **Захват изменений** — два пути в зависимости от канала мутации:
   - **onUpdate database-event триггер** (`eventName '{obj}.updated'`, фильтр `updatedFields` по важным полям) → на каждое изменённое поле пишет запись. **Ловит и нативный UI ядра**, и REST. actor — из `event.userWorkspaceId → userWorkspaceRef → employee` ([[twenty-sdk-apply-gotchas]], CISO-005 мост; деградация → null для legacy без ref).
   - **из `/s/`-route** (когда мутация идёт через свою logic-function, напр. CRUD трудозатрат) — вызов `shared/write-{}-log` после изменения; покрывает create/delete/смену статуса.
   - Запись лога в `try/catch` — **сбой лога НЕ валит основную операцию** (лог побочный).
3. **Показ** — relation reverse → виджет-список в карточке (page-layout tab), сортировка `changedAt` DESC (свежие сверху), read-only.

## Применено

- `credosTimeEntryLog` — трудозатраты: create / update(часы) / delete / смена статуса (через `/s/time-entry` + approval.logic, `shared/write-entry-log`).
- `credosTimeMarketingLog` — маркетинг-поля проекта (NDA/публикации/consent/отрасль): onUpdate-триггер `project-marketing-log-updated.logic`, `shared/write-marketing-log`, виджет «История» во вкладке «Маркетинг».

## Переиспользование (когда применять)

Где изменения значимы для юр/операций/ПДн. НЕ для всего подряд (доп. объект + триггер на сущность). Кандидаты на будущее: карточка клиента/организации (кто добавил/удалил контакт, сменил реквизиты), согласования, любые разрешения.
Общие кирпичи: `shared/resolve-actor` (server-truth «кто»), `shared/write-{}-log` (запись).

## Последствия

**+** полный per-field аудит; ловит нативный UI; server-truth actor; не ломает основную операцию.
**−** на каждую сущность — свой лог-объект + триггер (осознанно узко); `actor=null` для legacy-пользователей без `userWorkspaceRef` (закроется при pre-seed маппинга / RBAC-волне, см. CISO-005).
