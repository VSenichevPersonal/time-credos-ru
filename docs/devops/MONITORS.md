# Мониторы DevOps — time.credos.ru

Что отслеживает DevOps в loop-режиме (heartbeat 3 мин) и какие пороги/реакции.

| Монитор | Команда / источник | Период | Норма | Реакция на отклонение |
|---|---|---|---|---|
| **Health dev-сервера** | `./infra/scripts/health.sh --quiet` | 3 мин | `OK` (все 200) | FAIL → [incident-health.md](runbooks/incident-health.md); `[blocker]` если >1 цикла |
| **SIGNALS канал** | чтение `.AITEAM/SIGNALS.md` (новые записи) | 3 мин | нет инфра-задач | `[arch-ok]` schema → [deploy-sync.md](runbooks/deploy-sync.md); `[blocker]` infra → триаж |
| **Sync-дрейф** | `cd apps/time && yarn twenty dev --once --dry-run` | по событию (push в main) | `No metadata changes` после наката | diff остался → доп. sync; typecheck fail → эскалация автору |
| **Railway сервисы** | `railway status` / `railway logs --service Twenty` | при подозрении | все Online | рестарт-петля/OOM/migration-fail → incident-health |
| **Версия SDK ↔ сервер** | `railway logs \| grep V2_` vs `package.json` | при redeploy сервера | совпадают | расхождение → [sdk-bump.md](runbooks/sdk-bump.md) |
| **Секреты/ПДн в коммитах** | pre-commit `secret-scan.sh` | каждый коммит | OK | блок коммита; CISO-finding → [secrets-pii.md](runbooks/secrets-pii.md) |

## Watch-протокол деплоя завершённого (запрос заказчика)

Цель: завершённое (закоммиченное) попадает на сервер; недоделки (WIP) — нет.

Каждый цикл `cd apps/time && yarn twenty dev --once --dry-run` + проверка `git status --short apps/time/src`:

| Состояние | Значение | Действие |
|---|---|---|
| «No metadata changes» | сервер = код, parity | ок |
| diff + `apps/time/src` **ЧИСТО** | завершённое не накатано | `[observed]` arch «дрейф N, готов накатить»; накат по `[arch-ok] sync` (app-деплой гейтит arch, ADR/SIGNALS) |
| diff + `apps/time/src` **ГРЯЗНОЕ** (WIP) | недоделка параллельных агентов | **НЕ накатывать** — тихо ждать коммита |

Нюансы:
- **front-component-дрейф** виден в dry-run как `updated/created frontComponent` — UI-фичи деплоятся через sync (не только метадата).
- **Сервер может быть впереди git:** Dev накатил `dev --once` до коммита (напр. `/s/reports`) → завершённое на сервере, git догоняет батчем arch. Это норма.
- **Вопрос «накатили / не вижу»:** проверь dry-run (фича в дрейфе = не накатана) + gate (напр. `isManager` скрывает UI данными, не деплоем).

## Дисциплина loop
- **Не спамить SIGNALS:** новый `[infra-ok]` писать только при смене статуса (зелёный→красный→зелёный, накат, падение, новая задача), не каждый тихий цикл.
- **Health деградация:** один FAIL может быть сетевым — подтвердить вторым прозвоном до `[blocker]`.
- **Тихо + (parity или WIP-hold) + всё 200** → продолжать цикл, в канал не писать.

## Запуск монитора
Сессия DevOps держит loop (`/loop 3m` или ScheduleWakeup). Цикл: `git pull` → SIGNALS (инфра-сигналы + вопросы к DevOps) → deploy-drift (таблица выше) → `health.sh --quiet` → реакция → (при смене статуса) рапорт.
</content>
