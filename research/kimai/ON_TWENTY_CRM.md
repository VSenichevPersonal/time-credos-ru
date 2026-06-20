# Time Tracking на базе Twenty CRM — Оценка

**Дата:** 2026-06-20
**Репозиторий:** `/Users/vsenichev/Documents/GitHub/CredosCRM1`
**Продакшен:** https://credoscrm1.up.railway.app

---

## ВЕРДИКТ: ✅ РЕАЛЬНО. Фундамент уже готов.

Twenty CRM — это не просто CRM, а **metadata-driven application platform**.
Объекты и поля создаются во время выполнения (как в Salesforce), без изменения кода.

---

## ЧТО УЖЕ ЕСТЬ ИЗ КОРОБКИ (совпадает с Timetta)

| Timetta | Twenty CRM (стандарт) | Совпадение |
|---------|----------------------|------------|
| Organization | **Company** (modules/company) | ✅ 100% |
| Contact | **Person** (modules/person) | ✅ 100% |
| Deal | **Opportunity** (modules/opportunity) | ✅ 100% |
| Task/Issue | **Task** (modules/task) | ✅ 90% |
| Dashboard | **Dashboard** (modules/dashboard) | ✅ |
| Workflow | **Workflow** (modules/workflow) | ✅ |
| Calendar | **Calendar** (modules/calendar) | ✅ |
| Note/Comment | **Note** (modules/note) | ✅ |
| Activity/Timeline | **Timeline** (modules/timeline) | ✅ |
| File/Attachment | **Attachment** (modules/attachment) | ✅ |

## ЧТО УЖЕ СДЕЛАНО ДЛЯ КРЕДО-С (credos/)

| Модуль | Фронтенд | Бэкенд | Совпадает с Timetta |
|--------|----------|--------|---------------------|
| **Dadata** (ИНН→реквизиты) | ✅ | ✅ | ✅ Timetta-фича |
| **1С интеграция** | ✅ | ✅ | ✅ Timetta-фича |
| **AI-подсистема** | ✅ | ✅ | ✅ Агенты, STT |
| **Отчёты (PDF)** | ✅ | ✅ | ✅ Аналог Timetta Reports |
| **Quotes/КП** | ✅ | ✅ | — |
| **Beeline (телефония)** | ✅ | ✅ | — |
| **Lead collector** | ✅ | ✅ | — |
| **Аудит** | — | ✅ | ✅ |
| **Безопасность** | — | ✅ | ✅ RBAC |
| **Дашборды** | ✅ | — | ✅ |

---

## МЕТАДАННЫЕ-ДВИЖОК — КЛЮЧЕВОЕ ПРЕИМУЩЕСТВО

Twenty CRM позволяет создавать новые объекты через REST API:

```bash
# Создать объект "TimeSheet"
POST /rest/metadata/objects
{
  "nameSingular": "timeSheet",
  "labelSingular": "Таймшит",
  "labelPlural": "Таймшиты",
  "icon": "IconClock",
  "labelIdentifierFieldMetadataId": "<name-field-id>"
}

# Добавить поля
POST /rest/metadata/fields
{
  "objectMetadataId": "<timeSheet-id>",
  "name": "dateFrom",
  "label": "Дата с",
  "type": "DATE",
  "isRequired": true
}
```

**Это означает:** TimeSheet, TimeSheetLine, TimeAllocation, Activity, Rate — создаются через API,
без единой строчки кода в ядре. GraphQL API генерируется автоматически.

### Модель Metadata Engine:
```
ObjectMetadata (объект/таблица)
  ├── FieldMetadata (поле/колонка) — типы: TEXT, NUMBER, DATE, CURRENCY, RELATION, SELECT, ...
  ├── View (представление/список)
  │   ├── ViewField (колонка в списке)
  │   ├── ViewFilter (фильтр)
  │   └── ViewSort (сортировка)
  └── PageLayout (карточка объекта)
      ├── PageLayoutTab (вкладка)
      └── PageLayoutWidget (виджет на вкладке)
```

---

## КАК ДОБАВИТЬ TIME TRACKING (план)

