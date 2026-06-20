# AI Team — Состав ролей

Актуальное состояние работы команды — в [SIGNALS.md](SIGNALS.md).

## 6 активных ролей (совмещают функции)

| Роль | Handoff | Scope | Push-право | Сигнал-префиксы |
|---|---|---|---|---|
| **arch** | [handoffs/ARCH.md](handoffs/ARCH.md) | Архитектура, review, ADR, коммит-gate, push main, bump twenty-sdk, актуализация документации | ✅ всё | `[arch-ok]` `[arch-nak]` `[deployed]` `[arch]` `[sdk-bumped]` `[signal-test]` |
| **Dev 1** (Front + UX) | [handoffs/DEV1.md](handoffs/DEV1.md) | `apps/time/src/{front-components,views,page-layouts,navigation-menu-items}/`, page-layouts SSOT, timesheet-grid, i18n, бренд | ❌ (через arch) | `[signal-arch]` `[blocker]` `[received]` `[report]` `[design-proposal]` |
| **Dev 2** (Data + Domain) | [handoffs/DEV2.md](handoffs/DEV2.md) | `apps/time/src/{objects,fields,logic-functions,roles,constants}/`, модель данных, домен Кредо-С, демо-данные/сид, UUID-SSOT, требования | ❌ (через arch) | `[signal-arch]` `[blocker]` `[received]` `[report]` `[observed]` `[requirement]` |
| **DevOps** | [handoffs/DEVOPS.md](handoffs/DEVOPS.md) | Railway Twenty 2.14, `yarn twenty` sync/install, ENV, schema-sync, мониторы, runbook | ✅ infra-only | `[infra-ok]` `[infra-nak]` `[deployed]` `[synced]` `[blocker]` |
| **QA** | [handoffs/QA.md](handoffs/QA.md) | Vitest, `oxlint`, typecheck, smoke на dev-workspace, приёмка фич | ✅ tests-only | `[qa-ok]` `[qa-nak]` `[bug]` `[flaky]` `[smoke-ok]` `[smoke-nak]` `[signal-arch]` |
| **CISO** | [handoffs/CISO.md](handoffs/CISO.md) | Security governance, 152-ФЗ (PII), RBAC ролей app, ADR review, risk register | ✅ docs/security only | `[ciso-finding] <P0-P3>` `[ciso-review ADR-NNNN approve\|concern\|block]` `[ciso-policy]` `[signal-arch]` `[received]` |

## Совмещения

- **Design / UX / page-layouts SSOT / timesheet-grid** → внутри **Dev 1** (использует skill `impeccable` для UI-работы).
- **Доменная экспертиза / демо-данные / требования к учёту** → внутри **Dev 2** (ближе к модели данных).
- **Product** — не заводим до появления реальных пользователей с feedback.

## 1 subagent (вызывается из любого чата)

| Роль | Handoff | Тип | Как вызвать |
|---|---|---|---|
| **standards-auditor** | [handoffs/STANDARDS_AUDITOR.md](handoffs/STANDARDS_AUDITOR.md) | Subagent (`.claude/agents/standards-auditor.md`) | `Agent(subagent_type='standards-auditor', prompt='audit working tree \| files: ...')` |

Работает в изолированном sub-context'е, возвращает pass/fail caller'у. Вызывают arch / Dev 1 / Dev 2 / QA перед commit'ом / push'ом. Не пишет в SIGNALS.

## Push-право — подробно

| Кто | Может пушить |
|---|---|
| arch | Всё |
| DevOps | `apps/time/package.json` (sdk-version), `.env.example`, `docs/devops/**`, `infra/**`, `apps/time/scripts/*`, своя секция SIGNALS |
| QA | `apps/time/src/**/__tests__/**`, `**/*.test.ts`, `apps/time/vitest.config.ts`, `.oxlintrc.json`, `docs/**/QA_*.md`, своя секция SIGNALS |
| CISO | `docs/security/**`, `docs/**/CISO_*.md`, своя секция SIGNALS |
| Dev 1 / Dev 2 | Только своя секция SIGNALS.md |

## Иерархия эскалации

```
[blocker] от любой роли
  ↓
arch — приоритет P0 / P1
  ↓
(если арх-уровень решения) ADR → docs/adr/NNNN-*.md
  ↓
обновление handoff'ов если scope меняется
  ↓
применение решения → push → Railway → app sync → QA smoke → [qa-ok]
```

## Особенности SDK-app (не форк!)

Команда строит **приложение поверх** Twenty, ядро не патчит. Поэтому **arch** дополнительно отвечает за:

1. **Bump twenty-sdk** — при выходе новой версии Twenty на dev-сервере: поднять `twenty-sdk` / `twenty-client-sdk` в `apps/time/package.json` (сейчас `2.14.0`), проверить breaking changes. Коммит: `chore(time): bump twenty-sdk vX.Y.Z`.
2. **Аудит `credosTime`-префиксов** — все объекты/поля с префиксом `credosTime` (ADR-0004), без коллизий с платформой CRM и app catalog в **общем workspace**. Проверка: `grep -rn "nameSingular" apps/time/src/objects/`.
3. **UUID-стабильность** — `universalIdentifier` в `apps/time/src/constants/universal-identifiers.ts` после установки **менять нельзя** (= потеря данных). Рефактор нейминга UUID не трогает.
4. **Зоны безопасности:**
   - 🟢 Зелёная (свободно): `apps/time/src/`, `docs/`, `research/`
   - 🟡 Жёлтая (документировать/sync): `apps/time/package.json` (версия SDK), `apps/time/src/objects|fields/**` (изменение схемы → нужен `app sync` + возможна миграция данных), application config
   - 🔴 Красная (НЕ ТРОГАТЬ): репо платформы **CredosCRM1** (чужой, не в этом репо); опубликованные `universalIdentifier` UUID; общие мастер-данные Department/Employee/Service (делятся с app catalog — ADR-0003)

## Тайминг

Асинхронно через SIGNALS. SLA arch на `[signal-arch]` — 15 мин в рабочий день, до 4 ч в нерабочее.

Dev-loop: правка кода → `yarn twenty` sync ~1-2 мин → проверка в UI → `[synced]`/`[deployed]`. Детали — [docs/devops/PLAYBOOK.md](../docs/devops/PLAYBOOK.md).
</content>
