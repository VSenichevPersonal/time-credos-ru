import { useMemo, useState } from 'react';

import { T, FONT } from 'src/front-components/grid/tokens';
import { Center } from 'src/front-components/grid/center';
import { Toolbar } from 'src/front-components/grid/toolbar';
import { FiltersBar } from 'src/front-components/grid/filters-bar';
import { WeekGrid } from 'src/front-components/grid/week-grid';
import { DayView } from 'src/front-components/grid/day-view';
import { ProjectView } from 'src/front-components/grid/project-view';
import { useWeek } from 'src/front-components/grid/use-week';
import { useGridData } from 'src/front-components/grid/use-grid-data';
import { useGridModel } from 'src/front-components/grid/use-grid-model';
import { useFilters, filterProjects, filterWorkTypes } from 'src/front-components/grid/use-filters';
import { useTimesheetActions } from 'src/front-components/grid/use-timesheet-actions';
import { useApproval } from 'src/front-components/grid/use-approval';
import { ApprovalBar } from 'src/front-components/grid/approval-bar';
import { splitRowKey, type ViewMode } from 'src/front-components/grid/types';

// Корневой компонент таймшита. Виджет фиксированного размера: скроллится только
// тело таблицы. 3 режима (День/Неделя/Проект), клавиатура, мультиселект-фильтры.
// TODO(manager): роль «Руководитель» из контекста — пока фильтр сотрудника скрыт.

export const WeeklyGrid = () => {
  const week = useWeek();
  const isManager = false; // TODO: определять по роли пользователя (useUserId + roles)
  const [viewEmployeeId] = useState<string | null>(null);

  const data = useGridData(week.range.from, week.range.to, viewEmployeeId);
  const { state, toggle, clearKey, clearAll, activeCount } = useFilters();

  const [mode, setMode] = useState<ViewMode>('week');
  const [extraRowKeys, setExtraRowKeys] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const visibleProjects = useMemo(
    () => filterProjects(data.projects, state),
    [data.projects, state],
  );
  const visibleWorkTypes = useMemo(
    () => filterWorkTypes(data.workTypes, state),
    [data.workTypes, state],
  );

  const { rowList, dayTotals, weekTotal } = useGridModel(
    data.entries,
    data.projects,
    data.workTypes,
    week.days,
    extraRowKeys,
    state,
  );

  const actions = useTimesheetActions({
    rowList,
    days: week.days,
    entries: data.entries,
    upsert: data.upsert,
    upsertMany: data.upsertMany,
    remove: data.remove,
  });

  // Согласование периода (отключаемое): бейдж + действия в подвале.
  const approval = useApproval({
    entries: data.entries,
    projects: data.projects,
    departments: data.departments,
    employeeId: viewEmployeeId ?? data.selfEmployeeId,
    from: week.range.from,
    to: week.range.to,
    reload: data.reload,
  });

  // Недавние проекты: из текущих записей (частые сверху автокомплита).
  const recentProjectIds = useMemo(() => {
    const seen: string[] = [];
    for (const r of rowList) if (!seen.includes(r.projectId)) seen.push(r.projectId);
    return seen.slice(0, 5);
  }, [rowList]);

  const addRow = (key: string) =>
    setExtraRowKeys((prev) => [...new Set([...prev, key])]);

  if (data.error) {
    return <Center>Не удалось загрузить трудозатраты: {data.error}</Center>;
  }

  const periodTitle = mode === 'day' ? week.dayTitle : week.weekTitle;
  const onPrev = mode === 'day' ? week.prevDay : week.prevWeek;
  const onNext = mode === 'day' ? week.nextDay : week.nextWeek;

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
      <Toolbar
        mode={mode}
        onModeChange={setMode}
        periodTitle={periodTitle}
        saveStatus={data.saveStatus}
        onPrev={onPrev}
        onNext={onNext}
        onToday={week.reset}
        onCopyWeek={
          mode === 'week'
            ? () => setExtraRowKeys((prev) => [...new Set([...prev, ...actions.copyPreviousWeek()])])
            : undefined
        }
        copyDisabled={data.loading}
      />

      <FiltersBar
        projects={data.projects}
        workTypes={data.workTypes}
        departments={data.departments}
        employees={data.employees}
        isManager={isManager}
        state={state}
        activeCount={activeCount}
        onToggle={toggle}
        onClearKey={clearKey}
        onClearAll={clearAll}
      />

      {mode === 'week' && (
        <WeekGrid
          days={week.days}
          rowList={rowList}
          dayTotals={dayTotals}
          weekTotal={weekTotal}
          projects={visibleProjects}
          workTypes={visibleWorkTypes}
          recentProjectIds={recentProjectIds}
          loading={data.loading}
          onCellCommit={actions.commitCell}
          onBulkFill={actions.bulkFill}
          onAddRow={addRow}
        />
      )}

      {mode === 'day' && (
        <DayView
          day={week.selectedDay}
          dayIndex={week.dayIndex}
          rowList={rowList}
          projects={visibleProjects}
          workTypes={visibleWorkTypes}
          recentProjectIds={recentProjectIds}
          loading={data.loading}
          onCellCommit={actions.commitCell}
          onAddRow={addRow}
        />
      )}

      {mode === 'project' && (
        <ProjectView
          days={week.days}
          rowList={rowList}
          projects={visibleProjects}
          workTypes={visibleWorkTypes}
          recentProjectIds={recentProjectIds}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          loading={data.loading}
          onCellCommit={actions.commitCell}
          onAddRow={(key) => {
            const { projectId } = splitRowKey(key);
            if (projectId) setSelectedProjectId(projectId);
            addRow(key);
          }}
        />
      )}

      <ApprovalBar
        status={approval.periodStatus}
        isManager={isManager}
        canSubmit={approval.canSubmit}
        canResolve={approval.canResolve}
        draftCount={approval.draftCount}
        submittedCount={approval.submittedCount}
        busy={approval.busy}
        onSubmit={approval.submit}
        onApprove={approval.approve}
        onReject={approval.reject}
      />
    </div>
  );
};