### Фаза 1: Metadata Objects (1-2 дня)
Через REST API создать объекты:
```
TimeSheet (таймшит)
  ├── dateFrom: DATE
  ├── dateTo: DATE
  ├── dueDate: DATE
  ├── status: SELECT (Draft/Submitted/Approved/Rejected)
  └── user: RELATION → workspaceMember

TimeSheetEntry (строка таймшита)
  ├── timeSheet: RELATION → TimeSheet
  ├── project: RELATION → ... (кастомный объект Project)
  ├── activity: RELATION → Activity
  ├── hours: NUMBER (Decimal)
  ├── date: DATE
  ├── description: TEXT
  └── billable: BOOLEAN

Project (проект)
  ├── name: TEXT
  ├── code: TEXT
  ├── company: RELATION → Company
  ├── manager: RELATION → workspaceMember
  ├── status: SELECT
  ├── startDate: DATE
  └── endDate: DATE

Activity (вид работ)
  ├── name: TEXT
  ├── project: RELATION → Project (nullable = global)
  └── billable: BOOLEAN
```

### Фаза 2: Query Hooks (2-3 дня)
Добавить бизнес-логику через хуки (`credos/hooks/`):
```typescript
@WorkspaceQueryHook({
  key: 'timeSheet.create',
  type: WorkspaceQueryHookType.POST_HOOK
})
class TimeSheetPostHook {
  // Автоматически создать TimeSheetEntry для каждого дня
  // Заполнить schedule (план по дням: 8ч × 5 дней)
}
```

### Фаза 3: UI Widgets (3-5 дней)
Добавить кастомные виджеты для страницы TimeSheet (`credos/page-layout/widgets/`):
- Недельная сетка (TimeSheetGrid)
- Таймер (Kimai-подобный)
- Суммарные часы
- Отправка на согласование

### Фаза 4: Интеграции (2-3 дня)
- Запуск/остановка таймера через GraphQL mutation
- Инвойсинг на основе таймшитов (используя `credos/reports/` PDF-движок)

---

## СРАВНЕНИЕ ПОДХОДОВ

| Аспект | С нуля (Timetta/Kimai) | На Twenty CRM |
|--------|----------------------|---------------|
| **БД** | Пишем SQL миграции | Создаём через REST API |
| **API** | Пишем контроллеры | Авто GraphQL + REST |
| **UI** | Пишем React-компоненты | Виджеты в готовом Layout |
| **RBAC** | Пишем с нуля | ✅ Готово (Role + Permission) |
| **Аудит** | Пишем с нуля | ✅ Готово (Audit module) |
| **Файлы** | Пишем с нуля | ✅ Готово (Attachment) |
| **Поиск** | Пишем с нуля | ✅ Готово (Elasticsearch) |
| **Дашборды** | Пишем с нуля | ✅ Готово |
| **AI** | Пишем с нуля | ✅ Готово (Agents + STT) |
| **1C/Dadata** | Пишем с нуля | ✅ Уже сделано |
| **Телефония** | Пишем с нуля | ✅ Уже сделано |
| **Email** | Пишем с нуля | ✅ Готово |
| **Production** | Настраиваем | ✅ Railway (5 сервисов) |

## СРОКИ

| Подход | Время | Риск |
|--------|-------|------|
| С нуля (Kimai-модель) | 4-6 недель | Средний |
| На Twenty CRM (metadata) | **1-2 недели** | **Низкий** |

Экономия: **3-4 недели** за счёт готовой платформы (CRUD, RBAC, UI, интеграции).

---

## РИСКИ

| Риск | Оценка | Митигация |
|------|--------|-----------|
| Metadata API изменится в новых версиях Twenty | Низкий | Форк уже зафиксирован |
| Производительность metadata-объектов | Низкий | Twenty работает на prod с сотнями кастомных полей |
| GraphQL сложнее REST для интеграций | Средний | Есть REST API тоже (`/rest/`) |
| Twenty — CRM, не PPM | Низкий | Metadata engine позволяет любые объекты |

---

## ИТОГО

**Twenty CRM — идеальный фундамент для time tracking.**

Имея:
- ✅ Готовый CRM (Company, Person, Opportunity)
- ✅ Metadata engine (создание объектов без кода)
- ✅ GraphQL + REST API (автогенерация)
- ✅ AI-агенты
- ✅ Интеграции (1С, Dadata, телефония)
- ✅ Production на Railway
- ✅ Аудит, RBAC, файлы, поиск, дашборды

Добавление Time Tracking сводится к:
1. Создать 4 metadata-объекта через API (TimeSheet, TimeSheetEntry, Project, Activity)
2. Добавить 2-3 query hook для бизнес-логики
3. Написать 2-3 кастомных виджета для недельной сетки

**Затраты: 1-2 недели вместо 4-6.**
