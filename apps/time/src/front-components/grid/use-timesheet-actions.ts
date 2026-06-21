import { useCallback } from 'react';

import { splitRowKey } from 'src/front-components/grid/types';
import type { ApiEntry } from 'src/front-components/grid/types';
import type { GridRowModel } from 'src/front-components/grid/use-grid-model';
import type { WeekDay } from 'src/front-components/grid/use-week';
import type { UpsertInput } from 'src/front-components/grid/use-grid-data';
import type { MutationResult } from 'src/front-components/grid/time-rest';
import type { NormForDay } from 'src/front-components/grid/use-daily-norm';

// Действия записи: правка ячейки, bulk-fill по строке, копирование прошлой недели.

type Args = {
  rowList: GridRowModel[];
  days: WeekDay[];
  entries: ApiEntry[];
  // WI-02: норма дня (SSOT, useDailyNorm) — единственный источник часов для всех
  // fill-путей вместо хардкода DAILY_NORM_HOURS. Короткий день календаря = его часы.
  normFor: NormForDay;
  upsert: (input: UpsertInput) => Promise<MutationResult>;
  upsertMany: (inputs: UpsertInput[]) => Promise<MutationResult>;
  remove: (id: string) => Promise<MutationResult>;
};

const isoDay = (date: string): string => date.slice(0, 10);

