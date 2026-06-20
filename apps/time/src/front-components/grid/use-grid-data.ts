import { useCallback, useEffect, useRef, useState } from 'react';

import type { ApiEntry, Ref } from 'src/front-components/grid/types';
import {
  deleteEntry,
  fetchEntries,
  fetchProjects,
  fetchWorkTypes,
  resolveEmployeeId,
  upsertEntry,
} from 'src/front-components/grid/time-rest';

// Состояние недели: справочники + записи + employeeId. CRUD напрямую по Core REST
// (логик-функции на dev-сервере отключены). Перезагрузка после каждой правки.

export type UpsertInput = {
  id?: string;
  date: string;
  hours: number;
  projectId: string;
  workTypeId: string;
  description?: string;
};

export const useGridData = (from: string, to: string) => {
  const [entries, setEntries] = useState<ApiEntry[]>([]);
  const [projects, setProjects] = useState<Ref[]>([]);
  const [workTypes, setWorkTypes] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const employeeIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (employeeIdRef.current === null) {
        employeeIdRef.current = await resolveEmployeeId(null);
      }
      const [es, ps, wts] = await Promise.all([
        fetchEntries(from, to, employeeIdRef.current),
        projects.length ? Promise.resolve(projects) : fetchProjects(),
        workTypes.length ? Promise.resolve(workTypes) : fetchWorkTypes(),
      ]);
      setEntries(es);
      setProjects(ps);
      setWorkTypes(wts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
    // projects/workTypes намеренно вне deps: грузятся один раз, дальше кэш.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const upsert = useCallback(
    async (input: UpsertInput) => {
      const employeeId = employeeIdRef.current;
      if (!employeeId) {
        setError('Сотрудник не определён');
        return;
      }
      try {
        await upsertEntry({ ...input, employeeId });
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка сохранения');
      }
    },
    [load],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteEntry(id);
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка удаления');
      }
    },
    [load],
  );

  return { entries, projects, workTypes, loading, error, reload: load, upsert, remove };
};
