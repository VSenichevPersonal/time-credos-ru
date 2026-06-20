# CISO-011: APPROVED записи не заблокированы от изменений

**Severity:** P2  
**Статус:** OPEN  
**Owner:** Dev 2 (logic-functions + role canUpdate)  
**Источник:** REF-CHECK vs Kimai `exported`-флаг (`research/timetta-kimai-timesheet-views.md` L105, L150)

## Суть

В Kimai записи после согласования/экспорта блокируются флагом `exported=true` — «аудиторский след». В нашей системе записи со статусом `APPROVED` можно изменить или удалить:

1. **`op=delete`** (`time-entry-api.logic.ts` L113-115): нет проверки `status !== APPROVED`. Руководитель уже согласовал, запись удалена → в зарплате/отчёте пустота.
2. **`op=upsert`** (L120-146): нет проверки статуса. PATCH на APPROVED-запись → `hours`/`projectId` изменены после согласования.
3. **Прямое REST** `PATCH /rest/credosTimeEntries/{id}` под user-токеном: обходит logic-function полностью → нет никакой защиты статуса на уровне платформы (поле `status` редактируемо, `canUpdateAllObjectRecords: true` в `default-role`).

## Последствие

Согласованные данные могут быть изменены после факта согласования → нарушение целостности табеля/расчёта зарплаты. Особенно критично при F-F экспорте в 1С:ЗУП (запись в системе не совпадает с тем, что ушло в 1С).

## Связь с CISO-006

Scenario A CISO-006 (filter injection в `runSubmit` → обход `status[eq]:DRAFT`) — смежный риск: при инъекции можно разжаловать APPROVED обратно в DRAFT, потом изменить, потом снова сабмитить.

## Требования к Dev 2

### Уровень 1 (минимум, сейчас — P2):
```typescript
// time-entry-api.logic.ts: op=delete
const entry = await api.get<TimeEntry>(`/rest/credosTimeEntries/${params.id}`);
if (entry.status === ENTRY_STATUS.APPROVED) {
  return { ok: false, error: 'cannot_delete_approved' };
}

// time-entry-api.logic.ts: op=upsert
// Аналогично: если entry.status === APPROVED → reject
```

### Уровень 2 (надёжнее, RBAC-волна):
Запись в статусе APPROVED: `canUpdate=false` для роли «Сотрудник» через fieldPermissions. Только Владелец/Руководитель может менять APPROVED (для исправления ошибок с явным логом).

### Уровень 3 (прод, аналог Kimai):
Поле `locked: Boolean` или запрет через default-role `canUpdateObjectRecords: false` для `credosTimeEntry` в статусе APPROVED + исключение для роли «Руководитель»/«Владелец».

## Ограничение прямого REST

**Прямой `PATCH /rest/credosTimeEntries/{id}` не защищён.** Пока CISO-005 не решён (нет server-side identity) — platform-level блокировку через `fieldPermissions` навесить некуда. Временная мера: `op=delete/upsert` guard в logic-function (Уровень 1).

## DoD (для QA)

1. `POST /s/time-entry op=delete id={APPROVED-entry}` → `{ ok:false, error:'cannot_delete_approved' }`.
2. `POST /s/time-entry op=upsert id={APPROVED-entry}` → `{ ok:false, error:'cannot_modify_approved' }`.
3. Прямой `DELETE /rest/credosTimeEntries/{approved-id}` — пока не защищён (отмечено TODO), закроется в RBAC-волне.

## Аналог Kimai

Kimai: `exported`-флаг на записи → UI скрывает/запрещает edit/delete. Наш аналог: `status=APPROVED` должен иметь тот же эффект. При F-F экспорте в 1С: экспортированные записи → `exported: true` (поле добавить при F-F реализации) → double-lock (APPROVED + exported).
