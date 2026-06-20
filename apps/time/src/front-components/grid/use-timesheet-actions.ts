import { useCallback } from 'react';

import { splitRowKey } from 'src/front-components/grid/types';
import type { ApiEntry } from 'src/front-components/grid/types';
import type { GridRowModel } from 'src/front-components/grid/use-grid-model';
import type { WeekDay } from 'src/front-components/grid/use-week';
import type { UpsertInput } from 'src/front-components/grid/use-grid-data';

// Действия записи: правка ячейки, bulk-fill по строке, копирование прошлой недели.

type Args = {
  rowList: GridRowModel[];
  days: WeekDay[];
  entries: ApiEntry[];
  upsert: (input: UpsertInput) => Promise<void>;
  upsertMany: (inputs: UpsertInput[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const isoDay = (date: string): string => date.slice(0, 10);

export const useTimesheetActions = ({
  rowList,
  days,
  entries,
  upsert,
  upsertMany,
  remove,
}: Args) => {
  // Правка одной ячейки: 0 → удалить запись, иначе upsert.
  const commitCell = useCallback(
    (rowKey: string, dayIso: string, hours: number) => {
      const { projectId, workTypeId } = splitRowKey(rowKey);
      const row = rowList.find((r) => r.key === rowKey);
      const dayIdx = days.findIndex((d) => d.iso === dayIso);
      const existingId = row?.entryIdByDay[dayIdx] ?? undefined;
      if (hours === 0) {
        if (existingId) void remove(existingId);
        return;
      }
      void upsert({ id: existingId, date: dayIso, hours, projectId, workTypeId });
    },
    [rowList, days, upsert, remove],
  );

  // Bulk-fill: применить часы на все будни строки (где ещё нет значения).
  const bulkFill = useCallback(
    (rowKey: string, hours: number) => {
      const { projectId, workTypeId } = splitRowKey(rowKey);
      const row = rowList.find((r) => r.key === rowKey);
      if (!row) return;
      const inputs: UpsertInput[] = [];
      days.forEach((d, i) => {
        if (d.isWeekend) return;
        if (row.hoursByDay[i] > 0) return; // не перетираем заполненное
        inputs.push({ id: undefined, date: d.iso, hours, projectId, workTypeId });
      });
      void upsertMany(inputs);
    },
    [rowList, days, upsertMany],
  );

  // Копировать прошлую неделю: вернуть пары (проект|вид работ) из записей
  // прошлой недели как пустые строки (без часов). Оркестратор добавит их в
  // сетку; пользователь заполняет или делает bulk-fill. Безопаснее автозалива.
  const copyPreviousWeek = useCallback((): string[] => {
    const prevStart = new Date(`${days[0].iso}T00:00:00Z`);
    prevStart.setUTCDate(prevStart.getUTCDate() - 7);
    const prevSet = new Set(
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(prevStart);
        d.setUTCDate(d.getUTCDate() + i);
        return d.toISOString().slice(0, 10);
      }),
    );
    const pairs = new Set<string>();
    for (const e of entries) {
      if (!prevSet.has(isoDay(e.date))) continue;
      if (e.projectId && e.workTypeId) pairs.add(`${e.projectId}|${e.workTypeId}`);
    }
    return Array.from(pairs);
  }, [days, entries]);

  return { commitCell, bulkFill, copyPreviousWeek };
};
