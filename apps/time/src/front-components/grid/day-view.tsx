import { useMemo } from 'react';

import { T } from 'src/front-components/grid/tokens';
import { Center } from 'src/front-components/grid/center';
import { AddRow } from 'src/front-components/grid/add-row';
import { DayRow } from 'src/front-components/grid/day-row';
import {
  DAILY_NORM_HOURS,
  fmtTotal,
  loadColor,
  loadHint,
  loadLevel,
} from 'src/front-components/grid/format';
import type { GridRowModel } from 'src/front-components/grid/use-grid-model';
import type { WeekDay } from 'src/front-components/grid/use-week';
import type { ProjectRef, WorkTypeRef } from 'src/front-components/grid/types';

// Режим «День»: список записей одного дня. Крупная ячейка часов, видно описание.

type Props = {
  day: WeekDay;
  dayIndex: number;
  rowList: GridRowModel[];
  projects: ProjectRef[];
  workTypes: WorkTypeRef[];
  recentProjectIds: string[];
  loading: boolean;
  onCellCommit: (rowKey: string, dayIso: string, hours: number) => void;
  onAddRow: (rowKey: string) => void;
};

export const DayView = ({
  day,
  dayIndex,
  rowList,
  projects,
  workTypes,
  recentProjectIds,
  loading,
  onCellCommit,
  onAddRow,
}: Props) => {
  // Только строки с записью в этот день или пустые добавленные.
  const visible = useMemo(
    () => rowList.filter((r) => r.hoursByDay[dayIndex] > 0 || r.rowTotal === 0),
    [rowList, dayIndex],
  );
  const dayTotal = visible.reduce((s, r) => s + r.hoursByDay[dayIndex], 0);
  const norm = day.isWeekend ? 0 : DAILY_NORM_HOURS;
  const color = loadColor(loadLevel(dayTotal, norm || DAILY_NORM_HOURS));

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading && visible.length === 0 ? (
          <Center>Загрузка…</Center>
        ) : visible.length === 0 ? (
          <Center>Нет записей за этот день. Добавьте проект ниже.</Center>
        ) : (
          visible.map((row, i) => (
            <DayRow
              key={row.key}
              alt={i % 2 === 1}
              projectName={row.projectName}
              category={row.category}
              workTypeName={row.workTypeName}
              hours={row.hoursByDay[dayIndex]}
              description={row.descByDay[dayIndex]}
              onCommit={(h) => onCellCommit(row.key, day.iso, h)}
            />
          ))
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 14px',
          background: T.headerBg,
          borderTop: `1px solid ${T.borderStrong}`,
          fontSize: 13,
        }}
      >
        <span style={{ fontWeight: 600, color: T.text }}>Итого за день</span>
        <span
          style={{
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color,
            marginLeft: 'auto',
          }}
        >
          {fmtTotal(dayTotal)}
        </span>
        {!day.isWeekend && (
          <span style={{ color, fontSize: 12, fontWeight: 600 }}>
            {loadHint(dayTotal, DAILY_NORM_HOURS)}
          </span>
        )}
      </div>

      <AddRow
        projects={projects}
        workTypes={workTypes}
        recentProjectIds={recentProjectIds}
        onAdd={onAddRow}
      />
    </>
  );
};
