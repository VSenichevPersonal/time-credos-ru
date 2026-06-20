import { useState } from 'react';

import { AddRow } from 'src/front-components/grid/add-row';
import { FooterTotals } from 'src/front-components/grid/footer-totals';
import { GridRow } from 'src/front-components/grid/grid-row';
import { T, FONT } from 'src/front-components/grid/tokens';
import { useGridData } from 'src/front-components/grid/use-grid-data';
import { useGridModel } from 'src/front-components/grid/use-grid-model';
import { useWeek } from 'src/front-components/grid/use-week';
import { WeekHeader } from 'src/front-components/grid/week-header';
import { splitRowKey } from 'src/front-components/grid/types';

// Недельная сетка трудозатрат. Виджет фиксированного размера (без внешнего
// скролла — прокручивается только тело таблицы). Данные через /s/time-entry.

const Center = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      fontSize: 13,
      color: T.textMuted,
      fontFamily: FONT,
    }}
  >
    {children}
  </div>
);

export const WeeklyGrid = () => {
  const { days, range, title, prev, next, reset } = useWeek();
  const { entries, projects, workTypes, loading, error, upsert, remove } = useGridData(
    range.from,
    range.to,
  );
  const [extraRowKeys, setExtraRowKeys] = useState<string[]>([]);
  const { rowList, dayTotals, weekTotal } = useGridModel(
    entries,
    projects,
    workTypes,
    days,
    extraRowKeys,
  );

  const handleCommit = (rowKey: string, dayIso: string, hours: number) => {
    const { projectId, workTypeId } = splitRowKey(rowKey);
    const row = rowList.find((r) => r.key === rowKey);
    const dayIdx = days.findIndex((d) => d.iso === dayIso);
    const existingId = row?.entryIdByDay[dayIdx] ?? undefined;

    if (hours === 0 && existingId) {
      void remove(existingId);
      return;
    }
    if (hours === 0) return;
    void upsert({ id: existingId, date: dayIso, hours, projectId, workTypeId });
  };

  if (error) {
    return <Center>Не удалось загрузить трудозатраты: {error}</Center>;
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
      <WeekHeader title={title} days={days} onPrev={prev} onNext={next} onReset={reset} />

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading && rowList.length === 0 ? (
          <Center>Загрузка…</Center>
        ) : rowList.length === 0 ? (
          <Center>Нет записей за эту неделю. Добавьте строку ниже.</Center>
        ) : (
          rowList.map((row, i) => (
            <GridRow
              key={row.key}
              projectName={row.projectName}
              workTypeName={row.workTypeName}
              days={days}
              hoursByDay={row.hoursByDay}
              rowTotal={row.rowTotal}
              alt={i % 2 === 1}
              onCellCommit={(dayIso, hours) => handleCommit(row.key, dayIso, hours)}
            />
          ))
        )}
      </div>

      <FooterTotals days={days} dayTotals={dayTotals} weekTotal={weekTotal} />
      <AddRow
        projects={projects}
        workTypes={workTypes}
        onAdd={(key) => setExtraRowKeys((prev) => [...new Set([...prev, key])])}
      />
    </div>
  );
};
