import { useEffect, useRef, useState } from 'react';

import type { NormForDay } from 'src/front-components/grid/use-daily-norm';
import { GridRow } from 'src/front-components/grid/grid-row';
import { WeekHeader } from 'src/front-components/grid/week-header';
import { FooterTotals } from 'src/front-components/grid/footer-totals';
import { AddRow } from 'src/front-components/grid/add-row';
import type { Prefill } from 'src/front-components/grid/add-row';
import { Center } from 'src/front-components/grid/center';
import { firstEmptyCell, keyAction, useKeyboard } from 'src/front-components/grid/use-keyboard';
import type { GridRowModel } from 'src/front-components/grid/use-grid-model';
import type { WeekDay } from 'src/front-components/grid/use-week';
import type { ProjectRef, WorkTypeRef } from 'src/front-components/grid/types';

// Режим «Неделя»: строки (проект+вид работ) × Пн–Вс. Клавиатура-first.
// Shift+Enter = bulk-fill введённого значения на все будни строки.

type Props = {
  days: WeekDay[];
  rowList: GridRowModel[];
  dayTotals: number[];
  weekTotal: number;
  projects: ProjectRef[];
  workTypes: WorkTypeRef[];
  recentProjectIds: string[];
  lastWorkTypeByProject?: Record<string, string>;
  normFor: NormForDay;
  overtimeThreshold?: number; // REQ-0019: порог переработки/день из настроек
  loading: boolean;
  onCellCommit: (rowKey: string, dayIso: string, hours: number) => void;
  onBulkFill: (rowKey: string, hours: number) => void;
  onFillDown: (col: number, fromRow: number) => void; // Ctrl+D: значение вниз по столбцу (E1.20)
  clipboard: number | null; // E1.18: внутренний буфер виджета (Ctrl+C/V)
  onCopyCell: (hours: number) => void; // E1.18: положить значение в буфер
  onFillWeekdays: (rowKey: string) => void; // меню строки: норма дня в пустые будни
  onClearRow: (rowKey: string) => void; // меню строки: обнулить часы
  onDeleteRow: (rowKey: string) => void; // меню строки: убрать строку
  onCommitDescription: (rowKey: string, dayIso: string, text: string) => void; // комментарий к ячейке
  onAddRow: (rowKey: string) => void;
};

export const WeekGrid = ({
  days,
  rowList,
  dayTotals,
  weekTotal,
  projects,
  workTypes,
  recentProjectIds,
  lastWorkTypeByProject,
  normFor,
  overtimeThreshold,
  loading,
  onCellCommit,
  onBulkFill,
  onFillDown,
  clipboard,
  onCopyCell,
  onFillWeekdays,
  onClearRow,
  onDeleteRow,
  onCommitDescription,
  onAddRow,
}: Props) => {
  const nav = useKeyboard(rowList.length, 7);

  // UC1: автофокус первой пустой редактируемой ячейки — быстрый старт ввода с
  // клавиатуры (сверка Kimai QuickEntry). Один раз после загрузки строк, пока
  // пользователь сам ничего не выбрал (nav.active === null). Песочница-safe:
  // через nav.setActive (координаты), без host-DOM focus(). Если все ячейки
  // заполнены/заблокированы — firstEmptyCell вернёт null, фокус не ставим.
  const autofocusedRef = useRef(false);
  useEffect(() => {
    if (autofocusedRef.current || loading || rowList.length === 0 || nav.active) return;
    const cell = firstEmptyCell(
      rowList.map((r) => r.hoursByDay),
      rowList.map((r) => r.lockedByDay),
    );
    if (cell) {
      nav.setActive(cell);
      autofocusedRef.current = true;
    }
  }, [loading, rowList, nav]);

  // W3-1: «Дублировать строку» → префилл проекта в форму добавления (AddRow).
  const [prefill, setPrefill] = useState<Prefill | null>(null);
  const duplicateRow = (projectId: string) =>
    setPrefill({ projectId, nonce: Date.now() });

  // Массовые/буферные действия на активной ячейке: Shift+Enter (bulk-fill будней),
  // Ctrl+D (вниз по столбцу), Ctrl+C/V (внутренний буфер виджета). Маршрут — через
  // SSOT keyAction (E4.14: тот же источник, что cheatsheet). Слушаем onKeyDown на
  // контейнере (React-событие), а НЕ window.addEventListener: в песочнице Web Worker
  // (Remote DOM) глобальные window-слушатели host-клавиатуры не срабатывают (UI_PLAYBOOK §0).
  const onContainerKeyDown = (e: {
    key: string;
    shiftKey: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    preventDefault: () => void;
  }) => {
    if (!nav.active) return;
    const row = rowList[nav.active.row];
    if (!row) return;
    const val = row.hoursByDay[nav.active.col];
    const action = keyAction(e);
    if (action.type === 'bulkFillRow') {
      if (val && val > 0) {
        e.preventDefault();
        onBulkFill(row.key, val); // E4.5: часы ячейки на все будни строки
      }
    } else if (action.type === 'fillDown') {
      if (val && val > 0) {
        e.preventDefault();
        onFillDown(nav.active.col, nav.active.row); // E1.20: вниз по столбцу
      }
    } else if (action.type === 'copy') {
      e.preventDefault();
      onCopyCell(val ?? 0); // E1.18: в внутренний буфер
    } else if (action.type === 'paste') {
      if (clipboard !== null) {
        e.preventDefault();
        onCellCommit(row.key, days[nav.active.col]?.iso ?? '', clipboard); // E1.18
      }
    }
  };

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} onKeyDown={onContainerKeyDown}>
        <WeekHeader days={days} leftLabels={['Проект', 'Вид работ']} normFor={normFor} />
        {loading && rowList.length === 0 ? (
          <Center>Загрузка…</Center>
        ) : rowList.length === 0 ? (
          <Center>Нет записей. Начните печатать код проекта или клиента ниже.</Center>
        ) : (
          rowList.map((row, i) => (
            <GridRow
              key={row.key}
              rowIndex={i}
              projectName={row.projectName}
              category={row.category}
              workTypeName={row.workTypeName}
              tags={row.tags}
              days={days}
              hoursByDay={row.hoursByDay}
              lockedByDay={row.lockedByDay}
              descByDay={row.descByDay}
              overtimeThreshold={overtimeThreshold}
              rowTotal={row.rowTotal}
              alt={i % 2 === 1}
              nav={nav}
              onCellCommit={(dayIso, hours) => onCellCommit(row.key, dayIso, hours)}
              onCommitDescription={(dayIso, text) => onCommitDescription(row.key, dayIso, text)}
              onDuplicate={() => duplicateRow(row.projectId)}
              onFillWeekdays={() => onFillWeekdays(row.key)}
              onClearRow={() => onClearRow(row.key)}
              onDeleteRow={() => onDeleteRow(row.key)}
            />
          ))
        )}
      </div>
      <FooterTotals days={days} dayTotals={dayTotals} weekTotal={weekTotal} normFor={normFor} />
      <AddRow
        projects={projects}
        workTypes={workTypes}
        recentProjectIds={recentProjectIds}
        lastWorkTypeByProject={lastWorkTypeByProject}
        prefill={prefill}
        onAdd={onAddRow}
      />
    </>
  );
};
