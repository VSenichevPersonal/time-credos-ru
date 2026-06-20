# AI Team — Состав ролей

Актуальное состояние работы команды — в [SIGNALS.md](SIGNALS.md).

## 8 активных ролей

| Роль | Handoff | Scope | Push-право | Сигнал-префиксы |
|---|---|---|---|---|
| **arch** | [handoffs/ARCH.md](handoffs/ARCH.md) | Архитектура, review, ADR, коммит-gate, push main, bump twenty-sdk, актуализация документации | ✅ всё | `[arch-ok]` `[arch-nak]` `[deployed]` `[arch]` `[sdk-bumped]` `[signal-test]` |
| **Dev 1** (Front) | [handoffs/DEV1.md](handoffs/DEV1.md) | `apps/time/src/{front-components,views,page-layouts,navigation-menu-items}/`, i18n, timesheet-сетка | ❌ (через arch) | `[signal-arch]` `[blocker]` `[received]` `[report]` |
| **Dev 2** (Data) | [handoffs/DEV2.md](handoffs/DEV2.md) | `apps/time/src/{objects,fields,logic-functions,roles,constants}/`, модель данных, сид, UUID-SSOT | ❌ (через arch) | `[signal-arch]` `[blocker]` `[received]` `[report]` `[observed]` |
| **DevOps** | [handoffs/DEVOPS.md](handoffs/DEVOPS.md) | Railway Twenty 2.14, `yarn twenty` sync/install, ENV, schema-sync, мониторы, runbook | ✅ infra-only | `[infra-ok]` `[infra-nak]` `[deployed]` `[synced]` `[blocker]` |
| **QA** | [handoffs/QA.md](handoffs/QA.md) | Vitest, `oxlint`, typecheck, smoke на dev-workspace | ✅ tests-only | `[qa-ok]` `[qa-nak]` `[bug]` `[flaky]` `[smoke-ok]` `[smoke-nak]` `[signal-arch]` |
| **Domain Analyst** | [handoffs/DOMAIN_ANALYST.md](handoffs/DOMAIN_ANALYST.md) | Требования к учёту трудозатрат, реальные демо-данные (Директум5), приёмка UX, сид-фикстуры | ✅ docs/research only | `[dom-ok]` `[dom-nak]` `[signal-arch] requirement` `[bug]` `[observed]` |
| **CISO** | [handoffs/CISO.md](handoffs/CISO.md) | Security governance, 152-ФЗ (PII), RBAC ролей app, ADR review, risk register | ✅ docs/security only | `[ciso-finding] <P0-P3>` `[ciso-review ADR-NNNN approve\|concern\|block]` `[ciso-policy]` `[signal-arch]` `[received]` |
| **Design** | [handoffs/DESIGN.md](handoffs/DESIGN.md) | Twenty UI: page-layouts SSOT, front-components, timesheet-grid, бренд Кредо-С, темы | ✅ DS/UI only | `[design-proposal]` `[design-ok]` `[design-nak]` `[signal-arch]` `[received]` `[observed]` `[report]` |

## 1 subagent (вызывается из любого чата)

| Роль | Handoff | Тип | Как вызвать |
|---|---|---|---|
| **standards-auditor** | [handoffs/STANDARDS_AUDITOR.md](handoffs/STANDARDS_AUDITOR.md) | Subagent (`.claude/agents/standards-auditor.md`) | `Agent(subagent_type='standards-auditor', prompt='audit working tree \| files: ...')` |

Standards-auditor **не открывает отдельный чат** — работает в изолированном sub-context'е, возвращает краткий pass/fail отчёт caller'у. Вызывают **arch / Dev 1 / Dev 2 / DevOps / QA** перед commit'ом / push'ом / периодически (~30 мин активной сессии). Не пишет в SIGNALS.

## 1 роль stub (активация позже)

| Роль | Handoff | Когда активировать |
|---|---|---|
| **Product** | [handoffs/PRODUCT.md](handoffs/PRODUCT.md) | Когда у Кредо-С 2+ реальных пользователей с feedback |

## Push-право — подробно

| Кто | Может пушить |
|---|---|
| arch | Всё |
| DevOps | `apps/time/package.json` (sdk-version), `.env.example`, `docs/devops/**`, `infra/**`, скрипты `apps/time/scripts/*`, своя секция SIGNALS |
| QA | `apps/time/src/**/__tests__/**`, `**/*.test.ts`, `apps/time/vitest.config.ts`, `.oxlintrc.json`, `docs/**/QA_*.md`, своя секция SIGNALS |
| Domain Analyst | `docs/data-model/**`, `research/**`, сид-фикстуры `apps/time/src/**/*seed*` / `*-real-*`, своя секция SIGNALS |
| CISO | `docs/security/**`, `docs/**/CISO_*.md`, своя секция SIGNALS |
| Design | `apps/time/src/{page-layouts,front-components}/**`, стили, `docs/design/**` + `docs/data-model/TIMESHEET_UX_SPEC.md`, своя секция SIGNALS |
| Dev 1 / Dev 2 | Только своя секция SIGNALS.md |
| Product | (не активирован) |

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

1. **Bump twenty-sdk** — при выходе новой версии Twenty на dev-сервере: поднять `twenty-sdk` / `twenty-client-sdk` в `apps/time/package.json` (сейчас `2.14.0`), проверить breaking changes SDK. Префикс коммита: `chore(time): bump twenty-sdk vX.Y.Z`.
2. **Аудит `credosTime`-префиксов** — все объекты/поля должны иметь префикс `credosTime` (ADR-0004), чтобы не было коллизий с платформой CRM и приложением catalog в **общем workspace**. Проверка: `grep -rn "nameSingular" apps/time/src/objects/`.
3. **UUID-стабильность** — `universalIdentifier` в `apps/time/src/constants/universal-identifiers.ts` после установки приложения **менять нельзя** (= потеря данных). Рефактор нейминга UUID не трогает.
4. **Зоны безопасности:**
   - 🟢 Зелёная (свободно): `apps/time/src/`, `docs/`, `research/`
   - 🟡 Жёлтая (документировать/sync): `apps/time/package.json` (версия SDK), `apps/time/src/objects|fields/**` (изменение схемы → нужен `app sync` + возможна миграция данных), application config
   - 🔴 Красная (НЕ ТРОГАТЬ): репо платформы **CredosCRM1** (чужой, не в этом репо); опубликованные `universalIdentifier` UUID; общие мастер-данные Department/Employee/Service (делятся с app catalog — ADR-0003)

## Тайминг

Команда работает асинхронно через SIGNALS. Среднее SLA arch на `[signal-arch]` — 15 мин в рабочий день, до 4 ч в нерабочее.

Dev-loop: правка кода → `yarn twenty` sync в workspace ~1-2 мин → проверка в UI → `[synced]` / `[deployed]` в SIGNALS. Детали — [docs/devops/PLAYBOOK.md](../docs/devops/PLAYBOOK.md).
</content>