// Пакет удалений по списку id → один агрегатный MutationResult. Пустой список →
// no-op ok. Любая ошибка отдельной мутации агрегируется (ok=false + первый error).
const removeManyResult = (
  ids: string[],
  remove: (id: string) => Promise<MutationResult>,
): Promise<MutationResult> => {
  if (ids.length === 0) return Promise.resolve({ ok: true });
  return Promise.all(ids.map((id) => remove(id))).then((results) => {
    const failed = results.find((r) => !r.ok);
    return failed ?? { ok: true };
  });
};

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
//
// WI-07/CISO-011 §F6 (UC-TS-10): lockedByDay-guard. Согласованная (APPROVED)
// ПУСТАЯ ячейка тек.недели тоже read-only — copy-week не должен в неё писать
// (как bulkFill/fillStandardWeek). filled отсекает только занятые ячейки, поэтому
// нужен явный lock-look-up по строке (projectId|workTypeId) и дню. rowList может
// не содержать строки прошлонедельной пары — тогда lock=false (ячейка точно
// пустая и несогласованная, писать можно).
export const calcCopyWithHours = (
  days: WeekDay[],
  entries: ApiEntry[],
  rowList: GridRowModel[] = [],
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
  // WI-07: индекс lock-статуса согласованных ПУСТЫХ ячеек тек.недели —
  // `${projectId}|${workTypeId}|${iso}` → true. APPROVED-ячейку (даже без часов)
  // copy-week обходит.
  const lockedCells = new Set<string>();
  for (const row of rowList) {
    days.forEach((d, i) => {
      if (row.lockedByDay[i]) lockedCells.add(`${row.projectId}|${row.workTypeId}|${d.iso}`);
    });
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
    if (lockedCells.has(`${e.projectId}|${e.workTypeId}|${target.iso}`)) continue; // WI-07: APPROVED
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

// WI-06/A1.13 «Заполнить неделю для всех». Чистая calc — для каждой строки сетки
// проставить НОРМУ ДНЯ в будни, где ячейка ещё пуста. Выходные и уже заполненные
// ячейки не трогаем (A1.14 — только пустые будни). Сверка: Timetta «расставить по
// расписанию» = норма из графика. Возвращает inputs для одного upsertMany.
//
// WI-02/A1.12/A4.8: часы = `normFor(iso, isWeekend)` (SSOT useDailyNorm,
// произв.календарь), а НЕ хардкод DAILY_NORM_HOURS. Короткий день (праздник) →
// его часы, не 8. Норма 0 (выходной/нерабочий по календарю) → ячейку пропускаем.
export const calcFillStandardWeek = (
  rowList: GridRowModel[],
  days: WeekDay[],
  normFor: NormForDay,
): UpsertInput[] => {
  const inputs: UpsertInput[] = [];
  for (const row of rowList) inputs.push(...fillRowInputs(row, days, normFor));
  return inputs;
};

// WI-06/A1.13 «Заполнить будни нормой» (меню ОДНОЙ строки). Та же логика, что у
// fillStandardWeek, но для одной строки. Норма дня (WI-02 SSOT), только пустые
// будни (A1.14), согласованные/выходные не трогаем.
export const calcFillRowWeekdays = (
  rowList: GridRowModel[],
  rowKey: string,
  days: WeekDay[],
  normFor: NormForDay,
): UpsertInput[] => {
  const row = rowList.find((r) => r.key === rowKey);
  return row ? fillRowInputs(row, days, normFor) : [];
};

// Общий хелпер WI-02/WI-06: inputs для нормы дня в пустые несогласованные будни
// одной строки. Норма 0 → пропуск (выходной/нерабочий по календарю).
const fillRowInputs = (
  row: GridRowModel,
  days: WeekDay[],
  normFor: NormForDay,
): UpsertInput[] => {
  const inputs: UpsertInput[] = [];
  days.forEach((d, i) => {
    if (d.isWeekend) return;
    if (row.hoursByDay[i] > 0) return; // не перетираем заполненное (A1.14)
    if (row.lockedByDay[i]) return; // согласованную ячейку не трогаем
    const hours = normFor(d.iso, d.isWeekend);
    if (hours <= 0) return; // нерабочий день по календарю — заполнять нечем
    inputs.push({
      id: undefined,
      date: d.iso,
      hours,
      projectId: row.projectId,
      workTypeId: row.workTypeId,
    });
  });
  return inputs;
};

// REQ «Очистить строку» (Timetta removeLines): id всех записей строки, кроме
// согласованных (APPROVED → read-only, не удаляем). Чистая calc — возвращает
// список entryId на удаление. Сверка: согласованную запись правит только отзыв.
export const calcClearRow = (
  rowList: GridRowModel[],
  rowKey: string,
): { ids: string[]; skippedLocked: boolean } => {
  const row = rowList.find((r) => r.key === rowKey);
  if (!row) return { ids: [], skippedLocked: false };
  const ids: string[] = [];
  let skippedLocked = false;
  row.entryIdByDay.forEach((id, i) => {
    if (!id) return;
    if (row.lockedByDay[i]) {
      skippedLocked = true; // согласованную не трогаем
      return;
    }
    ids.push(id);
  });
  return { ids, skippedLocked };
};

// REQ «Очистить неделю» (Timetta removeLines, опасное): id всех записей недели,
// кроме согласованных. Чистая calc — для confirm-сценария вверху тулбара.
export const calcClearWeek = (
  rowList: GridRowModel[],
): { ids: string[]; skippedLocked: boolean } => {
  const ids: string[] = [];
  let skippedLocked = false;
  for (const row of rowList) {
    row.entryIdByDay.forEach((id, i) => {
      if (!id) return;
      if (row.lockedByDay[i]) {
        skippedLocked = true;
        return;
      }
      ids.push(id);
    });
  }
  return { ids, skippedLocked };
};

export const useTimesheetActions = ({
  rowList,
  days,
  entries,
  normFor,
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
    (rowKey: string, dayIso: string, hours: number): Promise<MutationResult> | null => {
      if (isCellLocked(rowList, days, rowKey, dayIso)) return null; // APPROVED → клиентский no-op
      const { projectId, workTypeId } = splitRowKey(rowKey);
      const row = rowList.find((r) => r.key === rowKey);
      const dayIdx = days.findIndex((d) => d.iso === dayIso);
      const existingId = row?.entryIdByDay[dayIdx] ?? undefined;
      // CISO-012: возвращаем промис серверной мутации — вызывающий покажет
      // ERROR/WARNING из /s/time-entry (сервер = источник истины).
      if (hours === 0) {
        return existingId ? remove(existingId) : Promise.resolve({ ok: true });
      }
      return upsert({ id: existingId, date: dayIso, hours, projectId, workTypeId });
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
    (rowKey: string, hours: number): { skippedLocked: boolean; result: Promise<MutationResult> } => {
      const { projectId, workTypeId } = splitRowKey(rowKey);
      const row = rowList.find((r) => r.key === rowKey);
      if (!row) return { skippedLocked: false, result: Promise.resolve({ ok: true }) };
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
      // CISO-012: промис пакетной серверной записи — вызывающий покажет агрегат
      // ERROR/WARNING из /s/time-entry.
      return { skippedLocked, result: upsertMany(inputs) };
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
    () => calcCopyWithHours(days, entries, rowList), // WI-07: rowList для lock-guard
    [days, entries, rowList],
  );

  // WI-06 «Заполнить неделю для всех» — норма дня (WI-02 SSOT) в пустые будни всех
  // строк недели. Без строк делать нечего.
  const fillStandardWeek = useCallback(
    () => calcFillStandardWeek(rowList, days, normFor),
    [rowList, days, normFor],
  );

  // WI-06 «Заполнить будни нормой» (меню одной строки) — норма дня в пустые будни
  // этой строки.
  const fillRowWeekdays = useCallback(
    (rowKey: string) => calcFillRowWeekdays(rowList, rowKey, days, normFor),
    [rowList, days, normFor],
  );

  // «Очистить строку» (Timetta removeLines): удалить все записи строки, кроме
  // согласованных. Пакет удалений одним Promise.all → один reload. Возвращает
  // skippedLocked (для мягкого сообщения) + агрегатный промис.
  const clearRow = useCallback(
    (rowKey: string): { skippedLocked: boolean; result: Promise<MutationResult> } => {
      const { ids, skippedLocked } = calcClearRow(rowList, rowKey);
      return { skippedLocked, result: removeManyResult(ids, remove) };
    },
    [rowList, remove],
  );

  // «Очистить неделю» (Timetta removeLines, опасное → confirm у вызывающего):
  // удалить все несогласованные записи недели.
  const clearWeek = useCallback(
    (): { skippedLocked: boolean; result: Promise<MutationResult> } => {
      const { ids, skippedLocked } = calcClearWeek(rowList);
      return { skippedLocked, result: removeManyResult(ids, remove) };
    },
    [rowList, remove],
  );

  return {
    commitCell,
    commitDescription,
    bulkFill,
    copyPreviousWeek,
    copyPreviousWeekWithHours,
    fillStandardWeek,
    fillRowWeekdays,
    clearRow,
    clearWeek,
  };
};
