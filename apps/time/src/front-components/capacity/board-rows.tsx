import { DeptRow } from 'src/front-components/capacity/dept-row';
import { EmployeeRow } from 'src/front-components/capacity/employee-row';
import { ProjectDetail } from 'src/front-components/capacity/project-detail';
import {
  deptLoadCells,
  deptPlanLoads,
  deptProjectLoads,
  employeeLoadCells,
  firstFreePeriod,
} from 'src/front-components/capacity/calc-load';
import type { AbsenceCtx } from 'src/front-components/capacity/calc-load';
import type {
  CapProject,
  CellMetric,
  DeptPlan,
  DeptRef,
  EmployeeRef,
  LoadCell,
  Period,
  ProjectDeptShare,
  ProjectPatch,
} from 'src/front-components/capacity/types';

type DeptProps = {
  departments: DeptRef[];
  cellsByDept: Map<string, LoadCell[]>;
  projects: CapProject[];
  deptPlans: DeptPlan[];
  periods: Period[];
  absenceCtx?: AbsenceCtx;
  sharesByProject?: Map<string, ProjectDeptShare[]>;
  nameWidth: number;
  metric: CellMetric;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  planning?: boolean;
  onSavePlan?: (id: string, patch: ProjectPatch) => Promise<boolean>;
  onSaveDeptPlan?: (id: string, patch: ProjectPatch) => Promise<boolean>;
};

// Срез «Отделы»: раскрываемые строки отделов с детализацией проектов.
export const DeptRows = ({
  departments,
  cellsByDept,
  projects,
  deptPlans,
  periods,
  absenceCtx,
  sharesByProject,
  nameWidth,
  metric,
  expanded,
  onToggle,
  planning,
  onSavePlan,
  onSaveDeptPlan,
}: DeptProps) => (
  <>
    {departments.map((dept) => {
      // REQ-0012: ячейки отдела учитывают план без проекта (deptPlans).
      const cells = cellsByDept.get(dept.id) ?? deptLoadCells(dept, projects, periods, deptPlans, absenceCtx, sharesByProject);
      const isOpen = expanded.has(dept.id);
      const detail = isOpen ? deptProjectLoads(dept, projects, periods, sharesByProject) : null;
      const planRows = isOpen ? deptPlanLoads(dept, deptPlans, periods) : null;
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
              deptPlans={planRows ?? []}
              periods={periods}
              nameWidth={nameWidth}
              planning={planning}
              onSave={onSavePlan}
              onSaveDeptPlan={onSaveDeptPlan}
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
  deptPlans: DeptPlan[];
  periods: Period[];
  absenceCtx?: AbsenceCtx;
  sharesByProject?: Map<string, ProjectDeptShare[]>;
  nameWidth: number;
  metric: CellMetric;
};

// Срез «Люди»: личная ёмкость сотрудника (календарь × коэф отдела) + доля
// плановых часов отдела (проекты + план без проекта REQ-0012). Сортировка по
// отделу, затем по имени.
export const EmployeeRows = ({
  employees,
  deptById,
  projects,
  deptPlans,
  periods,
  absenceCtx,
  sharesByProject,
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
        const cells = employeeLoadCells(emp, dept, projects, periods, deptPlans, absenceCtx, sharesByProject);
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
