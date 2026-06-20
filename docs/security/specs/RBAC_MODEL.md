# Матрица ролей — time.credos.ru (RBAC-волна)

Спека CISO для RBAC-волны. Owner реализации: Dev 2 (серверный enforcement) + Dev 1 (UI-gate). Ревью: CISO. Связь: CISO-002/005/007, REQ-0001, ADR-0001.

## Роли приложения

| Роль | Определение | Файл / mechanism |
|---|---|---|
| **Владелец/Админ** | workspace admin, полный доступ | workspace default admin role |
| **Руководитель** | `manager.role.ts` (`defineRole`) | `apps/time/src/roles/manager.role.ts` |
| **Сотрудник** | новая роль (RBAC-волна) | `apps/time/src/roles/employee.role.ts` (создать) |
| **(function-role)** | identity logic-functions / `TWENTY_APP_ACCESS_TOKEN` | `default-role.ts` (`defineApplicationRole`) |

## Матрица прав

### Объекты (CRUD через платформенный UI / REST напрямую)

| Объект | Сотрудник | Руководитель | Владелец |
|---|---|---|---|
| `credosTimeEntry` — свои | R/W | R/W | R/W |
| `credosTimeEntry` — чужие | ❌ | R (своего отдела) | R/W |
| `credosTimeEmployee` — свой профиль | R | R | R/W |
| `credosTimeEmployee` — чужой профиль | R (анонимно: имя+отдел) | R (своего отдела) | R/W |
| `credosTimeProject` | R | R + write `plannedEffort`/`endDate` | R/W |
| `credosTimeDepartment` | R | R + write `approvalRequired`/`capacityFactor` (своего) | R/W |
| `credosTimeWorkType` | R | R | R/W |
| `credosTimeWorkdayCalendar` | R | R | R/W |
| `credosTimeAbsence` — своя | R/W | R/W | R/W |
| `credosTimeAbsence` — чужая | ❌ | R (своего отдела) | R/W |
| `credosTimeBillingLink` | R | R | R/W |

### Logic-functions (через /s/ endpoint)

| Endpoint | Сотрудник | Руководитель | Примечание |
|---|---|---|---|
| `POST /s/time-entry` op=list | свои записи | свои + отдел | serverside scope после CISO-005 |
| `POST /s/time-entry` op=upsert | свои записи | свои + отдел | ownership guard (CISO-005) |
| `POST /s/time-entry` op=delete | свои записи | свои + отдел | ownership guard (CISO-005) |
| `POST /s/approval` op=submit | своего периода | ❌ за другого | employeeId из params (CISO-005/006) |
| `POST /s/approval` op=approve/reject | ❌ | чужих SUBMITTED своего отдела | C1 isManager + C2 SoD — реализовано ✅ |
| `POST /s/reports` | ❌ (byEmployee пустой) | byDept/byProject/byEmployee отдела | CISO-007: guard isManager перед byEmployee |

### Settings (если появится credosTimeSettings / S1-волна)

| Действие | Сотрудник | Руководитель |
|---|---|---|
| Read настройки | ✅ (что влияет на его работу) | ✅ |
| Write Department.approvalRequired/capacityFactor | ❌ | ✅ (своего отдела) |
| Write глобального конфига (credosTimeSettings) | ❌ | только Владелец |

## Separation of Duties (SoD)

| Правило | Статус | Где |
|---|---|---|
| Approve/reject ≠ автор записи | ✅ РЕАЛИЗОВАНО Dev 2 | `approval.logic.ts` L159: `actor.employeeId !== entry.employeeId` |
| Approve только `isManager` | ✅ РЕАЛИЗОВАНО Dev 2 | `approval.logic.ts` L139: guard `actor.isManager` |
| Submit = только owner периода | ⚠️ НЕ ПРОВЕРЯЕТСЯ | `runSubmit` берёт `employeeId` из params (CISO-005/006) |
| Plan edit = только Руководитель | ✅ фронтовый gate (isManager) | UI-gate в P-D1 |

## Зависимости и блокеры

**⚠️ CISO-005 блокирует серверный enforcement:**
Пока нет server-side маппинга `userWorkspaceId → workspaceMemberRef`:
- Scope "свои записи" в logic-functions зависит от client-supplied `workspaceMemberRef`
- Role-guard в reports (`isManager`) зависит от client-supplied `workspaceMemberRef`
- Серверные проверки ownership вступают в силу только после маппинга всех workspaceMemberRef

До CISO-005 resolution: фронтовые gates (isManager hide/show) достаточны для dev.

**fieldPermissions (CISO-003):**
До RBAC-волны `manager.role.ts` имеет `fieldPermissions: []` — field-level ограничений нет.
После RBAC-волны для роли «Сотрудник»: скрыть ПДн-поля чужих сотрудников (firstName/lastName/email) через fieldPermissions.

## DoD RBAC-волны (для QA)

1. Сотрудник → POST `/s/time-entry` op=list → получает только свои записи (после CISO-005).
2. Сотрудник → POST `/s/approval` op=approve → `forbidden`.
3. Руководитель → approve собственной записи → `skipped` (SoD) ✅ (уже работает).
4. Руководитель → POST `/s/reports` → `byEmployee` содержит данные (не пустой).
5. Сотрудник → POST `/s/reports` → `byEmployee: []`.
6. Сотрудник в UI → кнопки approve/reject скрыты.
7. `credosTimeDepartment` write через REST без роли Руководитель → RBAC deny.
