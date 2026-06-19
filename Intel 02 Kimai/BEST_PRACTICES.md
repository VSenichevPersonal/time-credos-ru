# Timetta vs Kimai — Лучшие практики для воссоздания

**Дата:** 2026-06-20 | **Цель:** взять лучшее из обеих систем

---

## СВОДНАЯ ТАБЛИЦА

| Аспект | 🏆 Победитель | Что берём |
|--------|-------------|-----------|
| **Модель трекинга** | Timetta | Недельная сетка (Line→Allocation) — нагляднее для команд |
| **Формат времени** | Timetta | Decimal часы (2.5ч) — удобнее секунд |
| **Иерархия проектов** | Timetta | Organization→Project→Task (глубже, гибче) |
| **Простота API** | Kimai | JSON REST + Swagger — стандартнее OData |
| **Аутентификация** | Kimai | SAML/LDAP/DB/2FA — больше опций чем только OIDC |
| **Инвойсинг** | Kimai | Встроенный (5 форматов) — полнее чем Timetta |
| **Бюджеты** | Kimai | Деньги + время на каждом уровне — проще |
| **Плагины** | Kimai | Marketplace — расширяемость |
| **Meta Fields** | Kimai | Key-value без миграций — гениально |
| **RBAC** | Kimai | Team-based ACL (many-to-many) — гибче |
| **AI** | Timetta | Агенты + промпты + контекстные схемы |
| **CRM** | Timetta | Deals, Contacts, Interactions, Campaigns |
| **Ресурсы** | Timetta | ResourceRequest, Booking, Levels, Skills |
| **Lifecycles** | Timetta | 18 state machines — полный контроль процессов |
| **Интеграции** | Timetta | GitLab, 1С, Dadata |
| **Открытость** | Kimai | AGPL-3.0, можно форкнуть |
| **152-ФЗ** | Timetta | Реестр ПО РФ, дата-центры РФ |

---

## ЧТО БЕРЁМ ИЗ KIMAI

### 1. Модель трекинга времени (упрощённая)
```
Kimai: begin/end (DATETIME) + duration (INT секунды)
Плюс: таймер (punch-in/punch-out), мульти-таймер
```
**Для нашей системы:** поддержка обоих режимов — и ручной ввод (Timetta), и таймер (Kimai).

### 2. Meta Fields (key-value без миграций)
```sql
kimai2_timesheet_meta:
  timesheet_id → kimai2_timesheet.id
  name  VARCHAR(150)
  value TEXT
```
**Для нашей системы:** кастомные поля без ALTER TABLE. Гениально для кастомизации под клиента.

### 3. Team-based ACL (многие-ко-многим)
```
Team → team_members (M:N User)
Customer → customers_teams (M:N Team)  
Project  → projects_teams  (M:N Team)
Activity → activities_teams (M:N Team)
```
**Для нашей системы:** гибче чем Timetta (там только PermissionSet на пользователя).

### 4. Многоуровневые ставки
```
Kimai: ставка может быть задана на 4 уровнях:
  User → Customer → Project → Activity
  (приоритет: более специфичная побеждает)
```
**Для нашей системы:** Timetta только ProjectTariff + RateMatrix. Kimai-подход гибче.

### 5. Инвойсинг
```
Kimai: PDF, HTML, DOCX, ODS, XLSX, CSV + Twig-шаблоны
Timetta: только PDF через OData (беднее)
```
**Для нашей системы:** внедрить Kimai-подобный движок инвойсинга.

### 6. Плагинная архитектура
```php
namespace KimaiPlugin {
    interface PluginInterface {
        public function getName(): string;
        public function getPath(): string;
    }
}
```
**Для нашей системы:** предусмотреть plugin-систему с marketplace.

### 7. BudgetTrait (бюджеты на всех уровнях)
```php
trait BudgetTrait {
    float $budget;      // денежный бюджет
    int $timeBudget;    // временной бюджет (секунды)
    string $budgetType; // month/lifetime
}
```
**Для нашей системы:** Timetta считает только постфактум (P&L). Добавить бюджеты на уровне Customer/Project/Activity.

### 8. exported-флаг (защита от изменений)
```
Kimai: после экспорта timesheet.exported = true → запись нельзя редактировать
```
**Для нашей системы:** защита аудиторского следа.

---

## ЧТО БЕРЁМ ИЗ TIMETTA

### 1. Недельная сетка таймшита
```
TimeSheet (неделя) → TimeSheetLine (клиент/проект/работа) → TimeAllocation (часы по дням)
```
**Для нашей системы:** основная модель таймшита. Удобнее чем поштучные записи Kimai.

