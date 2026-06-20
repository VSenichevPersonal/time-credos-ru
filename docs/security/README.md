# Security — time.credos.ru (SDK-app учёта трудозатрат)

Зона CISO. Security governance внутреннего инструмента Кредо-С: 152-ФЗ (PII сотрудников + конфиденциальность трудозатрат), RBAC ролей приложения, ADR security-review, risk register.

## Контекст posture

- **Тип:** внутренний инструмент, 15–20 пользователей, dev/staging-среда (Twenty 2.14, Railway). Внешней поверхности атаки практически нет.
- **Главный актив:** PII сотрудников (ФИО, отдел, профиль `credosTimeEmployee`, ссылка на `WorkspaceMember`) + трудозатраты (чувствительная HR/коммерческая информация).
- **Auth/RBAC:** через платформу Twenty (ADR-0001, central IdP). Приложение определяет свои роли (`apps/time/src/roles/`).
- **Общий workspace** с CRM и app catalog → разграничение доступа к общим мастер-данным Department/Employee (ADR-0003).

## Структура зоны

```
docs/security/
├── README.md          ← навигация + posture (этот файл)
├── STATUS.md          ← текущий posture + открытые findings + лог
├── CISO_POLICY.md     ← policy + 152-ФЗ + правила PII/секретов/RBAC
├── RISK_REGISTER.md   ← реестр рисков (ID, severity, статус, owner)
├── PII_INVENTORY.md   ← карта ПДн (152-ФЗ ROPD-lite): поля, хранение, доступ
├── findings/          ← детальные findings P0–P2 (репро, требование, DoD)
│   ├── CISO-001-pii-in-git.md
│   └── CISO-002-approval-rbac.md
├── specs/             ← требования к разработке (для Dev 1/Dev 2)
│   └── RBAC_APPROVAL.md
├── reviews/           ← вердикты ciso-review по ADR
│   └── ADR-REVIEW-LOG.md
└── checklists/        ← операционные чек-листы
    └── pre-commit-security.md
```

## Документы зоны

| Файл | Назначение |
|---|---|
| [STATUS.md](STATUS.md) | Текущий posture, открытые findings, лог изменений |
| [RISK_REGISTER.md](RISK_REGISTER.md) | Реестр рисков (ID, severity, статус, owner) |
| [CISO_POLICY.md](CISO_POLICY.md) | Security policy + 152-ФЗ posture + правила PII/секретов |
| [PII_INVENTORY.md](PII_INVENTORY.md) | Карта ПДн: какие поля = PII, где хранятся, кто видит |
| [specs/RBAC_APPROVAL.md](specs/RBAC_APPROVAL.md) | Спека RBAC согласования (для Dev 1/Dev 2) |
| [reviews/ADR-REVIEW-LOG.md](reviews/ADR-REVIEW-LOG.md) | Вердикты ciso-review по ADR 0001–0004 |
| [checklists/pre-commit-security.md](checklists/pre-commit-security.md) | Чек-лист перед коммитом/push/sync |

## Принципы

1. **Пропорциональность.** Dev-среда, не прод. Блокируем только обоснованный риск.
2. **Least privilege.** Роли приложения — минимум прав, особенно approval/согласование.
3. **Separation of duties.** Сотрудник не согласует свои трудозатраты.
4. **PII vs git.** Реальные ФИО/ИНН/email — не в репозиторий. Сид-данные обезличены.
5. **Секреты.** Railway-токены / `APP_SECRET` / `TWENTY_APP_ACCESS_TOKEN` — только `.env`/Railway.
