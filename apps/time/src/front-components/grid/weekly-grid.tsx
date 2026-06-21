import { useMemo, useState } from 'react';

import { T, FONT } from 'src/front-components/grid/tokens';
import { Toolbar } from 'src/front-components/grid/toolbar';
import { FiltersBar } from 'src/front-components/grid/filters-bar';
import { WeekGrid } from 'src/front-components/grid/week-grid';
import { DayView } from 'src/front-components/grid/day-view';
import { ProjectView } from 'src/front-components/grid/project-view';
import { useWeek } from 'src/front-components/grid/use-week';
import { useDailyNorm } from 'src/front-components/grid/use-daily-norm';
import { useGridData } from 'src/front-components/grid/use-grid-data';
import { useGridModel } from 'src/front-components/grid/use-grid-model';
import { useFilters, filterProjects, filterWorkTypes } from 'src/front-components/grid/use-filters';
import { calcWeekGaps } from 'src/front-components/grid/gaps';
import { useTimesheetActions } from 'src/front-components/grid/use-timesheet-actions';
import { useApproval } from 'src/front-components/grid/use-approval';
import { ApprovalBar } from 'src/front-components/grid/approval-bar';
import { useValidation } from 'src/front-components/grid/use-validation';
import { ValidationToast } from 'src/front-components/grid/validation-toast';
import { splitRowKey, type ViewMode } from 'src/front-components/grid/types';
import { ErrorBoundary } from 'src/front-components/shared/error-boundary';
import { ErrorState } from 'src/front-components/shared/error-state';
import { useSelfEmployee } from 'src/front-components/shared/use-self-employee';
import { useGlobalSettings } from 'src/front-components/shared/use-global-settings';

// Корневой компонент таймшита. Виджет фиксированного размера: скроллится только
// тело таблицы. 3 режима (День/Неделя/Проект), клавиатура, мультиселект-фильтры.
// Роль «Руководитель» резолвится единым хуком useSelfEmployee (A2): кнопки
// согласования (approval-bar) и фильтр «Сотрудник» видны только руководителю.
// TODO(ciso-005): это UX-гейт, не защита — реальный RBAC на сервере (approval.logic).

