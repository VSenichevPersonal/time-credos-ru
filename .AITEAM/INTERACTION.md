# AI Team — Взаимодействие

Как команда общается, эскалирует, коммитит.

**Живой канал:** [SIGNALS.md](SIGNALS.md).

## 1. Базовые принципы

1. **Файл-канал.** Вся коммуникация между ролями — через **SIGNALS.md**. Всё асинхронно.
2. **Push-дисциплина.** Dev'ы код не пушат сами. **arch** собирает коммиты и пушит. DevOps — только infra-only. QA — только тесты. CISO/Domain Analyst/Design пушат только свои зоны (см. [ROLES.md](ROLES.md)).
3. **Одна секция на роль** в SIGNALS.md:
   - `## Dev 1 → arch` (Front), `## Dev 2 → arch` (Data)
   - `## DevOps → arch`, `## QA → arch`
   - `## Domain Analyst → arch`, `## CISO → arch`, `## Design → arch`
   - `## Product → arch` (когда активируется)
   - `## → arch feedback` — **arch** отвечает всем.
4. **Коммит-префикс = сигнал.** См. таблицу ниже.
5. **Conventional commits (как в реальном git проекта):** `feat(time):`, `fix(time):`, `refactor(time):`, `chore(time):`, `docs(time):`, `docs(devops):`, `docs(research):`, `feat(catalog):`, `chore(time): bump twenty-sdk vX.Y.Z`.
6. **Разрешение спорных архитектурных решений** — только через новый ADR в `docs/adr/NNNN-*.md`.

## 2. Префиксы сигналов

Используются в коммит-сообщениях **и** в SIGNALS.md:

| Префикс | Смысл | Кто ставит | Приоритет |
|---|---|---|---|
| `[signal-arch]` | Архитектурный вопрос / запрос review | Dev 1/2, DevOps, QA, Design | нормальный |
| `[blocker]` | Блокер — не могу продолжать без arch | Любой | высокий |
| `[arch-ok]` | arch одобрил подход / план | arch | — |
| `[arch-nak]` | arch отклонил / требует переделку | arch | — |
| `[received]` | агент подтвердил получение (handoff / arch-ok) | все | — |
| `[deployed]` | приложение синхронизировано/установлено в workspace + commit hash | DevOps / arch | — |
| `[synced]` | `yarn twenty` app sync прошёл на dev-сервере | DevOps | — |
| `[sdk-bumped]` | поднята версия twenty-sdk + ссылка на release Twenty | arch | — |
| `[infra-ok]` / `[infra-nak]` | инфра-статус (Railway / env) | DevOps | — |
| `[bug]` | новый баг, нужен triage arch → Dev | QA / Domain / CISO | нормальный |
| `[flaky]` | нестабильный тест | QA | низкий |
| `[qa-ok]` / `[qa-nak]` | приёмка фичи/модуля пройдена/не пройдена | QA | — |
| `[smoke-ok]` / `[smoke-nak]` | smoke на dev-workspace после sync | QA | — |
| `[report]` | отчёт о закрытом модуле / dev-report | Dev 1/2 / arch | — |
| `[observed]` | наблюдение без действия (для контекста) | любой | — |
| `[signal-test]` | ping канала | arch | — |
| `[dom-ok]` / `[dom-nak]` | приёмка фичи с доменной/Кредо-С перспективы | Domain Analyst | — |
| `requirement` (внутри `[signal-arch]`) | новое требование к учёту трудозатрат | Domain Analyst | — |
| `[ciso-finding] <P0-P3>` | security finding (P0 = freeze) | CISO | P0=блокер |
| `[ciso-review ADR-NNNN approve\|concern\|block]` | ревью ADR на security-риски | CISO | `block` = arch stops |
| `[ciso-policy]` | новая/обновлённая security policy | CISO | — |
| `[design-proposal]` | предложение изменения UI (page-layout / виджет / токен) | Design | нормальный |
| `[design-ok]` / `[design-nak]` | приёмка UI-волны с точки зрения DS | Design | — |

Правило: **один коммит = один префикс**. Не `[signal-arch][bug][flaky]` в одной строке.

## 3. Типовые flows

### 3.1 Dev 1/2 пишет код → ревью → push → sync

```
Dev делает изменения локально (apps/time/src/, не пушит)
  ↓ (рекоменд.) Agent(standards-auditor) перед сигналом
Dev пишет [signal-arch] <план|сделано> в свою секцию SIGNALS
  ↓
arch читает SIGNALS → review кода/плана
  ↓
arch пишет [arch-ok] или [arch-nak] в feedback-секцию
  ↓
[arch-ok] → arch собирает батч + push в main
[arch-nak] → Dev исправляет, цикл повторяется
  ↓
DevOps: yarn twenty app sync → workspace → [synced]/[deployed] <hash>
```

### 3.2 Блокер

```
Dev натыкается на зависимость / конфликт / ограничение SDK
  ↓
Dev пишет [blocker] <описание> + repro в свою секцию
  ↓
arch приоритезирует → либо фикс (код), либо решение (направление)
  ↓
arch пишет в feedback [arch-ok]/[arch-nak] с планом разблокировки
  ↓
Dev продолжает
```

