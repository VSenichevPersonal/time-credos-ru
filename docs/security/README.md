# Security — time.credos.ru (SDK-app учёта трудозатрат)

Зона CISO. Security governance внутреннего инструмента Кредо-С: 152-ФЗ (PII сотрудников + конфиденциальность трудозатрат), RBAC ролей приложения, ADR security-review, risk register.

## Контекст posture

- **Тип:** внутренний инструмент, 15–20 пользователей, dev/staging-среда (Twenty 2.14, Railway). Внешней поверхности атаки практически нет.
- **Главный актив:** PII сотрудников (ФИО, отдел, профиль `credosTimeEmployee`, ссылка на `WorkspaceMember`) + трудозатраты (чувствительная HR/коммерческая информация).
- **Auth/RBAC:** через платформу Twenty (ADR-0001, central IdP). Приложение определяет свои роли (`apps/time/src/roles/`).
- **Общий workspace** с CRM и app catalog → разграничение доступа к общим мастер-данным Department/Employee (ADR-0003).

## Документы зоны

| Файл | Назначение |
|---|---|
| [RISK_REGISTER.md](RISK_REGISTER.md) | Реестр рисков (ID, severity, статус, owner) |
| [CISO_POLICY.md](CISO_POLICY.md) | Security policy + 152-ФЗ posture + правила PII/секретов |

## Принципы

1. **Пропорциональность.** Dev-среда, не прод. Блокируем только обоснованный риск.
2. **Least privilege.** Роли приложения — минимум прав, особенно approval/согласование.
3. **Separation of duties.** Сотрудник не согласует свои трудозатраты.
4. **PII vs git.** Реальные ФИО/ИНН/email — не в репозиторий. Сид-данные обезличены.
5. **Секреты.** Railway-токены / `APP_SECRET` / `TWENTY_APP_ACCESS_TOKEN` — только `.env`/Railway.
