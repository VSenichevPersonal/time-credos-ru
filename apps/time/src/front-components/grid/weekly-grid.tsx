import { useMemo, useState } from 'react';

import { T, FONT } from 'src/front-components/grid/tokens';
import { Toolbar } from 'src/front-components/grid/toolbar';
import { FiltersBar } from 'src/front-components/grid/filters-bar';
import { GridLegend } from 'src/front-components/grid/grid-legend';
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
import { useActorName } from 'src/front-components/grid/actor-names';
import { buildTimesheetOwner } from 'src/front-components/grid/whose-timesheet';
import { ApprovalBar } from 'src/front-components/grid/approval-bar';
import { useValidation } from 'src/front-components/grid/use-validation';
import { isDayLockedByPeriod } from 'src/front-components/grid/period-lock';
import { ValidationToast } from 'src/front-components/grid/validation-toast';
import { UndoToast, type UndoState } from 'src/front-components/grid/undo-toast';
import { splitRowKey, type ViewMode } from 'src/front-components/grid/types';
import { ErrorBoundary } from 'src/front-components/shared/error-boundary';
import { ErrorState } from 'src/front-components/shared/error-state';
import { useSelfEmployee } from 'src/front-components/shared/use-self-employee';
import { useGlobalSettings } from 'src/front-components/shared/use-global-settings';
import { useSubordinates } from 'src/front-components/grid/subordinates';

// Корневой компонент таймшита. Виджет фиксированного размера: скроллится только
// тело таблицы. 3 режима (День/Неделя/Проект), клавиатура, мультиселект-фильтры.
// Роль «Руководитель» резолвится единым хуком useSelfEmployee (A2): кнопки
// согласования (approval-bar) и фильтр «Сотрудник» видны только руководителю.
// TODO(ciso-005): это UX-гейт, не защита — реальный RBAC на сервере (approval.logic).