### 3.3 Баг-репорт (QA)

```
QA находит регрессию при vitest / smoke на workspace
  ↓
QA пишет [bug] #N в ## QA → arch:
  - Repro (3-5 шагов), Ожидалось / Фактически
  - Файл: path:line, Severity (P0/P1/P2)
  - Assign-хинт (Dev 1 / Dev 2 / DevOps)
  ↓
arch triage → [arch-ok] triage + assign в feedback
  ↓
Assigned dev фиксит → [signal-arch] fixed → arch батч → push → DevOps sync
  ↓
QA регрессит → [qa-ok]
```

### 3.4 Изменение схемы (object/field) → sync

```
Dev 2 меняет/создаёт object через `yarn twenty dev:add object`
  ↓
Dev 2 добавляет UUID-константу в universal-identifiers.ts (стабильную!)
  ↓
Dev 2 [signal-arch] "новый object credosTime<X> + поля готовы к sync"
  ↓
arch review (нейминг credosTime, UUID-стабильность) → [arch-ok]
  ↓
DevOps: yarn twenty app sync → проверить что схема накатилась без потери данных
  ↓
DevOps [synced] <name> <hash>
  ↓
QA: smoke по затронутым объектам → [qa-ok]
```

### 3.5 Bump twenty-sdk (специфика SDK-app)

```
DevOps: на dev-сервере Twenty обновился до vX.Z
  ↓
arch смотрит release notes Twenty между текущим (2.14) и target
  ↓
arch [signal-arch] sdk-bump план: что breaking в SDK
  ↓
arch: правит apps/time/package.json (twenty-sdk + twenty-client-sdk)
  ↓
arch: yarn install; yarn lint; yarn test локально
  ↓
arch [sdk-bumped] vX.Z + push + запись в docs/devops/
  ↓
DevOps: app sync на dev-server → QA: полный smoke на workspace
```

### 3.6 Новое доменное требование (Domain Analyst)

```
Domain Analyst [signal-arch] requirement: напр. «недельная сетка как в Timetta»
  ↓ (ссылка на research/ + docs/data-model/)
arch [arch-ok] подход + назначение Dev 1/Dev 2
  ↓
Dev реализует → arch батч → push → DevOps sync → Domain Analyst [dom-ok] приёмка
```

## 4. Матрица обязанностей (RACI короткая)

| Задача | arch | Dev 1 | Dev 2 | DevOps | QA | Dom | CISO | Design |
|---|---|---|---|---|---|---|---|---|
| ADR (архитектура) | **R**/A | C | C | C | C | C | **C** (security) | C |
| Bump twenty-sdk | **R**/A | C | C | C | C | — | — | — |
| `credosTime`-префикс аудит | **R**/A | C | **R** | — | — | — | — | — |
| UUID-стабильность | **R**/A | — | **R** | C | — | — | — | — |
| dev-reports | **R**/A | **R** (свой scope) | **R** (свой scope) | **R** (свой scope) | **R** (свой scope) | C | **R** (свой scope) | **R** (свой scope) |
| Security policy + 152-ФЗ | A | — | C | C | C | C | **R** | — |
| Risk register | A | — | — | — | — | — | **R** | — |
| RBAC ролей приложения | A | C | **R** | C | C | C (req) | **C** | — |
| Objects / fields | A | C | **R** | C (sync) | C | C (req) | — | — |
| Logic functions | A | — | **R** | — | C | — | — | — |
| Front-components / views | A | **R** | — | — | C | C | C (DS) | **C** |
| Page-layouts (SSOT, токены) | A | C | — | — | — | — | — | **R** |
| Navigation menu / i18n | A | **R** | C | — | — | C | — | C |
| Модель данных (синтез) | A | C | **R** | — | — | **R** (домен) | — | — |
| Демо-данные (seed) | A | C | C | — | — | **R** | C (PII) | — |
| App sync / install | A | C | C | **R** | C | — | — | — |
| ENV + secrets (Railway) | A | — | — | **R** | — | — | C (policy) | — |
| Tests (vitest) | A | C | C | — | **R** | — | — | C (DS) |
| Smoke на workspace | A | — | — | C | **R** | C | — | — |
| Lint / typecheck | A | C | C | — | **R** | — | — | — |
| Приёмка UX (домен) | A | C | C | — | C | **R** | — | C |
| Build/lint red on main | **R**/A | C | C | C | C | — | — | — |
| Push main | **R** | — | — | infra-only | tests-only | docs-only | docs-only | DS-only |

`R` — Responsible, `A` — Accountable, `C` — Consulted.

## 5. Правила push'а

