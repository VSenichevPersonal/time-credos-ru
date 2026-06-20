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

// Чистая calc: копирование прошлой недели со часами (без side-effects, тестируема).
// days[0].iso = Пн текущей недели. Записи прошлой недели → тот же день-недели текущей.
// Не перетирает filled (уже есть запись тек.нед), не льёт в выходные.
export const calcCopyWithHours = (
  days: WeekDay[],
  entries: ApiEntry[],
): { rowKeys: string[]; inputs: UpsertInput[] } => {
  const prevStartDay =
    Math.floor(new Date(`${days[0].iso}T00:00:00Z`).getTime() / 86400000) - 7;
  const curDates = new Set(days.map((d) => d.iso));
  const filled = new Set<string>();
  for (const e of entries) {
    const d = isoDay(e.date);
    if (curDates.has(d) && e.projectId && e.workTypeId && e.hours) {
      filled.add(`${e.projectId}|${e.workTypeId}|${d}`);
    }
  }
  const rowKeys = new Set<string>();
  const inputs: UpsertInput[] = [];
  for (const e of entries) {
    if (!e.projectId || !e.workTypeId || !e.hours || e.hours <= 0) continue;
    const off =
      Math.floor(new Date(`${isoDay(e.date)}T00:00:00Z`).getTime() / 86400000) -
      prevStartDay;
    if (off < 0 || off > 6) continue;
    const target = days[off];
    if (!target || target.isWeekend) continue;
    if (filled.has(`${e.projectId}|${e.workTypeId}|${target.iso}`)) continue;
    rowKeys.add(`${e.projectId}|${e.workTypeId}`);
    inputs.push({
      id: undefined,
      date: target.iso,
      hours: e.hours,
      projectId: e.projectId,
      workTypeId: e.workTypeId,
    });
  }
  return { rowKeys: Array.from(rowKeys), inputs };
};

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

  // U11: инлайн-комментарий к записи дня (сохраняем, не трогая часы). Без записи
  // (нет часов) — комментировать нечего.
  const commitDescription = useCallback(
    (rowKey: string, dayIso: string, description: string) => {
      const { projectId, workTypeId } = splitRowKey(rowKey);
      const row = rowList.find((r) => r.key === rowKey);
      const dayIdx = days.findIndex((d) => d.iso === dayIso);
      const existingId = row?.entryIdByDay[dayIdx] ?? undefined;
      const hours = row?.hoursByDay[dayIdx] ?? 0;
      if (!existingId && hours <= 0) return;
      void upsert({
        id: existingId,
        date: dayIso,
        hours,
        projectId,
        workTypeId,
        description: description.trim() || undefined,
      });
    },
    [rowList, days, upsert],
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

    // Копировать прошлую неделю СО ЧАСАМИ: переносит записи прошлой недели на тот же
  // день недели текущей (Timetta «строки и часы из предыдущего»). НЕ перетирает уже
  // заполненные ячейки и не льёт в выходные. Возвращает строки (для добавления в
  // сетку) + upsert-входы (для записи часов одним пакетом).
  const copyPreviousWeekWithHours = useCallback(
    () => calcCopyWithHours(days, entries),
    [days, entries],
  );

  return { commitCell, commitDescription, bulkFill, copyPreviousWeek, copyPreviousWeekWithHours };
};