export const WeeklyGrid = () => {
  const week = useWeek();
  const normFor = useDailyNorm(week.days.map((d) => d.iso)); // T2 SSOT норма дня
  const { isManager } = useSelfEmployee();
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

  // REQ-0019-UI: валидация при вводе. ERROR (лимит часов/день) блокирует запись и
  // держит красную плашку; WARNING (переработка > порога настроек) не блокирует —
  // запись сохраняется, янтарная плашка авто-гаснет. Та же чистая validateEntry,
  // что на бэке (SSOT), пороги из useGlobalSettings.
  const validation = useValidation();
  const overtimeThreshold = useGlobalSettings()?.overtimeWarnHours;

  // Обёртки над действиями: клиентский validateEntry — быстрый pre-check (избегаем
  // лишних запросов при явном ERROR). Затем пишем через /s/time-entry (CISO-012) и
  // показываем СЕРВЕРНЫЙ ответ (источник истины): ERROR (cannot_modify_approved /
  // hours out of range) → красная плашка + reload откатил ввод; WARNING → янтарь.
  // W6-2: клиентский lock-предикат остаётся как мгновенный UX-no-op (без запроса).
  const commitCell = (rowKey: string, dayIso: string, hours: number) => {
    if (validation.checkAndNotify(hours).blocked) return; // клиент-ERROR → не шлём запрос
    const result = actions.commitCell(rowKey, dayIso, hours);
    if (result === null) {
      validation.notifyLocked(); // клиентский lock (APPROVED) — мгновенно, без запроса
      return;
    }
    void result.then((r) => validation.showServerResult(r));
  };
  const bulkFill = (rowKey: string, hours: number) => {
    if (validation.checkAndNotify(hours).blocked) return;
    const { skippedLocked, result } = actions.bulkFill(rowKey, hours);
    if (skippedLocked) validation.notifyLocked();
    void result.then((r) => validation.showServerResult(r));
  };

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

  // W3-5: проект → последний использованный вид работ (по самой свежей записи).
  const lastWorkTypeByProject = useMemo(() => {
    const latest: Record<string, { date: string; wt: string }> = {};
    for (const e of data.entries) {
      if (!e.projectId || !e.workTypeId) continue;
      const d = e.date.slice(0, 10);
      const cur = latest[e.projectId];
      if (!cur || d >= cur.date) latest[e.projectId] = { date: d, wt: e.workTypeId };
    }
    const map: Record<string, string> = {};
    for (const pid of Object.keys(latest)) map[pid] = latest[pid].wt;
    return map;
  }, [data.entries]);

  // REQ-0015 §1: пробелы недели (пустые/недозаполненные будни) для pre-submit
  // предупреждения в подвале. Клиентский расчёт по загруженной неделе.
  const weekGaps = useMemo(() => calcWeekGaps(week.days, dayTotals, normFor), [week.days, dayTotals, normFor]);

  const addRow = (key: string) =>
    setExtraRowKeys((prev) => [...new Set([...prev, key])]);

  if (data.error) {
    return (
      <ErrorState
        title="Не удалось загрузить трудозатраты"
        detail={data.error}
        onRetry={data.reload}
      />
    );
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
        position: 'relative', // якорь для плашек валидации
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
        onCopyWeekHours={
          mode === 'week'
            ? () => {
                const { rowKeys, inputs } = actions.copyPreviousWeekWithHours();
                setExtraRowKeys((prev) => [...new Set([...prev, ...rowKeys])]);
                // CISO-012: пакет через /s/time-entry — показать серверный агрегат.
                void data.upsertMany(inputs).then((r) => validation.showServerResult(r));
              }
            : undefined
        }
        onFillStandardWeek={
          mode === 'week' && rowList.length > 0
            ? () => {
                const inputs = actions.fillStandardWeek();
                if (inputs.length > 0)
                  void data.upsertMany(inputs).then((r) => validation.showServerResult(r));
              }
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

      <ErrorBoundary
        title="Не удалось показать таблицу"
        resetKeys={[mode, week.range.from, week.range.to]}
      >
      {mode === 'week' && (
        <WeekGrid
          days={week.days}
          rowList={rowList}
          dayTotals={dayTotals}
          weekTotal={weekTotal}
          projects={visibleProjects}
          workTypes={visibleWorkTypes}
          recentProjectIds={recentProjectIds}
          lastWorkTypeByProject={lastWorkTypeByProject}
          normFor={normFor}
          overtimeThreshold={overtimeThreshold}
          loading={data.loading}
          onCellCommit={commitCell}
          onBulkFill={bulkFill}
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
          lastWorkTypeByProject={lastWorkTypeByProject}
          normFor={normFor}
          overtimeThreshold={overtimeThreshold}
          loading={data.loading}
          onCellCommit={commitCell}
          onCommitDescription={actions.commitDescription}
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
          lastWorkTypeByProject={lastWorkTypeByProject}
          normFor={normFor}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          loading={data.loading}
          overtimeThreshold={overtimeThreshold}
          onCellCommit={commitCell}
          onAddRow={(key) => {
            const { projectId } = splitRowKey(key);
            if (projectId) setSelectedProjectId(projectId);
            addRow(key);
          }}
        />
      )}
      </ErrorBoundary>

      <ApprovalBar
        status={approval.periodStatus}
        isManager={isManager}
        canSubmit={approval.canSubmit}
        canResolve={approval.canResolve}
        draftCount={approval.draftCount}
        submittedCount={approval.submittedCount}
        busy={approval.busy}
        weekGaps={weekGaps}
        onSubmit={approval.submit}
        onApprove={approval.approve}
        onReject={approval.reject}
      />

      <ValidationToast notices={validation.notices} onDismiss={validation.dismiss} />
    </div>
  );
};
