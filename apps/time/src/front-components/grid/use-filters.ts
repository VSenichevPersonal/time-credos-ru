import { useCallback, useMemo, useState } from 'react';

import type {
  EmployeeRef,
  ProjectRef,
  WorkTypeRef,
} from 'src/front-components/grid/types';

// Состояние мультиселект-фильтров. Каждый фильтр — Set выбранных id/кодов.
// Пустой Set = «все». Фильтры влияют на строки сетки и опции добавления.

export type FilterKey = 'project' | 'department' | 'workType' | 'category' | 'employee';

export type FilterState = Record<FilterKey, Set<string>>;

const emptyState = (): FilterState => ({
  project: new Set(),
  department: new Set(),
  workType: new Set(),
  category: new Set(),
  employee: new Set(),
});

export const useFilters = () => {
  const [state, setState] = useState<FilterState>(emptyState);

  const toggle = useCallback((key: FilterKey, value: string) => {
    setState((prev) => {
      const next = new Set(prev[key]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [key]: next };
    });
  }, []);

  const clearKey = useCallback((key: FilterKey) => {
    setState((prev) => ({ ...prev, [key]: new Set<string>() }));
  }, []);

  const clearAll = useCallback(() => setState(emptyState()), []);

  const activeCount = useMemo(
    () => Object.values(state).reduce((s, set) => s + set.size, 0),
    [state],
  );

  return { state, toggle, clearKey, clearAll, activeCount };
};

// Применение фильтров к проектам/видам работ (доступные опции добавления + строки).
export const filterProjects = (
  projects: ProjectRef[],
  state: FilterState,
): ProjectRef[] =>
  projects.filter((p) => {
    if (state.project.size && !state.project.has(p.id)) return false;
    if (state.department.size && (!p.departmentId || !state.department.has(p.departmentId)))
      return false;
    if (state.category.size && (!p.category || !state.category.has(p.category))) return false;
    return true;
  });

export const filterWorkTypes = (
  workTypes: WorkTypeRef[],
  state: FilterState,
): WorkTypeRef[] =>
  workTypes.filter((w) => {
    if (state.workType.size && !state.workType.has(w.id)) return false;
    if (state.department.size && w.departmentId && !state.department.has(w.departmentId))
      return false;
    return true;
  });

// Проверка строки (проект+вид работ) против фильтров — для существующих записей.
export const rowPasses = (
  projectId: string,
  workTypeId: string,
  projectMap: Map<string, ProjectRef>,
  state: FilterState,
): boolean => {
  const project = projectMap.get(projectId);
  if (state.project.size && !state.project.has(projectId)) return false;
  if (state.workType.size && !state.workType.has(workTypeId)) return false;
  if (state.department.size) {
    if (!project?.departmentId || !state.department.has(project.departmentId)) return false;
  }
  if (state.category.size) {
    if (!project?.category || !state.category.has(project.category)) return false;
  }
  return true;
};

export const filterEmployees = (
  employees: EmployeeRef[],
  state: FilterState,
): EmployeeRef[] =>
  employees.filter((e) => {
    if (state.department.size && (!e.departmentId || !state.department.has(e.departmentId)))
      return false;
    return true;
  });
