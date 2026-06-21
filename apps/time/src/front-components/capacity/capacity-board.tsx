import { useMemo, useState } from 'react';

import { T, FONT, SIGMA_W } from 'src/front-components/capacity/cap-tokens';
import { Center } from 'src/front-components/grid/center';
import { BoardToolbar } from 'src/front-components/capacity/board-toolbar';
import { BoardLegend } from 'src/front-components/capacity/board-legend';
import { PeriodHeader } from 'src/front-components/capacity/period-header';
import { SummaryRow } from 'src/front-components/capacity/summary-row';
import { DeptRows, EmployeeRows } from 'src/front-components/capacity/board-rows';
import { useCapacity, type Granularity } from 'src/front-components/capacity/use-capacity';
import { usePlanEdit } from 'src/front-components/capacity/use-plan-edit';
import { deptLoadCells, summaryCells } from 'src/front-components/capacity/calc-load';
import type { CapAxis, CellMetric } from 'src/front-components/capacity/types';
import { ErrorBoundary } from 'src/front-components/shared/error-boundary';
import { ErrorState } from 'src/front-components/shared/error-state';

const NAME_WIDTH = 240;

// Доска планирования загрузки. Отвечает на вопрос продаж «когда отдел свободен,
// чтобы взять проект» (бейдж «свободен с» + метрика «свободно ч»). Ёмкость — из
// производственного календаря РФ (credosTimeWorkdayCalendar), не фикс. 40ч.
// Руководителю (isManager) доступен режим «Планировать» — ввод плана проектам.

export const CapacityBoard = () => {
  const [metric, setMetric] = useState<CellMetric>('free');
  const [axis, setAxis] = useState<CapAxis>('dept');
  const [granularity, setGranularity] = useState<Granularity>('week');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [planning, setPlanning] = useState(false);

  const { loading, error, isManager, departments, employees, projects, deptPlans, periods, absenceCtx, sharesByProject, reload, reloadProjects, reloadDeptPlans } =
    useCapacity(granularity);
  const { save, saveDeptPlan, status: saveStatus, error: saveError } = usePlanEdit(
    reloadProjects,
    reloadDeptPlans,
  );

  // Режим планирования живёт только в срезе «Отделы» (детализация по проектам).
  const effectiveAxis: CapAxis = planning ? 'dept' : axis;

  const deptById = useMemo(
    () => new Map(departments.map((d) => [d.id, d])),
    [departments],
  );

  // REQ-0012: ёмкость/загрузка отдела включает план без проекта (deptPlans).
  const cellsByDept = useMemo(() => {
    const map = new Map<string, ReturnType<typeof deptLoadCells>>();
    for (const d of departments) map.set(d.id, deptLoadCells(d, projects, periods, deptPlans, absenceCtx, sharesByProject));
    return map;
  }, [departments, projects, deptPlans, periods, absenceCtx, sharesByProject]);

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

  if (error) {
    return (
      <ErrorState
        title="Не удалось загрузить данные планирования"
        detail={error}
        onRetry={reload}
      />
    );
  }

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
      <BoardToolbar
        axis={effectiveAxis}
        metric={metric}
        granularity={granularity}
        planning={planning}
        isManager={isManager}
        saveStatus={saveStatus}
        onAxis={setAxis}
        onMetric={setMetric}
        onGranularity={setGranularity}
        onTogglePlanning={() => setPlanning((v) => !v)}
      />

      <BoardLegend />

      {planning && saveError && (
        <div
          role="alert"
          style={{
            padding: '6px 14px',
            fontSize: 12,
            color: T.over,
            background: T.overSoft,
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          Не удалось сохранить план: {saveError}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Center>Загрузка данных планирования…</Center>
        ) : departments.length === 0 ? (
          <Center>Нет отделов для планирования</Center>
        ) : (
          <ErrorBoundary
            title="Не удалось показать доску планирования"
            resetKeys={[effectiveAxis, metric, granularity]}
          >
          <div style={{ minWidth: NAME_WIDTH + periods.length * 56 + SIGMA_W }}>
            <PeriodHeader periods={periods} nameWidth={NAME_WIDTH} granularity={granularity} />

            <SummaryRow cells={summary} periods={periods} nameWidth={NAME_WIDTH} metric={metric} />

            {effectiveAxis === 'dept' ? (
              <DeptRows
                departments={departments}
                cellsByDept={cellsByDept}
                deptById={deptById}
                projects={projects}
                deptPlans={deptPlans}
                periods={periods}
                absenceCtx={absenceCtx}
                sharesByProject={sharesByProject}
                nameWidth={NAME_WIDTH}
                metric={metric}
                expanded={expanded}
                onToggle={toggle}
                planning={planning}
                onSavePlan={save}
                onSaveDeptPlan={saveDeptPlan}
              />
            ) : employees.length === 0 ? (
              <Center>Нет сотрудников для среза «по людям»</Center>
            ) : (
              <EmployeeRows
                employees={employees}
                deptById={deptById}
                projects={projects}
                deptPlans={deptPlans}
                periods={periods}
                absenceCtx={absenceCtx}
                sharesByProject={sharesByProject}
                nameWidth={NAME_WIDTH}
                metric={metric}
              />
            )}
          </div>
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
};
