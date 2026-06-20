# AI Team — time.credos.ru

Single entry-point для перезапуска AI-команды в новой сессии.

Проект: [time.credos.ru](../README.md) — **Twenty SDK-app** учёта трудозатрат Кредо-С (ставится в платформу CredosCRM1). Внутренний инструмент, 15-20 пользователей, dev-среда.

> Отличие от команды CredosCRM: там форк ядра Twenty (upstream-merge, красные зоны engine/auth/orm). Здесь — **SDK-приложение**: ядро не трогаем вовсе, работаем только в `apps/time/src/`. Вместо upstream-merge — bump `twenty-sdk`.

## Состав команды — 6 ролей (совмещают функции)

| Роль | Handoff | Scope | Пушит сам |
|---|---|---|---|
| **arch** (senior) | [handoffs/ARCH.md](handoffs/ARCH.md) | Архитектура, ADR (`docs/adr/`), review, коммит-gate, push, **bump twenty-sdk**, аудит `credosTime`-префиксов + UUID-стабильности, актуализация документации | ✅ |
| **Dev 1** (Front + UX) | [handoffs/DEV1.md](handoffs/DEV1.md) | Frontend + дизайн: `apps/time/src/{front-components,views,page-layouts,navigation-menu-items}/`, page-layouts SSOT, timesheet-grid, i18n, бренд/темы | ❌ (через arch) |
| **Dev 2** (Data + Domain) | [handoffs/DEV2.md](handoffs/DEV2.md) | Data/Logic + домен: `apps/time/src/{objects,fields,logic-functions,roles,constants}/`, модель (Директум5↔Kimai↔Timetta), демо-данные/сид, доменные требования | ❌ (через arch) |
| **DevOps** | [handoffs/DEVOPS.md](handoffs/DEVOPS.md) | Railway «Twenty Credos Time» (Twenty 2.14), `yarn twenty` sync/install, ENV, schema-sync, мониторы, runbook | ✅ (infra-only) |
| **QA** | [handoffs/QA.md](handoffs/QA.md) | Vitest unit, `oxlint`, typecheck, smoke на dev-workspace, приёмка фич | ✅ (tests only) |
| **CISO** | [handoffs/CISO.md](handoffs/CISO.md) | Security governance, 152-ФЗ (PII сотрудников + трудозатраты), RBAC ролей приложения, ADR review, risk register | ✅ (docs/security only) |

## Совмещения (что куда ушло)

- **Дизайн / UX / page-layouts SSOT** → **Dev 1** (фронтендер ведёт и реализацию, и визуал; использует skill `impeccable`).
- **Доменная экспертиза / демо-данные / требования к учёту** → **Dev 2** (датник ближе всех к модели Директум5↔Kimai↔Timetta).
- **Продуктовая роль** — не заводим, пока нет реальных пользователей с feedback. Требования формулирует Dev 2.

## 1 subagent (вызывается из любого чата)

| Роль | Handoff | Как вызвать |
|---|---|---|
| **standards-auditor** | [handoffs/STANDARDS_AUDITOR.md](handoffs/STANDARDS_AUDITOR.md) | `Agent(subagent_type='standards-auditor', prompt='audit working tree \| files: ...')` |

Проверяет [docs/standards/DEV_STANDARDS.md](../docs/standards/DEV_STANDARDS.md) (нейминг `credosTime`, лимиты размера, SSOT, UUID-стабильность). Не пишет в SIGNALS — caller интерпретирует pass/fail.

## Как перезапустить команду в новой сессии

В новой Claude Code сессии для каждой роли запускается **отдельный агент**. Минимум в стартовом промте:

1. **Прочитай [apps/time/CLAUDE.md](../apps/time/CLAUDE.md)** + [README.md](../README.md) — правила проекта, SDK-доки, структура.
2. **Прочитай свой handoff** — `handoffs/{твоя-роль}.md`.
3. **Прочитай [INTERACTION.md](INTERACTION.md)** — как общаться через SIGNALS, префиксы, flow.
4. **Прочитай [SIGNALS.md](SIGNALS.md)** — живой канал: последние решения + открытые вопросы.
5. **Напиши `[received]`** в свою секцию SIGNALS.md (через arch, если нет права push).

После — работа по своему handoff scope.

## Файлы в этой папке

```
.AITEAM/
├── README.md          ← этот файл (обзор)
├── ROLES.md           ← таблица обязанностей (RACI)
├── INTERACTION.md     ← как команда общается (SIGNALS flow, префиксы)
├── SIGNALS.md         ← живой канал (LIFO, новые сверху)
└── handoffs/
    ├── ARCH.md            ← senior arch (review, ADR, коммит-gate, sdk-bump, docs)
    ├── DEV1.md            ← frontend + UX (компоненты, layouts SSOT, timesheet-grid, i18n)
    ├── DEV2.md            ← data/logic + домен (objects, fields, logic, UUID, модель, сид)
    ├── DEVOPS.md          ← Railway, app sync/install, schema-sync, мониторы
    ├── QA.md              ← vitest, oxlint, typecheck, smoke, приёмка
    ├── CISO.md            ← security governance, 152-ФЗ, RBAC, risk register
    └── STANDARDS_AUDITOR.md ← subagent: аудит DEV_STANDARDS
```

## Основные документы проекта

| Путь | Зачем |
|---|---|
| [../README.md](../README.md) | Навигация: research → docs → apps |
| [../apps/time/CLAUDE.md](../apps/time/CLAUDE.md) | SDK-правила, `dev:add`, common pitfalls (обязательно всем) |
| [../docs/standards/DEV_STANDARDS.md](../docs/standards/DEV_STANDARDS.md) | Стандарты модуля time (нейминг `credosTime`, лимиты, SSOT) |
| [../docs/adr/](../docs/adr/) | Архитектурные решения 0001–0004 |
| [../docs/data-model/DATA_MODEL_SYNTHESIS.md](../docs/data-model/DATA_MODEL_SYNTHESIS.md) | Главный: единая модель Директум5↔Kimai↔Timetta |
| [../docs/devops/PLAYBOOK.md](../docs/devops/PLAYBOOK.md) | Регламент: env, dev-loop, накат, прозвон |
| [../docs/devops/DEV_SERVER.md](../docs/devops/DEV_SERVER.md) | Railway dev-сервер Twenty 2.14 |

## Среда

- **Платформа:** Twenty 2.14 на Railway-проекте «Twenty Credos Time» (НЕ прод CRM): `https://twenty-production-e5c5.up.railway.app`
- **App:** `time-credos` v0.1.0 (`apps/time/`), SDK `twenty-sdk@2.14.0`, React 19, yarn 4
- **Доступ:** Railway CLI токен в корневом `.env` (gitignored)
- Среда — **dev/staging, не prod**. Активных пользователей нет — можно ломать и экспериментировать.
</content>
