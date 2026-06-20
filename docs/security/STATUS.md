# CISO STATUS — time.credos.ru

Текущий security-posture + лог зоны. Обновляет CISO. Канал команды — [.AITEAM/SIGNALS.md](../../.AITEAM/SIGNALS.md).

## Posture: 🟢 LOW

Внутренний инструмент, dev/staging, 15–20 пользователей, внешней поверхности нет. Главный вектор — PII сотрудников + конфиденциальность трудозатрат (152-ФЗ). Открытых P0 нет.

## Открытые findings

| ID | Sev | Кратко | Owner |
|---|---|---|---|
| [CISO-001](findings/CISO-001-pii-in-git.md) | P1 | 42 реальных ФИО+email в git (`seed-real.mjs`) | Dev 2 + arch |
| [CISO-002](findings/CISO-002-approval-rbac.md) | P2 | approval без авторизации actor + separation of duties | Dev 2 + Dev 1 |
| CISO-003 | P3 | manager.role без field-level прав | Dev 2 (отложено) |
| CISO-004 | P2 | ADR-0003: общий Employee → PII видна продажам/каталогу | arch (до catalog) |

## Лог

### 2026-06-20 — старт зоны
- Онбординг CISO, начальный posture 🟢 LOW.
- Заведена `docs/security/` (структура: policy / risk register / PII inventory / findings / specs / reviews / checklists / status).
- Проактивный код-ревью: секреты ✅ чисто; найдены CISO-001..004.
- ADR security-review 0001–0004: 0004 approve, 0001/0002 approve+concern, 0003 concern (CISO-004).
- Спека RBAC approval отдана Dev 1/Dev 2.
