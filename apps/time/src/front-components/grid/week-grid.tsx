import { useEffect, useRef, useState } from 'react';

import { GridRow } from 'src/front-components/grid/grid-row';
import { WeekHeader } from 'src/front-components/grid/week-header';
import { FooterTotals } from 'src/front-components/grid/footer-totals';
import { AddRow } from 'src/front-components/grid/add-row';
import type { Prefill } from 'src/front-components/grid/add-row';
import { Center } from 'src/front-components/grid/center';
import { firstEmptyCell, useKeyboard } from 'src/front-components/grid/use-keyboard';
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
  loading: boolean;
  onCellCommit: (rowKey: string, dayIso: string, hours: number) => void;
  onBulkFill: (rowKey: string, hours: number) => void;
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
  loading,
  onCellCommit,
  onBulkFill,
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

  // Shift+Enter на активной ячейке: bulk-fill её значения на будни строки.
  // Слушаем onKeyDown на контейнере (React-событие), а НЕ window.addEventListener:
  // в песочнице Web Worker (Remote DOM) глобальные window-слушатели host-клавиатуры
  // не срабатывают. UI_PLAYBOOK §0.
  const onContainerKeyDown = (e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
    if (e.key === 'Enter' && e.shiftKey && nav.active) {
      const row = rowList[nav.active.row];
      const val = row?.hoursByDay[nav.active.col];
      if (row && val && val > 0) {
        e.preventDefault();
        onBulkFill(row.key, val);
      }
    }
  };

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} onKeyDown={onContainerKeyDown}>
        <WeekHeader days={days} leftLabel="Проект / вид работ" />
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
              rowTotal={row.rowTotal}
              alt={i % 2 === 1}
              nav={nav}
              onCellCommit={(dayIso, hours) => onCellCommit(row.key, dayIso, hours)}
              onDuplicate={() => duplicateRow(row.projectId)}
            />
          ))
        )}
      </div>
      <FooterTotals days={days} dayTotals={dayTotals} weekTotal={weekTotal} />
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
