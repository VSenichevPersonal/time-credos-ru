# CISO-требования: OLAP + ПДн (C4)

CISO-спека для OLAP фазы 02 (`/s/reports` параметрический, `groupBy` + `filters[]`). Owner реализации: Dev 2. Связь: CISO-005/006/007, REQ-0003, OLAP_REPORTS_RESEARCH §5.

## TL;DR

| Измерение | Статус | Условие доступа |
|---|---|---|
| `dept`, `project`, `category`, `workType`, `workTypeGroup` | ✅ Безопасен сейчас | Без условий (обезличенные агрегаты) |
| `employee` (агрегат: факт/утил/под по человеку) | ⚠️ Gated | Только `isManager` |
| `entry` (лист: сырые записи с описанием) | 🔴 Hard-gated | `isManager` + (до CISO-005) только свои записи |
| Свои записи (`entry` при `actor.employeeId === row.employeeId`) | ✅ | Всегда разрешено |

## 1. Правила авторизации по измерению

### 1.1. groupBy=employee (агрегат по людям)

```typescript
// Псевдокод — требование к Dev 2
if (groupBy === 'employee') {
  if (!actor?.isManager) {
    // Вернуть только свою строку (если actor резолвлен) или пустой массив
    rows = rows.filter(r => r.key === actor?.employeeId);
    scope.redactedPII = true;   // маркер для фронта: "детализация ограничена"
  }
  // Если isManager: вернуть scope своего отдела (после CISO-005)
  // До CISO-005: вернуть всех (нынешнее поведение) — приемлемо для dev
}
```

**До CISO-005** (нет server-side identity): `byEmployee` возвращается только если `actor?.isManager` через client workspaceMemberRef. Это спуфится, но лучше чем сейчас (0 guard).

**После CISO-005**: scope по отделу руководителя (как в RBAC_MODEL.md).

### 1.2. groupBy=entry (лист сырых записей)

```typescript
if (groupBy === 'entry') {
  // Жёсткий гейт: лист доступен только если actor резолвлен
  if (!actor) return { error: 'forbidden', reason: 'identity required for entry-level drill' };
  // Руководитель: видит записи своего отдела
  // Сотрудник: видит только свои записи
  // description (текстовое) — всегда передавать в ответ (не редактировать), но НЕ индексировать
}
```

**Примечание:** `description` записи может содержать незапланированные ПДн (OLAP_RESEARCH §5.4). Drill до листа по чужим людям = повышенный риск. Журнал аудита ("кто смотрел чьи записи") — `P3`, добавить при выходе в прод.

### 1.3. Безопасные измерения (без условий)

`dept`, `project`, `category`, `workType`, `workTypeGroup`, `stage` — агрегаты без ФИО и без привязки к конкретному физлицу. Доступны всем аутентифицированным. Часы по проекту = не ПДн.

## 2. Валидация новых параметров OLAP (CISO-006 extension)

OLAP добавляет множество новых client-supplied параметров → поверхность filter injection растёт.

```typescript
// Валидация перед интерполяцией в filter-строку
const VALID_GROUP_BY = ['dept','employee','project','workType','category','stage','workTypeGroup'] as const;
const VALID_DIM = VALID_GROUP_BY;
const VALID_OP = ['eq','neq','in','like'] as const;
const VALID_SORT_BY = ['fact','util','under','name'] as const;
const VALID_SORT_DIR = ['asc','desc'] as const;

// filters[].value — тип зависит от dims:
// id-dimensions (dept,employee,project,workType,stage): UUID_RE
// category/workTypeGroup: enum-allowlist
// Все остальные типы — отклонять 400 (fail-closed)
```

Правило: **все** параметры из запроса клиента — через allowlist перед использованием. Неизвестные поля → `400 Bad Request` (не ignore).

## 3. Маркер scope в ответе

```typescript
// Контракт: обязательное поле в ответе /s/reports
interface ReportsResponse {
  rows: ReportRow[];
  scope: {
    level: 'all' | 'department' | 'self';  // какой scope применён
    redactedPII: boolean;                   // true → фронт показывает блок "ограничен доступ"
    deptId?: string;                         // если level=department
  };
  // ... totals, cursor
}
```

Фронт (Dev 1) использует `scope.redactedPII` для показа состояния «Детализация по сотрудникам доступна руководителю» — не пустота, не ошибка, объяснение (OLAP_RESEARCH §3.4).

## 4. Порядок внедрения

1. **Сейчас (OLAP фаза 02):** гейт groupBy=employee + validация filters[] параметров.
2. **После CISO-005:** scope по отделу (level=department), лист записей для руководителя.
3. **Прод:** аудит-лог drill по людям (кто/когда смотрел byEmployee детализацию).

## DoD CISO (для QA)

1. `POST /s/reports groupBy=employee` без `workspaceMemberRef` → `rows: []`, `scope.redactedPII: true`.
2. `POST /s/reports groupBy=employee` с менеджерским `workspaceMemberRef` → `rows: [все]` (до CISO-005).
3. `POST /s/reports groupBy=entry` без actor → `{ error: 'forbidden' }`.
4. `POST /s/reports filters=[{dim:"dept",op:"eq",value:"INJECT,status[neq]:active"}]` → `400` (UUID_RE fail).
5. `POST /s/reports groupBy=INVALID` → `400`.
