import { DeptRow } from 'src/front-components/capacity/dept-row';
import { EmployeeRow } from 'src/front-components/capacity/employee-row';
import { ProjectDetail } from 'src/front-components/capacity/project-detail';
import {
  deptLoadCells,
  deptProjectLoads,
  employeeLoadCells,
  firstFreePeriod,
} from 'src/front-components/capacity/calc-load';
import type {
  CapProject,
  CellMetric,
  DeptRef,
  EmployeeRef,
  LoadCell,
  Period,
} from 'src/front-components/capacity/types';

type DeptProps = {
  departments: DeptRef[];
  cellsByDept: Map<string, LoadCell[]>;
  projects: CapProject[];
  periods: Period[];
  nameWidth: number;
  metric: CellMetric;
  expanded: Set<string>;
  onToggle: (id: string) => void;
};

// Срез «Отделы»: раскрываемые строки отделов с детализацией проектов.
export const DeptRows = ({
  departments,
  cellsByDept,
  projects,
  periods,
  nameWidth,
  metric,
  expanded,
  onToggle,
}: DeptProps) => (
  <>
    {departments.map((dept) => {
      const cells = cellsByDept.get(dept.id) ?? deptLoadCells(dept, projects, periods);
      const isOpen = expanded.has(dept.id);
      const detail = isOpen ? deptProjectLoads(dept, projects, periods) : null;
      return (
        <div key={dept.id}>
          <DeptRow
            dept={dept}
            cells={cells}
            periods={periods}
            nameWidth={nameWidth}
            metric={metric}
            freeFrom={firstFreePeriod(cells, periods)}
            expanded={isOpen}
            onToggle={() => onToggle(dept.id)}
          />
          {isOpen && detail && (
            <ProjectDetail
              planned={detail.planned}
              unplanned={detail.unplanned}
              periods={periods}
              nameWidth={nameWidth}
            />
          )}
        </div>
      );
    })}
  </>
);

type EmpProps = {
  employees: EmployeeRef[];
  deptById: Map<string, DeptRef>;
  projects: CapProject[];
  periods: Period[];
  nameWidth: number;
  metric: CellMetric;
};

// Срез «Люди»: личная ёмкость сотрудника (календарь × коэф отдела) + доля
// плановых часов отдела. Сортировка по отделу, затем по имени.
export const EmployeeRows = ({
  employees,
  deptById,
  projects,
  periods,
  nameWidth,
  metric,
}: EmpProps) => {
  const sorted = [...employees].sort((a, b) => {
    const da = deptById.get(a.departmentId ?? '')?.code ?? '';
    const db = deptById.get(b.departmentId ?? '')?.code ?? '';
    return da === db ? a.name.localeCompare(b.name, 'ru') : da.localeCompare(db, 'ru');
  });
  return (
    <>
      {sorted.map((emp) => {
        const dept = emp.departmentId ? deptById.get(emp.departmentId) : undefined;
        const cells = employeeLoadCells(emp, dept, projects, periods);
        return (
          <EmployeeRow
            key={emp.id}
            employee={emp}
            deptCode={dept?.code ?? null}
            cells={cells}
            periods={periods}
            nameWidth={nameWidth}
            metric={metric}
          />
        );
      })}
    </>
  );
};
