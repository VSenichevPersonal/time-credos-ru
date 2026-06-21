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
import type {
  AbsenceCtx,
  BookingCtx,
  PlanRollupCtx,
  PlanSpread,
} from 'src/front-components/capacity/calc-load';
import type { PreviewSource } from 'src/front-components/capacity/plan-preview';
import type {
  CapProject,
  CellMetric,
  DeptPlan,
  DeptRef,
  EmployeeRef,
  LoadCell,
  Period,
  PlanSlot,
  ProjectDeptShare,
  ProjectPatch,
} from 'src/front-components/capacity/types';

type DeptProps = {
  departments: DeptRef[];
  cellsByDept: Map<string, LoadCell[]>;
  deptById: Map<string, DeptRef>;
  projects: CapProject[];
  deptPlans: DeptPlan[];
  periods: Period[];
  absenceCtx?: AbsenceCtx;
  sharesByProject?: Map<string, ProjectDeptShare[]>;
  slotsByProject?: Map<string, PlanSlot[]>;
  bookingCtx?: BookingCtx;
  spread?: PlanSpread;
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
  deptById,
  projects,
  deptPlans,
  periods,
  absenceCtx,
  sharesByProject,
  slotsByProject,
  bookingCtx,
  spread,
  nameWidth,
  metric,
  expanded,
  onToggle,
  planning,
  onSavePlan,
  onSaveDeptPlan,
}: DeptProps) => {
  // WI-48 W3B.18/22: пакет данных доски для превью vs СВОБОДНОЙ ёмкости (все
  // отделы + занятость др.проектами/планами/бронями + доли). Панель плана
  // резолвит из него ctx под конкретный проект. horizonEnd — из spread (W3B.23).
  const previewSource: PreviewSource = {
    depts: departments,
    projects,
    deptPlans,
    sharesByProject,
    absenceCtx,
    bookingCtx,
    horizonEnd: spread?.horizonEnd,
  };
  return (
  <>
    {departments.map((dept) => {
      // REQ-0012: ячейки отдела учитывают план без проекта (deptPlans).
      // REQ-0004 C: + слой брони (bookingCtx).
      const cells = cellsByDept.get(dept.id) ?? deptLoadCells(dept, projects, periods, deptPlans, absenceCtx, sharesByProject, bookingCtx, spread, slotsByProject);
      const isOpen = expanded.has(dept.id);
      const detail = isOpen ? deptProjectLoads(dept, projects, periods, sharesByProject, spread) : null;
      const planRows = isOpen ? deptPlanLoads(dept, deptPlans, periods, spread) : null;
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
              sharesByProject={sharesByProject}
              spread={spread}
              deptById={deptById}
              metric={metric}
              deptCells={cells}
              currentDeptId={dept.id}
              dept={dept}
              previewSource={previewSource}
            />
          )}
        </div>
      );
    })}
  </>
  );
};

type EmpProps = {
  employees: EmployeeRef[];
  deptById: Map<string, DeptRef>;
  projects: CapProject[];
  deptPlans: DeptPlan[];
  periods: Period[];
  absenceCtx?: AbsenceCtx;
  sharesByProject?: Map<string, ProjectDeptShare[]>;
  slotsByProject?: Map<string, PlanSlot[]>;
  rollupCtx?: PlanRollupCtx;
  bookingCtx?: BookingCtx;
  spread?: PlanSpread;
  nameWidth: number;
  metric: CellMetric;
  planning?: boolean; // режим планирования → персональный план на строке сотрудника
  onSavedPlan?: () => void; // перезагрузка слотов/доски после сохранения
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
  slotsByProject,
  rollupCtx,
  bookingCtx,
  spread,
  nameWidth,
  metric,
  planning,
  onSavedPlan,
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
        const cells = employeeLoadCells(emp, dept, projects, periods, deptPlans, absenceCtx, sharesByProject, bookingCtx, spread, slotsByProject, rollupCtx);
        return (
          <EmployeeRow
            key={emp.id}
            employee={emp}
            deptCode={dept?.code ?? null}
            cells={cells}
            periods={periods}
            nameWidth={nameWidth}
            metric={metric}
            planning={planning}
            projects={projects}
            onSavedPlan={onSavedPlan}
          />
        );
      })}
    </>
  );
};
