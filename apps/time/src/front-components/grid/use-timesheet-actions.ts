import { useCallback } from 'react';

import { splitRowKey } from 'src/front-components/grid/types';
import type { ApiEntry } from 'src/front-components/grid/types';
import type { GridRowModel } from 'src/front-components/grid/use-grid-model';
import type { WeekDay } from 'src/front-components/grid/use-week';
import type { UpsertInput } from 'src/front-components/grid/use-grid-data';
import { DAILY_NORM_HOURS } from 'src/front-components/grid/format';

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

// W6-2/CISO-012: согласована ли (APPROVED → read-only) ячейка строки на дату.
// Чистый предикат — SSOT для гардов commitCell. true → правка/удаление no-op.
export const isCellLocked = (
  rowList: GridRowModel[],
  days: WeekDay[],
  rowKey: string,
  dayIso: string,
): boolean => {
  const row = rowList.find((r) => r.key === rowKey);
  const dayIdx = days.findIndex((d) => d.iso === dayIso);
  return dayIdx >= 0 && (row?.lockedByDay[dayIdx] ?? false);
};

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

// REQ-0015 §2: шаблон «8×5». Чистая calc — для каждой строки сетки проставить
// DAILY_NORM_HOURS (8 ч) в будни, где ячейка ещё пуста. Выходные и уже
// заполненные ячейки не трогаем (как bulkFill, но по всем строкам недели).
// Сверка: Timetta schedule-fill (заполнить таймшит нормой). Возвращает inputs
// для одного пакетного upsertMany.
export const calcFillStandardWeek = (
  rowList: GridRowModel[],
  days: WeekDay[],
): UpsertInput[] => {
  const inputs: UpsertInput[] = [];
  for (const row of rowList) {
    days.forEach((d, i) => {
      if (d.isWeekend) return;
      if (row.hoursByDay[i] > 0) return; // не перетираем заполненное
      if (row.lockedByDay[i]) return; // согласованную ячейку не трогаем
      inputs.push({
        id: undefined,
        date: d.iso,
        hours: DAILY_NORM_HOURS,
        projectId: row.projectId,
        workTypeId: row.workTypeId,
      });
    });
  }
  return inputs;
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
  // W6-2/CISO-012: согласованная (APPROVED) ячейка — read-only. Фронт пишет
  // напрямую Core REST мимо серверного гарда cannot_modify_approved, поэтому
  // блок ДОЛЖЕН стоять и здесь (последняя линия на dev). Возвращает true, если
  // правка/удаление выполнены; false — если заблокировано (вызывающий покажет
  // мягкое сообщение). Сверка (Timetta): согласованный таймшит правится только
  // через отзыв/возврат, прямой правки нет.
  const commitCell = useCallback(
    (rowKey: string, dayIso: string, hours: number): boolean => {
      if (isCellLocked(rowList, days, rowKey, dayIso)) return false; // APPROVED → no-op
      const { projectId, workTypeId } = splitRowKey(rowKey);
      const row = rowList.find((r) => r.key === rowKey);
      const dayIdx = days.findIndex((d) => d.iso === dayIso);
      const existingId = row?.entryIdByDay[dayIdx] ?? undefined;
      if (hours === 0) {
        if (existingId) void remove(existingId);
        return true;
      }
      void upsert({ id: existingId, date: dayIso, hours, projectId, workTypeId });
      return true;
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
  // W6-2/CISO-012: согласованные (APPROVED) ячейки пропускаем явно. APPROVED
  // всегда имеет hours>0 → отсекается и проверкой ниже, но явный lockedByDay-
  // гард делает намерение очевидным и закрывает edge-cases. Возвращает true,
  // если хоть одна согласованная ячейка была пропущена (для мягкого сообщения).
  const bulkFill = useCallback(
    (rowKey: string, hours: number): { skippedLocked: boolean } => {
      const { projectId, workTypeId } = splitRowKey(rowKey);
      const row = rowList.find((r) => r.key === rowKey);
      if (!row) return { skippedLocked: false };
      const inputs: UpsertInput[] = [];
      let skippedLocked = false;
      days.forEach((d, i) => {
        if (d.isWeekend) return;
        if (row.lockedByDay[i]) {
          skippedLocked = true; // согласованную ячейку не трогаем
          return;
        }
        if (row.hoursByDay[i] > 0) return; // не перетираем заполненное
        inputs.push({ id: undefined, date: d.iso, hours, projectId, workTypeId });
      });
      void upsertMany(inputs);
      return { skippedLocked };
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

  // REQ-0015 §2: «Заполнить неделю 8×5» — проставить норму в пустые будни всех
  // строк недели. Без записи часов (нет строк) делать нечего.
  const fillStandardWeek = useCallback(
    () => calcFillStandardWeek(rowList, days),
    [rowList, days],
  );

  return {
    commitCell,
    commitDescription,
    bulkFill,
    copyPreviousWeek,
    copyPreviousWeekWithHours,
    fillStandardWeek,
  };
};