1. **Arch собирает и пушит.** Dev 1/2 только редактируют файлы локально.
2. **DevOps** пушит infra-only: `apps/time/package.json` (sdk-version), `.env.example`, `docs/devops/**`, `infra/**`, `apps/time/scripts/*`.
3. **QA** пушит тесты: `**/*.test.ts`, `apps/time/vitest.config.ts`, `.oxlintrc.json`. Префикс `test(time): ...`.
4. **CISO** пушит `docs/security/**` и `docs/**/CISO_*.md`. Префикс `docs(security): ...`.
5. **Domain Analyst** пушит `docs/data-model/**`, `research/**`, сид-фикстуры. Префикс `docs(data-model): ...` / `chore(seeds): ...`.
6. **Design** пушит `apps/time/src/{page-layouts,front-components}/**`, `docs/design/**`. Префикс `feat(time): ...` (UI) или `style(time): ...`.
7. **Arch code** пушит всё остальное: `feat(time): ...`, `fix(time): ...`, `docs(time): ...`, `chore(time): bump twenty-sdk vX.Y.Z`.
8. **Co-Authored-By:** обязательно `Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
9. **Перед push:** `yarn lint` + `npx tsc --noEmit` (или `yarn twenty` type-check) + `yarn test` локально должны пройти. Упало — фиксить до чистого.
10. **Никогда не push'ить:** `.env`, `node_modules`, креды, Railway-токены, `dist/`, `*.tsbuildinfo`.
11. **Целевая ветка:** работаем в `main`. (Remote default — `master`; PR/merge политика — на усмотрение arch.)

## 6. Мониторы (у arch + DevOps)

- **Railway статус** — состояние сервисов проекта «Twenty Credos Time» (Twenty, Worker, Postgres).
- **SIGNALS.md** — чтение последних записей перед каждым действием.
- **Health dev** — `GET https://twenty-production-e5c5.up.railway.app` (healthz/up) периодически.
- **App sync статус** — после каждого `yarn twenty` sync: объекты/поля/layouts накатились?

Детали — [docs/devops/PLAYBOOK.md](../docs/devops/PLAYBOOK.md).

## 7. Эскалация

| Ситуация | Действие |
|---|---|
| Dev 1 vs Dev 2 конфликт схемы / типов | `[signal-arch]` → arch мержит вручную |
| Попытка тронуть платформу CRM / красную зону | `[blocker]` немедленно → arch P0, ищем способ через SDK |
| Изменение опубликованного UUID | `[blocker]` → arch: это миграция данных, отдельный план |
| Коллизия `credosTime`-нейминга с CRM/catalog | `[blocker]` → переименовать до sync |
| Railway/dev-сервер down | DevOps `[blocker]` → arch разруливает доступы |
| Несогласие arch ↔ dev по архитектуре | `[signal-arch] ADR request` → arch пишет `docs/adr/NNNN-*.md` |
| Breaking change в twenty-sdk при bump | arch фиксит, обязательно `yarn test` на затронутое |

## 8. Повторная сессия Claude Code

Чек-лист для нового AI-агента в роли:

1. `git pull origin main`
2. Читаешь [apps/time/CLAUDE.md](../apps/time/CLAUDE.md) + свой handoff + [INTERACTION.md](INTERACTION.md) + [SIGNALS.md](SIGNALS.md).
3. Смотришь последние `docs/**/dev-reports` / ADR — что закрыто.
4. Идёшь в свою секцию SIGNALS — что на тебе висит.
5. Смотришь `## → arch feedback` — последние `[arch-ok]`/`[arch-nak]` для тебя.
6. Пишешь `[received]` в свою секцию с планом на день.
7. Работаешь.

## 9. Что НЕ делать

- ❌ Не обсуждать в коммит-сообщении то, что должно быть в SIGNALS. Сообщение коммита — короткое.
- ❌ Не пушить без `[arch-ok]` (Dev 1/2) или без чистого lint/typecheck (все).
- ❌ Не коммитить секреты (`.env`, Railway-токены).
- ❌ Не трогать файлы другой роли без `[signal-arch]` запроса.
- ❌ Не использовать `console.*` в продакшн-логике — следовать паттернам SDK/Twenty.
- ❌ Не менять опубликованные `universalIdentifier` UUID (= потеря данных).
- ❌ Не создавать объекты/поля без префикса `credosTime` (коллизии в общем workspace).
- ❌ Не патчить ядро Twenty / репо CredosCRM1 — мы SDK-app.
- ❌ Не делать `git reset --hard` / `git push --force` без согласования с arch.
- ❌ Не писать документацию на английском (только код на английском).
- ❌ Не создавать object без index-view, view без navigationMenuItem (см. CLAUDE.md pitfalls).

## 10. Связанные файлы

- [../apps/time/CLAUDE.md](../apps/time/CLAUDE.md) — SDK-правила, `dev:add`, pitfalls.
- [../docs/standards/DEV_STANDARDS.md](../docs/standards/DEV_STANDARDS.md) — стандарты, нейминг `credosTime`.
- [../docs/adr/](../docs/adr/) — архитектурные решения.
- [../docs/devops/PLAYBOOK.md](../docs/devops/PLAYBOOK.md) — регламент dev-loop.
- [SIGNALS.md](SIGNALS.md) — живой канал.
- [ROLES.md](ROLES.md) — таблица состава.
- [handoffs/](handoffs/) — роль-промпты.
</content>
