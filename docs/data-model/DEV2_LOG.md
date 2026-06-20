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
