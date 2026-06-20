import { useMemo } from 'react';

import type {
  ApiEntry,
  ProjectRef,
  WorkTypeRef,
} from 'src/front-components/grid/types';
import { makeRowKey } from 'src/front-components/grid/types';
import type { WeekDay } from 'src/front-components/grid/use-week';
import type { FilterState } from 'src/front-components/grid/use-filters';
import { rowPasses } from 'src/front-components/grid/use-filters';

// Агрегация плоских записей в модель сетки: строки (проект+вид работ) × 7 дней.
// Учитывает фильтры строк и пустые строки, добавленные пользователем.

export type GridRowModel = {
  key: string;
  projectId: string;
  workTypeId: string;
  projectName: string;
  category: string | null; // категория проекта (UPPER_CASE) — для цвет-кодинга
  workTypeName: string;
  hoursByDay: number[]; // длина 7
  entryIdByDay: (string | null)[];
  descByDay: (string | null)[];
  lockedByDay: boolean[]; // W6-2: день только для чтения (запись APPROVED)
  tags: string[]; // W3-2: объединение тегов записей строки (без дублей)
  rowTotal: number;
};

const dayIso = (date: string): string => date.slice(0, 10);

// Чистая calc: агрегация записей в модель сетки (без side-effects, тестируема).
export const calcGridModel = (
  entries: ApiEntry[],
  projects: ProjectRef[],
  workTypes: WorkTypeRef[],
  days: WeekDay[],
  extraRowKeys: string[],
  filters: FilterState,
): { rowList: GridRowModel[]; dayTotals: number[]; weekTotal: number } => {
  const projMap = new Map(projects.map((p) => [p.id, p]));
  const wtName = new Map(workTypes.map((w) => [w.id, w.name]));
  const dayIndex = new Map(days.map((d, i) => [d.iso, i]));

  const rows = new Map<string, GridRowModel>();
  const ensure = (projectId: string, workTypeId: string): GridRowModel => {
    const key = makeRowKey(projectId, workTypeId);
    let row = rows.get(key);
    if (!row) {
      const project = projMap.get(projectId);
      row = {
        key,
        projectId,
        workTypeId,
        projectName: project?.name ?? 'Проект',
        category: project?.category ?? null,
        workTypeName: wtName.get(workTypeId) ?? 'Без вида работ',
        hoursByDay: Array(7).fill(0),
        entryIdByDay: Array(7).fill(null),
        descByDay: Array(7).fill(null),
        lockedByDay: Array(7).fill(false),
        tags: [],
        rowTotal: 0,
      };
      rows.set(key, row);
    }
    return row;
  };

  for (const e of entries) {
    const idx = dayIndex.get(dayIso(e.date));
    if (idx === undefined) continue;
    const pid = e.projectId ?? '';
    const wid = e.workTypeId ?? '';
    if (!rowPasses(pid, wid, projMap, filters)) continue;
    // W3-3: фильтр по статусу согласования (на уровне записи).
    if (filters.status.size > 0 && !filters.status.has(e.status ?? '')) continue;
    // W3-2: фильтр по тегу (на уровне записи) — запись проходит, если содержит
    // хотя бы один из выбранных тегов.
    const entryTags = e.tags ?? [];
    if (filters.tag.size > 0 && !entryTags.some((t) => filters.tag.has(t))) continue;
    const row = ensure(pid, wid);
    row.hoursByDay[idx] += e.hours;
    row.entryIdByDay[idx] = e.id;
    row.descByDay[idx] = e.description;
    if (e.status === 'APPROVED') row.lockedByDay[idx] = true; // W6-2: согласованное — read-only
    for (const t of entryTags) if (!row.tags.includes(t)) row.tags.push(t);
    row.rowTotal += e.hours;
  }

  for (const key of extraRowKeys) {
    const [projectId, workTypeId] = key.split('|');
    if (projectId && workTypeId && rowPasses(projectId, workTypeId, projMap, filters))
      ensure(projectId, workTypeId);
  }

  const rowList = Array.from(rows.values()).sort((a, b) =>
    a.projectName === b.projectName
      ? a.workTypeName.localeCompare(b.workTypeName, 'ru')
      : a.projectName.localeCompare(b.projectName, 'ru'),
  );

  const dayTotals = Array(7).fill(0) as number[];
  for (const row of rowList) for (let i = 0; i < 7; i++) dayTotals[i] += row.hoursByDay[i];
  const weekTotal = dayTotals.reduce((s, n) => s + n, 0);

  return { rowList, dayTotals, weekTotal };
};

export const useGridModel = (
  entries: ApiEntry[],
  projects: ProjectRef[],
  workTypes: WorkTypeRef[],
  days: WeekDay[],
  extraRowKeys: string[],
  filters: FilterState,
) => {
  return useMemo(
    () => calcGridModel(entries, projects, workTypes, days, extraRowKeys, filters),
    [entries, projects, workTypes, days, extraRowKeys, filters],
  );
};
