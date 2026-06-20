# CISO STATUS — time.credos.ru

Текущий security-posture + лог зоны. Обновляет CISO. Канал команды — [.AITEAM/SIGNALS.md](../../.AITEAM/SIGNALS.md).

## Posture: 🟡 LOW-MEDIUM

Внутренний инструмент, dev/staging, 15–20 пользователей, внешней поверхности нет — это смягчает. Но найден класс broken access control (CISO-005, P1) в logic-functions: личность из client params, не из сессии. P0/freeze нет (нет внешней поверхности + аутентификация на входе), но до прода обязательно закрыть. Главный вектор — PII + целостность/конфиденциальность трудозатрат (152-ФЗ).

## Открытые findings

| ID | Sev | Кратко | Owner |
|---|---|---|---|
| [CISO-001](findings/CISO-001-pii-in-git.md) | P1 (MITIGATING) | ПДн-дампы сняты с git + gitignore ✅ (CISO); сид-код + история — Dev 2/arch | CISO/Dev 2/arch |
| [CISO-005](findings/CISO-005-time-entry-idor.md) | **P1** | time-entry-api: client-supplied identity → impersonation + удаление/правка/чтение чужих записей | Dev 2 + DevOps/arch |
| [CISO-002](findings/CISO-002-approval-rbac.md) | P2 | approval без авторизации actor + separation of duties (зависит от server-side identity, см. CISO-005) | Dev 2 + Dev 1 |
| CISO-003 | P3 | manager.role без field-level прав | Dev 2 (отложено) |
| CISO-004 | P2 | ADR-0003: общий Employee → PII видна продажам/каталогу | arch (до catalog) |
| [CISO-006](findings/CISO-006-filter-injection.md) | **P2** | filter injection в logic-functions: client params → Twenty filter string без валидации; обход status-check в runSubmit | Dev 2 |

## Лог

### 2026-06-20 — старт зоны
- Онбординг CISO, начальный posture 🟢 LOW.
- Заведена `docs/security/` (структура: policy / risk register / PII inventory / findings / specs / reviews / checklists / status).
- Проактивный код-ревью: секреты ✅ чисто; найдены CISO-001..004.
- ADR security-review 0001–0004: 0004 approve, 0001/0002 approve+concern, 0003 concern (CISO-004).
- Спека RBAC approval отдана Dev 1/Dev 2.
- **CISO-001 mitigation:** 5 ПДн-дампов (Директум5 xlsx, Bitrix roster.csv/html, Timetta Users json) сняты с git tracking + `.gitignore` секция ПДн + конвенция `**/pii/**`. Файлы на диске целы. Сид-код (`seed-real.mjs`) + история git — за Dev 2/arch.
