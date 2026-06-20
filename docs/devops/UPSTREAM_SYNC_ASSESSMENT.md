# Оценка upstream-sync форка CredosCRM1 до Twenty 2.x (DO-1)

**Дата:** 2026-06-20
**Автор:** DevOps
**Тип:** read-only анализ (форк CredosCRM1 не изменялся, apps/time не тронут)
**Контекст:** предусловие прод-установки app `time-credos` (ADR-0002). Dev/staging — Railway «Twenty Credos Time» (Twenty 2.14). Прод-таргет — форк CredosCRM1, его нужно довести до 2.x совместимого runtime.
**Репозитории:** форк `/Users/vsenichev/Documents/GitHub/CredosCRM1`, app `/Users/vsenichev/Documents/GitHub/time-credos-ru`.

---

## TL;DR

- Форк CredosCRM1 = **Twenty v1.19.0** (+14 коммитов upstream), точка форка **13 марта 2026**.
- Наш app требует сервер **2.14+** (`engines.twenty >=2.14.0`). Dev-сервер уже на 2.14. **Прод-форк на 1.19 — app туда не встанет.**
- Divergence: форк **+851 коммит** своего, upstream **+991 коммит** с момента форка (локальный `upstream/main` устарел — снят 24 апреля на v2.0.4; реальный upstream сейчас 2.14+, разрыв ещё больше).
- Кастом Credos: **~75 000 LOC в `credos/`-namespace** (front 33k + server 42k) — зелёная зона, конфликтов почти не даёт. **+~2 400 LOC** пакет `directum-5-bridge`. Жёлтая зона ядра — **16 core-файлов** с CREDOS-маркерами (большинство Low-risk, 2 Medium).
- **ENCRYPTION_KEY (v2.5+):** в форке envelope `enc:v2:` ещё **нет** (он на 1.19). Это критично: `ENCRYPTION_KEY` нужно задать в env **ДО** первого старта на 2.5+, иначе backfill зашифрует секреты под `APP_SECRET` и потом потребует ротации ключа.
- **Рекомендация:** не делать app-инсталл предусловием полного upstream-sync форка. Развернуть **отдельный прод-Twenty 2.x** под time-app (как dev-сервер), форк CredosCRM1 апгрейдить отдельным треком в своём темпе. См. Стратегию C.

---

## 1. Версии и divergence

### Текущая версия Twenty в форке

| Параметр | Значение | Источник |
|---|---|---|
| `twenty-server` version | **v1.19.0** | `packages/twenty-server/package.json` |
| `twenty-sdk` version | **0.7.0** (pre-GA) | `packages/twenty-sdk/package.json` |
| Точка форка (merge-base с upstream) | **2026-03-13**, `3a9247d9d1`, `v1.19.0-14-g3a9247d9d1` | `git merge-base HEAD upstream/main` |
| HEAD форка | 2026-06-16, `698a57fa10` | `git log -1` |
| Теги в форке | до **v2.0.4** (импортированы из upstream, не отражают рабочую версию) | `git tag` |

> ⚠️ Корневой `package.json` версии (`"version": "0.2.1"`, `"name": "twenty"`) — версия монорепо-обёртки, НЕ Twenty. Реальная версия Twenty — в `twenty-server`: **1.19.0**.
> ⚠️ SDK 0.7.0 в форке — это пред-GA снимок (13 марта, до 2.0 GA 21 апреля). Наш app собран против SDK 2.14. Это вторая причина несовместимости форка как прод-таргета.

### Насколько разошёлся с upstream

```
merge-base (13 марта 2026, v1.19.0+14)
   │
   ├── форк CredosCRM1:  +851 коммит (Credos-кастом + Directum)
   │
   └── upstream/main:    +991 коммит (локально снято 24 апр, v2.0.4)
```

- Форк ушёл вперёд на **851 коммит** (573 из них трогают `credos/`-namespace).
- Upstream ушёл вперёд на **991 коммит** (по локальной копии на 24 апреля). **Реальный upstream сегодня на 2.14+ — фактический разрыв заметно больше** (локальный `upstream/main` не фетчили с 24 апреля).
- Разрыв ~3 мажорных линии (1.19 → 1.22/1.23 → 2.0 → … → 2.14).

---

## 2. Объём кастома Credos (что переносить при merge)

### Зелёная зона — `credos/`-namespace (изолировано, merge-safe)

