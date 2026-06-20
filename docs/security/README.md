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
├── README.md              ← навигация + posture (этот файл)
├── STATUS.md              ← текущий posture + открытые findings + лог
├── CISO_POLICY.md         ← policy + 152-ФЗ + правила PII/секретов/RBAC/filter-injection
├── RISK_REGISTER.md       ← реестр рисков (CISO-001..008)
├── PII_INVENTORY.md       ← карта ПДн (152-ФЗ ROPD-lite): поля, хранение, доступ
├── PII_152FZ_REVIEW.md    ← ROPD-оценка по 152-ФЗ (C-1, прод-гейты)
├── findings/              ← детальные findings (репро, требование, DoD)
│   ├── CISO-001-pii-in-git.md          P1 MITIGATING
│   ├── CISO-002-approval-rbac.md       P2
│   ├── CISO-005-time-entry-idor.md     P1
│   ├── CISO-006-filter-injection.md    P2
│   ├── CISO-007-reports-data-disclosure.md  P2
│   └── CISO-008-absence-pii.md         P3
├── specs/                 ← требования к разработке (для Dev 1/Dev 2)
│   ├── RBAC_APPROVAL.md   ← спека RBAC согласования (C1/C2/C3)
│   └── RBAC_MODEL.md      ← полная матрица ролей (для RBAC-волны)
├── reviews/               ← вердикты ciso-review по ADR
│   └── ADR-REVIEW-LOG.md  ← ADR-0001..0006
└── checklists/            ← операционные чек-листы
    └── pre-commit-security.md
```

## Документы зоны

| Файл | Назначение |
|---|---|
| [STATUS.md](STATUS.md) | Текущий posture, открытые findings, лог изменений |
| [RISK_REGISTER.md](RISK_REGISTER.md) | Реестр рисков CISO-001..008 (severity, статус, owner) |
| [CISO_POLICY.md](CISO_POLICY.md) | Security policy + 152-ФЗ + правила PII/секретов/RBAC/filter/прод-гейты |
| [PII_INVENTORY.md](PII_INVENTORY.md) | Карта ПДн: какие поля = PII, где хранятся, кто видит |
| [PII_152FZ_REVIEW.md](PII_152FZ_REVIEW.md) | ROPD-оценка: операции обработки, прод-гейты 152-ФЗ |
| [specs/RBAC_APPROVAL.md](specs/RBAC_APPROVAL.md) | Спека RBAC согласования (C1 isManager, C2 SoD, C3 scope) |
| [specs/RBAC_MODEL.md](specs/RBAC_MODEL.md) | Полная матрица ролей (Сотрудник/Руководитель/Владелец, RBAC-волна) |
| [reviews/ADR-REVIEW-LOG.md](reviews/ADR-REVIEW-LOG.md) | Вердикты ciso-review по ADR 0001–0006 |
| [checklists/pre-commit-security.md](checklists/pre-commit-security.md) | Чек-лист перед коммитом/push/sync |

## Принципы

1. **Пропорциональность.** Dev-среда, не прод. Блокируем только обоснованный риск.
2. **Least privilege.** Роли приложения — минимум прав, особенно approval/согласование.
3. **Separation of duties.** Сотрудник не согласует свои трудозатраты.
4. **PII vs git.** Реальные ФИО/ИНН/email — не в репозиторий. Сид-данные обезличены.
5. **Секреты.** Railway-токены / `APP_SECRET` / `TWENTY_APP_ACCESS_TOKEN` — только `.env`/Railway.
