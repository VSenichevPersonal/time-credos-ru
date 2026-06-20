import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  ApiEntry,
  DepartmentRef,
  EmployeeRef,
  ProjectRef,
  WorkTypeRef,
} from 'src/front-components/grid/types';
import {
  deleteEntry,
  fetchDepartments,
  fetchEmployees,
  fetchEntries,
  fetchProjects,
  fetchWorkTypes,
  resolveEmployeeId,
  upsertEntry,
} from 'src/front-components/grid/time-rest';

// Состояние данных таймшита: справочники (грузятся раз) + записи периода.
// CRUD напрямую по Core REST. Перезагрузка записей после правки.

export type UpsertInput = {
  id?: string;
  date: string;
  hours: number;
  projectId: string;
  workTypeId: string;
  description?: string;
};

type Refs = {
  projects: ProjectRef[];
  workTypes: WorkTypeRef[];
  departments: DepartmentRef[];
  employees: EmployeeRef[];
};

const EMPTY_REFS: Refs = { projects: [], workTypes: [], departments: [], employees: [] };

export const useGridData = (from: string, to: string, viewEmployeeId: string | null) => {
  const [entries, setEntries] = useState<ApiEntry[]>([]);
  const [refs, setRefs] = useState<Refs>(EMPTY_REFS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selfIdRef = useRef<string | null>(null);
  const refsLoaded = useRef(false);

  // Чей таймшит показываем: явно выбранный (руководитель) или свой.
  const targetId = viewEmployeeId ?? selfIdRef.current;

  const loadEntries = useCallback(async (employeeId: string | null) => {
    const es = await fetchEntries(from, to, employeeId);
    setEntries(es);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!refsLoaded.current) {
        selfIdRef.current = await resolveEmployeeId(null);
        const [projects, workTypes, departments, employees] = await Promise.all([
          fetchProjects(),
          fetchWorkTypes(),
          fetchDepartments(),
          fetchEmployees(),
        ]);
        setRefs({ projects, workTypes, departments, employees });
        refsLoaded.current = true;
      }
      await loadEntries(viewEmployeeId ?? selfIdRef.current);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [loadEntries, viewEmployeeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const upsert = useCallback(
    async (input: UpsertInput) => {
      if (!targetId) {
        setError('Сотрудник не определён');
        return;
      }
      try {
        await upsertEntry({ ...input, employeeId: targetId });
        await loadEntries(targetId);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка сохранения');
      }
    },
    [loadEntries, targetId],
  );

  // Пакетная запись (копирование недели / bulk-fill) — один reload в конце.
  const upsertMany = useCallback(
    async (inputs: UpsertInput[]) => {
      if (!targetId || inputs.length === 0) return;
      try {
        for (const input of inputs) await upsertEntry({ ...input, employeeId: targetId });
        await loadEntries(targetId);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка сохранения');
      }
    },
    [loadEntries, targetId],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteEntry(id);
        await loadEntries(targetId);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка удаления');
      }
    },
    [loadEntries, targetId],
  );

  return {
    entries,
    ...refs,
    selfEmployeeId: selfIdRef.current,
    loading,
    error,
    reload: load,
    upsert,
    upsertMany,
    remove,
  };
};