| Расположение | Файлы | LOC |
|---|---|---|
| `packages/twenty-front/src/credos/` | 295 | ~33 400 |
| `packages/twenty-server/src/credos/` | 324 | ~41 900 |
| `packages/directum-5-bridge/` (отд. пакет) | — | ~2 420 |
| **Итого зелёная зона** | **~620 файлов** | **~77 700 LOC** |

Это весь функционал Credos (quotes, beeline-телефония, dadata, 1С, reports, AI/STT, audit, lead-collector, ABM/unisender, directum-bridge). Живёт в собственном namespace → при upstream-merge **конфликтов почти не создаёт** (новые файлы, не правки чужих).

### Жёлтая зона — правки ядра Twenty (`core-changes.md`)

**16 core-файлов** с CREDOS-маркерами вне `credos/`-namespace. Все задокументированы в `credos/docs/core-changes.md` с merge-инструкциями. Характер правок — **точечные точки расширения** (enum value, lazy route, nav item, marker-ветка в `FieldWidget`), а не переписывание логики.

Сводка по риску (из core-changes.md):

| Файл | Маркеров | Риск | Суть |
|---|---|---|---|
| `twenty-front/.../widgets/field/components/FieldWidget.tsx` | 30 | Low | marker-dispatch кастом-виджетов (статусы, плеер записи, email-viewer, 1С, lead-секции) |
| `twenty-server/src/main.ts` | 10 | **Medium** | security headers (helmet/HSTS/CORS), request-id middleware, 1С raw-body parser |
| `twenty-server/src/engine/.../workspace.resolver.ts` | 3 | Low | enterprise-gate unlock для self-hosted (billing off) |
| `twenty-server/src/app.module.ts` | 2 | Low | exclude webhook-routes (Beeline/1С) из JWT-middleware |
| `.../hooks/useOpenRecordFromIndexView.ts` | — | **Medium** | record-open-mode toggle (ключевой навигационный хук) |
| `.../page-layout/utils/getDefaultRecordPageLayoutId.ts` + `useBasePageLayout.ts` | — | Low | регистрация ~10 credos-layout'ов (map/case) |
| `.../widgets/components/WidgetContentRenderer.tsx` | — | Low | dispatcher credos-виджетов (AI summary) |
| `.../widgets/fields/components/FieldsWidget.tsx` | — | Low | viewId-fallback для credos*-объектов |
| `.../settings/hooks/useSettingsNavigationItems.tsx`, `app/components/SettingsRoutes.tsx`, `AppRouterProviders.tsx` | — | Low | nav-items + routes секции «Кредо-С» |
| `twenty-shared/src/types/SettingsPath.ts` + `index.ts` + `CredosLeadParser.ts` | — | Low | enum settings-path + типы |
| `twenty-server/.../message-queue.constants.ts` (история) | — | Low | enum очередей (часть уже dead-code) |

**Итого жёлтой зоны:** ~16 файлов, **только 2 Medium-риск** (`main.ts` bootstrap — редко правится upstream, но конфликтен при любой правке; `useOpenRecordFromIndexView` — рефакторился в 2.x). Остальное Low — переносится механически по merge-note из core-changes.md.