### 2. Decimal-часы
```
Timetta: hours DECIMAL (2.5 = 2ч30м)
Kimai: duration INT (9000 = 2.5ч в секундах)
```
**Для нашей системы:** Decimal читаемее и удобнее для API/UI.

### 3. Полноценный CRM
```
Organization → Contacts, Deals, Interactions, Campaigns
Deal: NEW→QUALIFICATION→NEGOTIATION→WON/LOST
```
**Для нашей системы:** Timetta CRM-модель (Kimai только Customer).

### 4. Ресурсное планирование
```
User → Level (L1-L6), Skills, Competences, Location
ResourceRequest, BookingEntry, ResourcePlan
```
**Для нашей системы:** Kimai вообще не умеет. Берём Timetta-модель.

### 5. Lifecycle State Machines
```
18 жизненных циклов, 77 состояний с цветами
Каждое состояние: code, name, style, isInitial, isFinal
```
**Для нашей системы:** универсальный движок состояний для всех сущностей.

### 6. OData API
```
$select, $expand, $filter, $orderby, $top, $skip, $apply
861 Function + 672 Action
```
**Для нашей системы:** если нужна сложная аналитика. Kimai REST проще, OData мощнее.

### 7. AI-подсистема
```
AiContextSchema → AiPrompt → Agent → AgentRun
```
**Для нашей системы:** Kimai не имеет AI. Берём Timetta-архитектуру.

### 8. Интеграции с экосистемой РФ
```
1С, Dadata (ИНН→реквизиты), реестр ПО РФ
```
**Для нашей системы:** обязательно для российского рынка.

---

## РЕКОМЕНДУЕМАЯ АРХИТЕКТУРА

```
┌─────────────────────────────────────────────────┐
│              НАША СИСТЕМА (гибрид)                │
├─────────────────────────────────────────────────┤
│ Модель таймшитов     → Timetta (сетка)           │
│ Формат времени        → Timetta (Decimal часы)    │
│ Иерархия проектов     → Timetta (глубже)          │
│ Бюджеты               → Kimai (Trait на всех ур.) │
│ Ставки                → Kimai (4 уровня) + Timetta│
│ Инвойсинг             → Kimai (5 форматов)        │
│ RBAC                  → Kimai (Team ACL)          │
│ Кастомные поля        → Kimai (Meta key-value)    │
│ Плагины               → Kimai (Marketplace)       │
│ Экспорт               → Kimai (exported-флаг)     │
│ CRM                   → Timetta                   │
│ Ресурсы               → Timetta                   │
│ Lifecycles            → Timetta                   │
│ AI                    → Timetta                   │
│ Интеграции РФ         → Timetta (1С, Dadata)      │
│ API                   → Kimai (REST+Swagger)      │
│ Auth                  → Kimai (SAML/LDAP/2FA)     │
│ БД                    → Timetta (PostgreSQL)      │
│ 152-ФЗ                → Timetta (реестр, ЦОДы РФ) │
└─────────────────────────────────────────────────┘
```

## ПРИОРИТЕТ ВНЕДРЕНИЯ

### Фаза 1: Ядро (Kimai-подход — быстро подняться)
1. PostgreSQL + Doctrine-подобная ORM
2. Customer → Project → Activity → Timesheet (Kimai-модель, проще)
3. REST API + Swagger
4. Auth (DB + SAML + 2FA)
5. Team ACL

### Фаза 2: Углубление (Timetta-подход — расширить)
6. Недельная сетка TimeSheet→Line→Allocation
7. Decimal часы
8. Lifecycle State Machines
9. Meta Fields (key-value)
10. Budgets (Trait)

### Фаза 3: Экосистема (гибрид)
11. CRM (Organization, Contact, Deal)
12. Ресурсное планирование
13. Инвойсинг (Kimai-стиль, 5 форматов)
14. Плагинная система
15. AI-подсистема

### Фаза 4: РФ-специфика
16. 1С интеграция
17. Dadata
18. 152-ФЗ compliance
19. Реестр ПО РФ

---

## ИТОГО

| Система | Даёт |
|---------|------|
| **Kimai** | Открытый код, простота, плагины, инвойсинг, Team ACL, Meta Fields |
| **Timetta** | Глубокая модель (CRM+Ресурсы+AI), Lifecycles, 152-ФЗ |
| **Гибрид** | 80% Timetta-функционала + 100% Kimai-расширяемости при 50% затрат |
