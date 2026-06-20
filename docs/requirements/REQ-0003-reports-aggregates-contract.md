# REQ-0003 — Контракт `/s/reports`: утилизация / недогруз / агрегаты (волна-2)

**Статус:** DRAFT (design-proposal к arch + Dev 1)
**Источник:** arch волна-2 R2-D2 + UX-2 (загрузка по сотруднику); `docs/data-model/CAPACITY_PLANNING.md`, `DATA_MODEL_SYNTHESIS.md`
**Затрагивает:** новая `logic-functions/reports.logic.ts` (Dev 2), дашборд «Отчёты» (Dev 1 R2-D1), unit (QA R2-QA)

Цель — зафиксировать **контракт до кода**, чтобы Dev 1 (дашборд) и QA (unit) шли параллельно с реализацией.

## Модель (фактические поля)

| Метрика | Источник | Формула |
|---|---|---|
| **Факт** | `credosTimeEntry.hours` (FLOAT) | Σ hours по срезу |
| **Утилизация** | `entry.project.category` (`WorkCategory`) | Σ hours где `category==='Client'` / Σ hours всего |
| **Норма (ёмкость)** | `credosTimeWorkdayCalendar.hours` (раб. дни периода) × `capacityFactor` | по сотруднику ×1; по отделу × `department.headcount` (или Σ по active employees) |
| **Недогруз** | норма − факт | `> 0` недобор, `< 0` переработка |
| **План vs факт** | `project.plannedEffort` vs Σ hours проекта | для карточки проекта (D1-1) |

`WorkType.group` (production/projectManagement/presale/meetings/training/internal) — доп. аналитический разрез, НЕ влияет на утилизацию (утилизация только по `project.category`).

## Эндпоинт

`GET /s/reports` (LOGIC_FUNCTION_TYPE=LOCAL, REST-фоллбэк), params:

| param | знач | дефолт |
|---|---|---|
| `groupBy` | `department` \| `employee` \| `project` \| `category` \| `period` | `department` |
| `from`,`to` | ISO date | обяз. |
| `period` | `week` \| `month` (бакеты для `groupBy=period`) | `month` |
| `departmentId`,`employeeId`,`projectId` | фильтры (опц.) | — |

## Ответ (схема)

```json
{
  "ok": true,
  "groupBy": "employee",
  "from": "2026-01-01", "to": "2026-06-30",
  "rows": [
    {
      "key": "<id>",
      "label": "Иванов И.",
      "factHours": 720.5,
      "clientHours": 540.0,
      "utilization": 0.749,
      "normHours": 880.0,
      "underloadHours": 159.5,
      "byCategory": { "Client": 540, "Internal": 120, "Presale": 60.5 }
    }
  ],
  "totals": { "factHours": 0, "clientHours": 0, "utilization": 0, "normHours": 0, "underloadHours": 0 }
}
```

## UX-2 (по сотруднику — для capacity-доски)

- `groupBy=employee`: ёмкость = норма сотрудника из WorkdayCalendar (раб. дни × норма дня); загрузка = его факт (или план — доля `project.plannedEffort` назначенных проектов для прогноза).
- Цвет: util/норма → зелёный→жёлтый→красный (порог Dev 1).

## Критерии приёмки (QA R2-QA)

1. `groupBy=department` Σ rows.factHours == totals.factHours.
2. utilization = clientHours/factHours (0..1), факт=0 → utilization=0 (без NaN).
3. normHours учитывает праздники РФ (WorkdayCalendar), не фикс. 8×календарных дней.
4. underloadHours = normHours − factHours (знак сохраняется).
5. фильтры сужают набор; пустой срез → rows:[], totals=нули.

## Открытые вопросы (к arch/Dev 1)

- Норма по отделу: `headcount` (поле) или Σ active employees? Предлагаю Σ active (точнее при неполном штате).
- `capacityFactor` применять к норме (вычет отпусков/накладных) или показывать «грязную» норму + отдельно фактор? Предлагаю применять, поле `capacityFactor` в ответе для прозрачности.
- План по сотруднику: equal-split `plannedEffort` по командам проектов или нужен явный allocation-объект? (если да — отдельный REQ).