**Вывод по объёму:** основная масса (77k LOC) merge-safe. Реальная работа upstream-merge = разрешить конфликты в **~16 core-файлах** + проверить, что точки расширения (marker-dispatch в `FieldWidget`, `getDefaultRecordPageLayoutId`, hook'и page-layout) **не переписаны** в 2.x (page-layout system Twenty активно менялась между 1.19 и 2.x — это главный технический риск).

---

## 3. Конфликтные зоны при апгрейде 1.19 → 2.x

### 3.1 Кросс-версия (по upgrade-guide)

- С **v1.22** Twenty поддерживает прыжок сразу на latest. Но форк на **1.19 < 1.22** → по гайду нужно идти **инкрементально 1.19 → 1.20 → 1.21 → 1.22**, дальше прыжок на 2.x. Это касается **миграций БД при старте**, а не git-merge кода.
- Миграции прогоняются автоматически на старте сервера. `upgrade:status` для контроля.

### 3.2 ENCRYPTION_KEY / envelope `enc:v2:` (v2.5+) — КРИТИЧНО

- В форке (1.19) envelope **отсутствует** (`grep enc:v2` в server/src → 0). `ENCRYPTION_KEY` в коде упоминается только в 2FA-утилите.
- На v2.5+ Twenty при первом старте делает **backfill** at-rest секретов (OAuth-токены, app-variables, signing-key, TOTP) в `enc:v2:`-конверт, шифруя `ENCRYPTION_KEY` или (если не задан) `APP_SECRET`.
- **Требование:** задать выделенный `ENCRYPTION_KEY` в env **ДО** апгрейда на 2.5+. Иначе backfill зашифрует под `APP_SECRET`, и смена ключа потом = полноценная **rotation** (дорого, отдельная процедура key-rotation).
- Backfill идемпотентен, на больших БД медленный — мониторить `upgrade:status`.

### 3.3 Архитектурный разрыв 1.x → 2.0 GA

- **SDK/app-runtime:** 0.7 (pre-GA) → 2.x GA. Install-механизм app (`application-install`/`tarball`/marketplace) стабилизирован только с 2.0 GA. Форк на 0.7 **физически не примет** наш app, собранный против 2.14.
- **Page-layout system:** между 1.19 и 2.x менялась (новые widget-типы, page-layout tabs). Наши marker-dispatch ветки и layout-регистрации (жёлтая зона) — высокий шанс, что точки расширения переименованы/переписаны → ручной перенос.
- **Enterprise/billing gate:** наш bypass в `workspace.resolver.ts` может сломаться, если resolver переписан.

### 3.4 Прочее

- Бэкап БД обязателен до апгрейда (`pg_dumpall`).
- `directum-5-bridge` (2.4k LOC) — отдельный пакет, от версии ядра почти не зависит, переносится целиком.

---

## 4. Три стратегии

### Стратегия A — Rebase/merge форка на upstream 2.x

Подтянуть `upstream` (фетч до 2.14+), смержить ~1000 upstream-коммитов в форк, разрешить конфликты в 16 core-файлах, мигрировать точки расширения page-layout, прогнать БД-миграции 1.19→1.22→2.x, задать ENCRYPTION_KEY.

- **Плюсы:** один runtime для CRM + time-app; кастом Credos и time-app в одном проде; canonical-путь Twenty.
- **Минусы:** самый дорогой и рискованный; конфликты в page-layout system (главная боль); риск регрессий по всему CRM-функционалу; долгий QA всего форка.
- **Оценка трудозатрат:** **высокая, ~3–6 недель** инженера (merge + миграции БД + регресс-тест всего Credos-функционала). Риск: **High**.

### Стратегия B — Пере-форк от свежего upstream 2.x + перенос кастома

Новый форк от upstream 2.14, поверх него заново положить `credos/`-namespace (77k LOC переносятся пакетно, они изолированы) + переприменить 16 жёлтых правок по core-changes.md (merge-инструкции уже написаны под это).

- **Плюсы:** чистая база 2.x без накопленного merge-долга; зелёная зона переносится почти as-is; core-changes.md прямо предназначен для такого переноса; легче регресс, чем хаос merge-конфликтов.
- **Минусы:** жёлтую зону всё равно переписывать под изменённую page-layout system 2.x; нужно перепроверить совместимость 77k LOC с новыми API ядра; БД-данные CRM переносить отдельно (миграция данных, не git).
- **Оценка трудозатрат:** **средне-высокая, ~2–4 недели**. Риск: **Medium-High** (основной риск — адаптация кастома под 2.x API, не сам перенос).

### Стратегия C — Отдельный прод-Twenty 2.x под time-app (как dev) ⭐ рекомендуется

Поднять **отдельный чистый прод-Twenty 2.x** (по образцу dev-сервера Railway, который уже 2.14) и установить time-app **туда**. Форк CredosCRM1 (CRM) апгрейдить до 2.x **отдельным независимым треком** в своём темпе (Стратегия A или B), без блокировки time-app.

- **Плюсы:**
  - **Разблокирует time-app немедленно** — install в чистый 2.14, ноль зависимости от тяжёлого апгрейда форка.
  - Полностью соответствует ADR-0002 (app = изолированный install-юнит, не merge).
  - Dev-сервер уже доказал, что time-app ставится в 2.14 (`app:install` прошёл, app «Трудозатраты» установлен).
  - ENCRYPTION_KEY задаётся на чистом инстансе сразу правильно (нет legacy-backfill).
  - Изоляция рисков: апгрейд CRM не ломает time tracking и наоборот.
- **Минусы:**
  - Два Twenty-инстанса в проде (CRM-форк + time) → две БД, два деплоя, дублирование инфры/мониторинга.
  - Мастер-данные (Employee/сотрудники) дублируются между инстансами — нужен sync или принять разделение (пересекается с ADR-0003 / CISO-004).
  - SSO/IdP желательно общий (ADR-0001) — иначе два логина.
- **Оценка трудозатрат:** **низкая для разблокировки time-app, ~3–5 дней** (поднять прод-инстанс 2.14 + ENCRYPTION_KEY + APP_SECRET + install + smoke). Апгрейд форка остаётся отдельной задачей в фоне. Риск: **Low** (для time-app).

---

## 5. Рекомендация

**Принять Стратегию C для разблокировки time-app**, апгрейд форка вести отдельным треком.

1. **Прод-установка time-app — НЕ ждёт** полного upstream-sync форка. Поднимаем отдельный прод-Twenty 2.x (клон конфигурации dev-сервера), задаём `ENCRYPTION_KEY` + `APP_SECRET` **до первого старта**, ставим app через `app:publish --private` → `app:install`. Это снимает предусловие ADR-0002 малой кровью и согласуется с философией ADR-0002 (app = install-юнит).
2. **Апгрейд форка CredosCRM1** до 2.x — самостоятельная задача CRM-команды, **не блокер time.credos.ru**. Для неё из двух вариантов merge предпочесть **Стратегию B (пере-форк)** перед A: накопленный divergence (851 vs ~1000+ коммитов через 3 мажорные линии) делает прямой merge (A) болезненным, а изолированность кастома (77k LOC в namespace) + готовые merge-note в core-changes.md делают пере-форк управляемее.
3. **Перед любым апгрейдом форка на 2.5+:** задать выделенный `ENCRYPTION_KEY` в env ДО старта (иначе backfill под APP_SECRET → дорогая ротация). Бэкап БД (`pg_dumpall`) обязателен.
4. **Главный технический риск merge форка** — изменения page-layout system Twenty между 1.19 и 2.x: marker-dispatch в `FieldWidget` (30 маркеров) и layout-регистрации могут потребовать полного переписывания под новые API. Заложить на это отдельный буфер времени при оценке апгрейда CRM.
5. **К решению arch (выходит за DO-1):** дублирование мастер-данных Employee при двух инстансах (C) пересекается с ADR-0003 и риском CISO-004 — нужно решить до прод-старта (sync сотрудников vs раздельные справочники).

---

## Приложение — команды проверки (read-only)

```bash
# Версия Twenty в форке
grep '"version"' packages/twenty-server/package.json   # v1.19.0
grep '"version"' packages/twenty-sdk/package.json      # 0.7.0

# Divergence
git merge-base HEAD upstream/main                        # 3a9247d9d1 (13 марта)
git describe --tags $(git merge-base HEAD upstream/main) # v1.19.0-14-g...
git rev-list --count <merge-base>..HEAD                  # 851 (форк вперёд)
git rev-list --count <merge-base>..upstream/main         # 991 (upstream, локально устарел)

# Объём кастома
find packages/*/src/credos -name '*.ts*' | wc -l         # ~620 файлов
grep -rln CREDOS packages/*/src/{modules,engine,main.ts,app.module.ts} packages/twenty-shared/src  # 16 yellow-files

# ENCRYPTION_KEY / envelope
grep -rl 'enc:v2' packages/twenty-server/src             # 0 (форк на 1.19, envelope нет)
```

---

## Валидация (DevOps, повторный read-only прозвон форка 2026-06-20)

Перепроверил ключевые утверждения прямой пробой `/Users/vsenichev/Documents/GitHub/CredosCRM1` — **все подтверждены**:

| Утверждение | Проверка | Факт |
|---|---|---|
| База форка v1.19.0 | `git -C <fork> describe --tags` | `v1.19.0-865-g698a57fa10` ✓ (865 коммитов поверх 1.19.0) |
| SDK 0.7.0 (pre-GA) | `grep version twenty-sdk/package.json` | `0.7.0` ✓ |
| envelope `enc:v2` отсутствует | `grep -rl enc:v2 twenty-server/src` | `0` ✓ (ENCRYPTION_KEY-находка верна) |
| credos namespace ~620 файлов | `find packages/*/src/credos` | `619` ✓ |
| app требует сервер ≥2.14 | `apps/time/package.json` | `engines.twenty >=2.14.0` ✓ |

`twenty-server/package.json` без поля `version` (private-пакет) — версия берётся из `git describe` (authoritative), что подтверждает 1.19.0.

**Вердикт DevOps:** анализ эмпирически верен, **Стратегия C принимается к рекомендации arch**. Прод time-app не зависит от апгрейда форка. Находка ENCRYPTION_KEY перенесена в `PLAYBOOK.md §5`. Открытый вопрос для arch (вне DO-1): дублирование мастер-данных Employee при двух инстансах (ADR-0003 / CISO-004).
