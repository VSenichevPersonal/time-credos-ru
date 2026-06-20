# CISO-006 — REST filter string injection в logic-functions (P2)

**Статус:** OPEN · **Severity:** P2 · **Owner устранения:** Dev 2 · **Дата:** 2026-06-20

## Суть

Оба logic-function (`time-entry-api.logic.ts`, `approval.logic.ts`) интерполируют client-supplied params напрямую в строки фильтра Twenty REST API формата `field[op]:value1,field2[op]:value2,...` без валидации. Запятая — разделитель условий в этом формате, `URLSearchParams` не экранирует её в значениях → сервер Twenty разберёт инъецированные условия как самостоятельные фильтры.

## Уязвимые точки

| Файл | Строка | Инъецируемый param | Результирующая строка |
|---|---|---|---|
| `time-entry-api.logic.ts` | L85 | `workspaceMemberRef` | `workspaceMemberRef[eq]:${workspaceMemberRef}` |
| `time-entry-api.logic.ts` | L153–155 | `from`, `to` | `date[gte]:${from},date[lte]:${to},employeeId[eq]:...` |
| `approval.logic.ts` | L34 | `workspaceMemberRef` | `workspaceMemberRef[eq]:${workspaceMemberRef}` |
| `approval.logic.ts` | L114 | `from`, `to`, `employeeId` | `date[gte]:${from},…,status[eq]:DRAFT` |
| `approval.logic.ts` | L154 | `id` (из split params.ids) | `id[eq]:${id}` |

## Сценарии атаки

### A (HIGH) — обход статуса в `runSubmit`, разжалование утверждённых записей

`runSubmit` (approval.logic.ts L114) финальный фильтр:
```
date[gte]:{from},date[lte]:{to},employeeId[eq]:{employeeId},status[eq]:DRAFT
```
Атакующий передаёт `employeeId = "VICTIM_ID,status[neq]:DRAFT"`:
```
…,employeeId[eq]:VICTIM_ID,status[neq]:DRAFT,status[eq]:DRAFT
```
Если Twenty обрабатывает конфликтующие условия последовательно (или берёт первое из дублей) — могут попасть APPROVED-записи. `setStatus` ставит `SUBMITTED` → **разжалование согласованных трудозатрат** (целостность процесса согласования нарушена).

Даже если Twenty AND'ит оба условия → `status≠DRAFT AND status=DRAFT` = пусто (безвредно). Но поведение зависит от версии Twenty → неопределённость = риск.

### B (MEDIUM) — фильтр по `workspaceMemberRef` + extra-условие

`workspaceMemberRef = "VICTIM_REF,active[eq]:false"` → резолвит только inactive-сотрудника с этим ref. Позволяет брать «первого» из неожиданного подмножества, переопределяя что возвращает `resolveEmployeeId`/`resolveActor`.

### C (LOW) — datetime hijack в `from`/`to`

`from = "1970-01-01,status[eq]:APPROVED"` в time-entry-api → в `entriesFilter` добавляется `status[eq]:APPROVED`. `employeeId` всё равно остаётся серверно-резолвленным (через `resolveEmployeeId`) → атакующий не выходит за свой employeeId, но читает только APPROVED-записи (информация о статусах).

## Почему классический filter injection, а не «просто bad practice»

Twenty REST API принимает `filter` как единую строку query-param. `URLSearchParams` кодирует весь блок как `filter=date%5Bgte%5D%3A...%2Cstatus%5Beq%5D%3AAPPROVED` — сервер декодирует и парсит `,` как разделитель. Инъекция проходит URL-слой прозрачно.

## Отличие от CISO-005

[CISO-005](CISO-005-time-entry-idor.md) — клиент управляет ЛИЧНОСТЬЮ (identity spoofing). CISO-006 — клиент управляет УСЛОВИЯМИ ВЫБОРКИ (filter manipulation). Оба присутствуют одновременно; CISO-006 усиливает CISO-005 (даже при наличии server-side identity, фильтры по-прежнему инъецируемы).

## Severity

**P2** (medium). Смягчает: dev-среда, доверенные юзеры, нет внешней поверхности. Усиливает: прямое воздействие на целостность согласования (сценарий A). До прода — фиксировать в пакете с CISO-005.

## Требование (Dev 2)

Валидировать все client-params перед интерполяцией в filter-строку:

```typescript
// UUID (employeeId, workspaceMemberRef, id, projectId, workTypeId)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validateUUID = (v: string | undefined, name: string): string => {
  if (!v || !UUID_RE.test(v)) throw new Error(`invalid ${name}`);
  return v;
};

// ISO date (from, to)
const DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/;
const validateDate = (v: string | undefined, name: string): string => {
  if (!v || !DATE_RE.test(v)) throw new Error(`invalid ${name}`);
  return v;
};
```

Применить ко всем точкам из таблицы выше ДО интерполяции.

Альтернатива (если Twenty SDK 2.14 поддерживает): перейти на structured filter API (объект вместо строки) — убирает класс целиком.

## DoD

1. Передача `employeeId = "VICTIM_ID,status[neq]:DRAFT"` → `400 Bad Request` / `invalid employeeId`.
2. Передача `from = "1970-01-01,status[eq]:APPROVED"` → валидация отклоняет.
3. Все filter-строки содержат только allow-listed символы из валидированных params.