export const WeeklyGrid = () => {
  const week = useWeek();
  const normFor = useDailyNorm(week.days.map((d) => d.iso)); // T2 SSOT норма дня
  const { employeeId: selfEmployeeId, isManager } = useSelfEmployee();
  // On-behalf «за кого»: руководитель выбирает подчинённого → грид грузит/пишет
  // его записи (сервер защищает canWriteFor). null = свой таймшит.
  const [viewEmployeeId, setViewEmployeeId] = useState<string | null>(null);

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
    normFor, // WI-02: норма дня (SSOT) для всех fill-путей
    upsert: data.upsert,
    upsertMany: data.upsertMany,
    remove: data.remove,
  });

  // REQ-0019-UI: валидация при вводе. ERROR (лимит часов/день) блокирует запись и
  // держит красную плашку; WARNING (переработка > порога настроек) не блокирует —
  // запись сохраняется, янтарная плашка авто-гаснет. Та же чистая validateEntry,
  // что на бэке (SSOT), пороги из useGlobalSettings.
  const validation = useValidation();
  const globalSettings = useGlobalSettings();
  const overtimeThreshold = globalSettings?.overtimeWarnHours;
  // ПДн (CISO-007): ФИО актора-аудита показываем только при revealEmployeeNames.
  const revealNames = globalSettings?.revealEmployeeNames === true;

  // On-behalf селектор: подчинённые руководителя (его отдел/отделы, head=я).
  // Не-руководитель → пустой список → селектор не рисуется. Источник id —
  // useSelfEmployee (роль-резолв, совпадает с Department.head).
  const subordinates = useSubordinates(selfEmployeeId, isManager, data.employees);
  const selectEmployee = (id: string | null) => setViewEmployeeId(id);

  // PERIOD-LOCKDOWN: дни недели в закрытом периоде (по дате) — read-only-индикация
  // в сетке. Серверный гард (canMutateInPeriod) остаётся источником истины; здесь
  // лишь визуальная подсказка до отправки. Конфиг из settings (lockdownDate/grace).
  const lockdownView = {
    lockdownDate: globalSettings?.lockdownDate ?? null,
    graceDays: globalSettings?.lockdownGraceDays ?? 0,
  };
  const periodLockedByDay = useMemo(
    () => week.days.map((d) => isDayLockedByPeriod(d.iso, lockdownView)),
    [week.days, lockdownView.lockdownDate, lockdownView.graceDays],
  );

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
  // WI-06 меню строки: «Заполнить будни нормой» — норма дня (WI-02 SSOT,
  // произв.календарь) в пустые несогласованные будни ЭТОЙ строки. Не bulkFill с
  // хардкодом 8: короткий день календаря → его часы. Согласованные/занятые ячейки
  // calc пропускает.
  const fillWeekdays = (rowKey: string) => {
    const inputs = actions.fillRowWeekdays(rowKey);
    if (inputs.length > 0)
      void data.upsertMany(inputs).then((r) => validation.showServerResult(r));
  };
  // W3A.7/W3A.11: тост «Отменить» для мгновенного обнуления часов строки. Снимок
  // прежних значений (несогласованные дни с часами) → re-upsert при отмене.
  const [undo, setUndo] = useState<UndoState | null>(null);

  // Меню строки: «Обнулить часы» — удалить все несогласованные записи строки
  // (W3A.11: мгновенно + undo-тост 5с). Снимок снимаем ДО очистки.
  const clearRow = (rowKey: string) => {
    const { projectId, workTypeId } = splitRowKey(rowKey);
    const row = rowList.find((r) => r.key === rowKey);
    const snapshot =
      row?.hoursByDay
        .map((h, i) => ({ h, i }))
        .filter(({ h, i }) => h > 0 && !row.lockedByDay?.[i])
        .map(({ h, i }) => ({
          date: week.days[i]?.iso ?? '',
          hours: h,
          projectId,
          workTypeId,
          description: row.descByDay?.[i] ?? undefined,
        }))
        .filter((u) => u.date) ?? [];
    const { skippedLocked, result } = actions.clearRow(rowKey);
    if (skippedLocked) validation.notifyLocked();
    void result.then((r) => validation.showServerResult(r));
    if (snapshot.length > 0)
      setUndo({
        id: Date.now(),
        message: `Часы строки обнулены (${snapshot.length})`,
        onUndo: () => void data.upsertMany(snapshot).then((r) => validation.showServerResult(r)),
      });
  };
  // Меню строки: «Удалить строку» — очистить часы и убрать строку из сетки. Если
  // строка пустая (нет записей) — просто снять её из extraRowKeys.
  const deleteRow = (rowKey: string) => {
    clearRow(rowKey);
    setExtraRowKeys((prev) => prev.filter((k) => k !== rowKey));
  };
  // U11: комментарий к ячейке (общий для Дня и Недели). commitDescription есть в
  // actions, теперь выведен и в Неделю (был разрыв — только День).
  const commitDescription = (rowKey: string, dayIso: string, text: string) =>
    actions.commitDescription(rowKey, dayIso, text);

  // E1.18: внутренний буфер виджета (системный clipboard в RemDOM недоступен).
  // React-стейт: Ctrl+C кладёт значение активной ячейки, Ctrl+V вставляет в активную.
  const [clipboard, setClipboard] = useState<number | null>(null);

  // E1.20 (Ctrl+D): значение активной ячейки вниз по тому же столбцу на все строки
  // ниже. Согласованные/невалидные отсеет commitCell (CISO-012, серверный ответ).
  const fillDown = (col: number, fromRow: number) => {
    const src = rowList[fromRow]?.hoursByDay[col];
    if (!src || src <= 0) return;
    const dayIso = week.days[col]?.iso;
    if (!dayIso) return;
    for (let r = fromRow + 1; r < rowList.length; r++) {
      const target = rowList[r];
      if (!target || target.lockedByDay?.[col]) continue;
      if (target.hoursByDay[col] === src) continue;
      commitCell(target.key, dayIso, src);
    }
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

  // WI-56 аудит-подпись полосы: «Отклонил/Отозвал: <ФИО|КОД>». actorId — userWorkspaceId
  // (server-truth), резолв в подпись по employee.userWorkspaceRef (ПДн через reveal).
  const auditName = useActorName(approval.audit?.actorId, revealNames);
  const auditNote =
    approval.audit && auditName
      ? `${approval.audit.kind === 'rejected' ? 'Отклонил' : 'Отозвал'}: ${auditName}`
      : null;

  // WI-10: отзыв согласования/отправки из сетки. План (revoke APPROVED / recall
  // SUBMITTED) приходит из строки; здесь маршрутизируем в use-approval (вызывает
  // СУЩЕСТВУЮЩИЕ /s/approval recall/revoke). Серверный гард (isManager+SoD/ownership,
  // CISO-005) — источник истины; deniedReason — лишь UI-подсказка. denied → no-op
  // (подтверждения не было, действие не вызывается).
  const handleRecall = (plan: { mode: 'recall' | 'revoke'; ids: string[]; deniedReason: string | null }) => {
    if (plan.deniedReason) return;
    if (plan.mode === 'revoke') approval.revoke(plan.ids);
    else approval.recall(plan.ids);
  };

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

  // REQ on-behalf #1 (read-only): «чей это таймшит» — индикатор ФИО · отдел над
  // сеткой. Владелец = выбранный сотрудник (фаза on-behalf) или свой. ПДн через
  // revealNames (CISO-007): ФИО или КОД. Пока резолва нет (selfEmployeeId=null) →
  // null → тулбар покажет запасной заголовок «Таймшит».
  const owner = useMemo(
    () =>
      buildTimesheetOwner(
        viewEmployeeId ?? data.selfEmployeeId,
        data.employees,
        data.departments,
        revealNames,
      ),
    [viewEmployeeId, data.selfEmployeeId, data.employees, data.departments, revealNames],
  );

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
        owner={owner}
        subordinates={subordinates}
        viewEmployeeId={viewEmployeeId}
        onSelectEmployee={isManager ? selectEmployee : undefined}
        revealNames={revealNames}
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
        onClearWeek={
          mode === 'week'
            ? () => {
                const { skippedLocked, result } = actions.clearWeek();
                if (skippedLocked) validation.notifyLocked();
                void result.then((r) => validation.showServerResult(r));
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

      {/* Легенда сигналов сетки (🔒 / тинт / переработка / норма). Сворачиваемая,
          одна строка — не съедает фикс-высоту виджета. Режимы Неделя/Проект
          показывают тинт-заливку и норма-хинт; в режиме День сетки нет, легенда
          не нужна. */}
      {mode !== 'day' && <GridLegend />}

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
          periodLockedByDay={periodLockedByDay}
          loading={data.loading}
          onCellCommit={commitCell}
          onBulkFill={bulkFill}
          onFillDown={fillDown}
          clipboard={clipboard}
          onCopyCell={setClipboard}
          onFillWeekdays={fillWeekdays}
          onClearRow={clearRow}
          onDeleteRow={deleteRow}
          onCommitDescription={commitDescription}
          onAddRow={addRow}
          isManager={isManager}
          onRecall={handleRecall}
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
        auditNote={auditNote}
        onSubmit={approval.submit}
        onApprove={approval.approve}
        onReject={approval.reject}
      />

      <ValidationToast notices={validation.notices} onDismiss={validation.dismiss} />
      <UndoToast state={undo} onDismiss={() => setUndo(null)} />
    </div>
  );
};
