# DEV2_LOG — рабочий журнал Dev 2 (Data + Domain)

Хронология решений/действий Dev 2. Детали — в связанных доках. Новые записи сверху.

---

## 2026-06-20 — онбординг + структура зоны

**Сделано:**
- Принял CISO findings #001/#002/#003 (все в зоне Dev 2), план фиксов в SIGNALS.
- Завёл структуру зоны Dev 2:
  - `docs/requirements/` — формальные требования (REQ-NNNN). Создан индекс + **REQ-0001** (approval RBAC + SoD).
  - `docs/domain/GLOSSARY.md` — SSOT русской доменной терминологии.
  - `docs/data-model/DEV2_LOG.md` — этот журнал.

**Открыто (ждёт arch):**
- Приоритет: #001 (P1 ПДн) → роль «Руководитель» + #002 guard (пакет) → Dev 1 UI gate.
- Решение по истории git (переписывать или нет) для ПДн.

---

## 2026-06-20 — фикс #001 (ПДн в seed) + ревью guard #002

**#001 P1 — сделано (dev-часть):**
- `seed-real.mjs`: убраны 42 реальных ФИО+email. Лоадер: `.employees.local.json` (gitignored) если есть → реальный сид; иначе синтетический `@example.test` (распределение по отделам сохранено: OV11/OIB11/OPIB9/TC6/OPR5).
- Реальные данные вынесены в `apps/time/scripts/.employees.local.json` (gitignored).
- `.gitignore` += `.employees.local.json`. `node --check` чисто.
- Сырые ПДн-источники (`research/.../roster.csv`, `trudozatraty-dir5.xlsx`, timetta Users) — уже `git rm` (staged) силами CISO/arch.

**#002 — ревью реализованного guard (другой агент уже добавил):** структурно ок, но **обходится** (spoofable client-param + fail-open). CISO-002 НЕ закрыт. Детали → [REQ-0001 «Ревью реализации»](../requirements/REQ-0001-approval-rbac-sod.md). Отписал arch/CISO.

**Наблюдение (новое, к CISO):** в `seed-real.mjs` остаются реальные клиенты + юрлица (ООО/ГУП, `legal:`) + трудозатраты по ним — confidential business data вне scope #001 (employee PII). Кандидат в отдельный finding.

---

## Карта рабочих доков Dev 2

| Что | Где |
|---|---|
| Синтез модели (главный) | `docs/data-model/DATA_MODEL_SYNTHESIS.md` |
| План сид-данных | `docs/data-model/SEED_DATA_PLAN.md` |
| Capacity | `docs/data-model/CAPACITY_PLANNING.md` |
| Прослеживаемость источников | `docs/data-model/SOURCE_TRACEABILITY.md` |
| Аудит целостности данных | `docs/data-model/DATA_INTEGRITY_AUDIT.md` |
| Требования | `docs/requirements/` |
| Глоссарий домена | `docs/domain/GLOSSARY.md` |
| UUID-SSOT | `apps/time/src/constants/universal-identifiers.ts` |
| Источники домена | `research/{directum5,timetta,kimai}/` |
