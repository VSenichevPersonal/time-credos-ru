import { useMemo, useState } from 'react';

import { T, FONT } from 'src/front-components/capacity/cap-tokens';
import { Center } from 'src/front-components/grid/center';
import { Segmented } from 'src/front-components/capacity/mode-switcher';
import { PeriodHeader } from 'src/front-components/capacity/period-header';
import { SummaryRow } from 'src/front-components/capacity/summary-row';
import { DeptRow } from 'src/front-components/capacity/dept-row';
import { ProjectDetail } from 'src/front-components/capacity/project-detail';
import { useCapacity, type Granularity } from 'src/front-components/capacity/use-capacity';
import {
  deptLoadCells,
  deptProjectLoads,
  firstFreePeriod,
  summaryCells,
} from 'src/front-components/capacity/calc-load';
import type { CellMetric } from 'src/front-components/capacity/types';

const NAME_WIDTH = 240;

// Доска планирования загрузки. Отвечает на вопрос продаж «когда отдел свободен,
// чтобы взять проект» (бейдж «свободен с» + метрика «свободно ч»). Ёмкость — из
// производственного календаря РФ (credosTimeWorkdayCalendar), не фикс. 40ч.

const HINT: Record<CellMetric, string> = {
  free: 'Свободно ч = ёмкость − план (по производственному календарю РФ)',
  pct: 'Загрузка % = план / ёмкость',
  plan: 'План ч = плановые часы проектов отдела в периоде',
};

export const CapacityBoard = () => {
  const [metric, setMetric] = useState<CellMetric>('free');
  const [granularity, setGranularity] = useState<Granularity>('week');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { loading, error, departments, projects, periods } = useCapacity(granularity);

  const cellsByDept = useMemo(() => {
    const map = new Map<string, ReturnType<typeof deptLoadCells>>();
    for (const d of departments) map.set(d.id, deptLoadCells(d, projects, periods));
    return map;
  }, [departments, projects, periods]);

  const summary = useMemo(
    () => summaryCells([...cellsByDept.values()], periods),
    [cellsByDept, periods],
  );

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (error) return <Center>Не удалось загрузить данные планирования: {error}</Center>;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: T.bg,
        fontFamily: FONT,
        color: T.text,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          borderBottom: `1px solid ${T.border}`,
          background: T.panelBg,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Планирование</span>
        <Segmented
          ariaLabel="Метрика ячейки"
          value={metric}
          segments={[
            { value: 'free', label: 'Свободно ч' },
            { value: 'pct', label: 'Загрузка %' },
            { value: 'plan', label: 'План ч' },
          ]}
          onChange={setMetric}
        />
        <Segmented
          ariaLabel="Гранулярность"
          value={granularity}
          segments={[
            { value: 'week', label: 'Недели' },
            { value: 'month', label: 'Месяцы' },
          ]}
          onChange={setGranularity}
        />
        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: T.textFaint }}>
          {HINT[metric]}
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Center>Загрузка данных планирования…</Center>
        ) : departments.length === 0 ? (
          <Center>Нет отделов для планирования</Center>
        ) : (
          <div style={{ minWidth: NAME_WIDTH + periods.length * 56 }}>
            <PeriodHeader periods={periods} nameWidth={NAME_WIDTH} granularity={granularity} />

            <SummaryRow cells={summary} periods={periods} nameWidth={NAME_WIDTH} metric={metric} />

            {departments.map((dept) => {
              const cells = cellsByDept.get(dept.id) ?? [];
              const isOpen = expanded.has(dept.id);
              const detail = isOpen ? deptProjectLoads(dept, projects, periods) : null;
              return (
                <div key={dept.id}>
                  <DeptRow
                    dept={dept}
                    cells={cells}
                    periods={periods}
                    nameWidth={NAME_WIDTH}
                    metric={metric}
                    freeFrom={firstFreePeriod(cells, periods)}
                    expanded={isOpen}
                    onToggle={() => toggle(dept.id)}
                  />
                  {isOpen && detail && (
                    <ProjectDetail
                      planned={detail.planned}
                      unplanned={detail.unplanned}
                      periods={periods}
                      nameWidth={NAME_WIDTH}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
