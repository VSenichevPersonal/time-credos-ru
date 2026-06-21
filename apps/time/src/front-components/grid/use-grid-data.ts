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
  type MutationResult,
} from 'src/front-components/grid/time-rest';
import { useSaveStatus } from 'src/front-components/grid/use-save-status';

// Состояние данных таймшита: справочники (грузятся раз) + записи периода.
// CISO-012: ЗАПИСЬ маршрутизируется через /s/time-entry (см. time-rest.ts) —
// серверные гарды (lock-approved, валидация, дедуп) срабатывают путь-независимо.
// Серверный ERROR возвращается вызывающему (показ в тостах) + reload восстанавливает
// серверное состояние (откат оптимистичного ввода «бесплатно» — оптимистики нет).

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
  const { status: saveStatus, track } = useSaveStatus();

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

  // Возвращает MutationResult (серверный ok/error/warnings) — вызывающий слой
  // (weekly-grid) показывает ERROR-тост / WARNING-плашку. reload после операции
  // синхронизирует UI с сервером: при серверном ERROR запись не создалась/не
  // изменилась → reload «откатывает» оптимистичный ввод (оптимистики нет).
  const upsert = useCallback(
    async (input: UpsertInput): Promise<MutationResult> => {
      if (!targetId) {
        setError('Сотрудник не определён');
        return { ok: false, error: 'employee not resolved' };
      }
      try {
        let result: MutationResult = { ok: true };
        await track(async () => {
          result = await upsertEntry({ ...input, employeeId: targetId });
          await loadEntries(targetId);
        });
        return result;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка сохранения');
        return { ok: false, error: 'network' };
      }
    },
    [loadEntries, targetId, track],
  );

  // Пакетная запись (копирование недели / bulk-fill) — один reload в конце.
  // Агрегат: ok=false если хоть одна запись отклонена сервером; warnings собираем.
  const upsertMany = useCallback(
    async (inputs: UpsertInput[]): Promise<MutationResult> => {
      if (!targetId || inputs.length === 0) return { ok: true };
      try {
        let agg: MutationResult = { ok: true };
        await track(async () => {
          const warnings: NonNullable<MutationResult['warnings']> = [];
          let firstError: MutationResult | null = null;
          for (const input of inputs) {
            const r = await upsertEntry({ ...input, employeeId: targetId });
            if (!r.ok && !firstError) firstError = r;
            if (r.warnings) warnings.push(...r.warnings);
          }
          await loadEntries(targetId);
          agg = firstError
            ? firstError
            : { ok: true, ...(warnings.length ? { warnings } : {}) };
        });
        return agg;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка сохранения');
        return { ok: false, error: 'network' };
      }
    },
    [loadEntries, targetId, track],
  );

  const remove = useCallback(
    async (id: string): Promise<MutationResult> => {
      try {
        let result: MutationResult = { ok: true };
        await track(async () => {
          result = await deleteEntry(id);
          await loadEntries(targetId);
        });
        return result;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка удаления');
        return { ok: false, error: 'network' };
      }
    },
    [loadEntries, targetId, track],
  );

  return {
    entries,
    ...refs,
    selfEmployeeId: selfIdRef.current,
    loading,
    error,
    saveStatus,
    reload: load,
    upsert,
    upsertMany,
    remove,
  };
};
