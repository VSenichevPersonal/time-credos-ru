import { useMemo } from 'react';

import { T } from 'src/front-components/grid/tokens';
import { FilterChip, type Option } from 'src/front-components/grid/filter-chip';
import type {
  EmployeeRef,
  ProjectRef,
  Ref,
  WorkTypeRef,
} from 'src/front-components/grid/types';
import type { FilterKey, FilterState } from 'src/front-components/grid/use-filters';
import { WORK_CATEGORY_OPTIONS, ENTRY_STATUS_OPTIONS } from 'src/constants/select-options';

// Панель фильтров (чипы-дропдауны). Сотрудник — только для руководителя.

type Props = {
  projects: ProjectRef[];
  workTypes: WorkTypeRef[];
  departments: Ref[];
  employees: EmployeeRef[];
  isManager: boolean;
  state: FilterState;
  activeCount: number;
  onToggle: (key: FilterKey, value: string) => void;
  onClearKey: (key: FilterKey) => void;
  onClearAll: () => void;
};

const toOptions = (refs: { id: string; name: string }[]): Option[] =>
  refs.map((r) => ({ value: r.id, label: r.name }));

export const FiltersBar = ({
  projects,
  workTypes,
  departments,
  employees,
  isManager,
  state,
  activeCount,
  onToggle,
  onClearKey,
  onClearAll,
}: Props) => {
  const projectOpts = useMemo(() => toOptions(projects), [projects]);
  const workTypeOpts = useMemo(() => toOptions(workTypes), [workTypes]);
  const departmentOpts = useMemo(() => toOptions(departments), [departments]);
  const employeeOpts = useMemo(() => toOptions(employees), [employees]);
  const categoryOpts: Option[] = useMemo(
    () => WORK_CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    [],
  );
  const statusOpts: Option[] = useMemo(
    () => ENTRY_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    [],
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        padding: '7px 12px',
        background: T.panelBg,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <FilterChip
        label="Проект"
        options={projectOpts}
        selected={state.project}
        onToggle={(v) => onToggle('project', v)}
        onClear={() => onClearKey('project')}
      />
      <FilterChip
        label="Отдел"
        options={departmentOpts}
        selected={state.department}
        onToggle={(v) => onToggle('department', v)}
        onClear={() => onClearKey('department')}
      />
      <FilterChip
        label="Вид работ"
        options={workTypeOpts}
        selected={state.workType}
        onToggle={(v) => onToggle('workType', v)}
        onClear={() => onClearKey('workType')}
      />
      <FilterChip
        label="Категория"
        options={categoryOpts}
        selected={state.category}
        onToggle={(v) => onToggle('category', v)}
        onClear={() => onClearKey('category')}
      />
      <FilterChip
        label="Статус"
        options={statusOpts}
        selected={state.status}
        onToggle={(v) => onToggle('status', v)}
        onClear={() => onClearKey('status')}
      />
      {isManager && (
        <FilterChip
          label="Сотрудник"
          options={employeeOpts}
          selected={state.employee}
          onToggle={(v) => onToggle('employee', v)}
          onClear={() => onClearKey('employee')}
        />
      )}
      {activeCount > 0 && (
        <button
          onClick={onClearAll}
          style={{
            marginLeft: 'auto',
            height: 28,
            padding: '0 10px',
            fontSize: 12,
            border: 'none',
            borderRadius: 7,
            background: 'transparent',
            color: T.textMuted,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Сбросить всё ✕
        </button>
      )}
    </div>
  );
};
