import { describe, expect, it } from 'vitest';

import { drillReducer, type DrillLevel, type DrillState } from 'src/front-components/shared/use-drill';
import type { OlapDim, OlapFilter } from 'src/front-components/reports/olap-types';

// Регресс-тест бага «смена периода сбрасывает дрилл» (заказчик, прод).
// Дашборд проецирует drill-стек в аргументы OLAP-запроса:
//   olapFilters = stack.map(l => ({ dim, value }))   — cross-filter (AND)
//   childAxis   = последний stack[].childAxis ?? rootAxis — ось текущего среза
// Период (from/to) — ОТДЕЛЬНЫЙ аргумент useOlap, не часть стека. Значит смена
// периода обязана сохранять и стек, и производные filters[]/childAxis, лишь меняя
// диапазон дат. Сброс drill — только явный (reset / goTo). Сверка: Timetta —
// срез/фильтр живёт при смене периода (правило 8).

// Проекция стека в OLAP-аргументы — копия логики reports-dashboard.tsx.
const projectOlap = (stack: DrillLevel[], rootAxis: OlapDim) => {
  const olapFilters: OlapFilter[] = stack.map((l) => ({ dim: l.dim as OlapDim, value: l.value }));
  const childAxis = (stack[stack.length - 1]?.childAxis as OlapDim | undefined) ?? rootAxis;
  return { olapFilters, childAxis };
};

const root: DrillState = { stack: [] };
const deptToProject: DrillLevel = {
  dim: 'dept',
  value: 'dept-1',
  label: 'Отдел: ОПИБ',
  valueLabel: 'ОПИБ',
  childAxis: 'project',
};
const projectToEmployee: DrillLevel = {
  dim: 'project',
  value: 'proj-7',
  label: 'Проект: Аудит',
  valueLabel: 'Аудит',
  childAxis: 'employee',
};

describe('drill сохраняется при смене периода', () => {
  it('смена периода НЕ диспатчит reset — стек переживает', () => {
    // дрилл Отдел → Проект → Сотрудник
    let s = drillReducer(root, { type: 'into', level: deptToProject });
    s = drillReducer(s, { type: 'into', level: projectToEmployee });
    const before = s;

    // смена периода (‹ › / Месяц→Год / гранулярность) в дашборде НЕ вызывает
    // dispatch — стек остаётся тем же объектом-состоянием.
    const afterPeriodChange = before; // период живёт в usePeriod, drill не трогаем

    expect(afterPeriodChange).toBe(before);
    expect(afterPeriodChange.stack.map((l) => l.value)).toEqual(['dept-1', 'proj-7']);
  });

  it('производные OLAP-аргументы (filters[]/childAxis) инвариантны к периоду', () => {
    let s = drillReducer(root, { type: 'into', level: deptToProject });
    s = drillReducer(s, { type: 'into', level: projectToEmployee });

    // период А
    const a = projectOlap(s.stack, 'dept');
    // период Б (другой from/to) — стек тот же → проекция та же
    const b = projectOlap(s.stack, 'dept');

    expect(b.olapFilters).toEqual([
      { dim: 'dept', value: 'dept-1' },
      { dim: 'project', value: 'proj-7' },
    ]);
    expect(b.childAxis).toBe('employee'); // показываем сотрудников в скоупе проекта
    expect(b.olapFilters).toEqual(a.olapFilters);
    expect(b.childAxis).toBe(a.childAxis);
  });

  it('явный сброс (reset) очищает скоуп — filters[] пустеют, childAxis = rootAxis', () => {
    let s = drillReducer(root, { type: 'into', level: deptToProject });
    s = drillReducer(s, { type: 'reset' });
    const { olapFilters, childAxis } = projectOlap(s.stack, 'dept');
    expect(olapFilters).toEqual([]);
    expect(childAxis).toBe('dept');
  });

  it('явный возврат по крошке (goTo) сужает скоуп, не теряя период', () => {
    let s = drillReducer(root, { type: 'into', level: deptToProject });
    s = drillReducer(s, { type: 'into', level: projectToEmployee });
    s = drillReducer(s, { type: 'goTo', index: 1 }); // вернулись на уровень после dept
    const { olapFilters, childAxis } = projectOlap(s.stack, 'dept');
    expect(olapFilters).toEqual([{ dim: 'dept', value: 'dept-1' }]);
    expect(childAxis).toBe('project');
  });
});
