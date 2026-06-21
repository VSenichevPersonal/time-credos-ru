import { T } from 'src/front-components/capacity/cap-tokens';
import { DeptPlanRow } from 'src/front-components/capacity/dept-plan-row';
import { ProjectPlanRow } from 'src/front-components/capacity/project-plan-row';
import { PlannedProjectRow } from 'src/front-components/capacity/planned-project-row';
import type { PlanSpread } from 'src/front-components/capacity/calc-load';
import type {
  CapProject,
  CellMetric,
  DeptPlan,
  DeptPlanLoad,
  DeptRef,
  LoadCell,
  Period,
  ProjectDeptShare,
  ProjectLoad,
  ProjectPatch,
} from 'src/front-components/capacity/types';

// Раскрытие отдела (режим «Детализация»): проекты, формирующие загрузку, с их
// вкладом по периодам, и секция «без плана» (риск недоучёта).
// В режиме планирования (planning) строки становятся редактируемыми: руководитель
// задаёт plannedEffort/endDate, загрузка пересчитывается на лету.

type Props = {
  planned: ProjectLoad[];
  unplanned: CapProject[];
  deptPlans?: DeptPlanLoad[]; // REQ-0012: плановая загрузка отдела без проекта
  periods: Period[];
  nameWidth: number;
  planning?: boolean;
  onSave?: (id: string, patch: ProjectPatch) => Promise<boolean>;
  onSaveDeptPlan?: (id: string, patch: ProjectPatch) => Promise<boolean>; // REQ-0012
  // Drill 3-й уровень: проект → доли по отделам (мульти-отдел REQ-0013 13b).
  sharesByProject?: Map<string, ProjectDeptShare[]>;
  spread?: PlanSpread; // WI-05: раскид доли по рабочим дням в breakdown
  deptById?: Map<string, DeptRef>;
  // Метрика и ёмкость отдела — чтобы детализация следовала переключателю
  // (Загрузка % = доля от ёмкости), а не показывала всегда часы. currentDeptId —
  // какой отдел сейчас раскрыт (подсветка его доли в мульти-отдел breakdown).
  metric?: CellMetric;
  deptCells?: LoadCell[];
  currentDeptId?: string;
};

// План отдела без проекта → форма проекта (те же поля plannedEffort/start/end).
const planAsProject = (p: DeptPlan): CapProject => ({
  id: p.id,
  code: null,
  name: p.label || 'Без проекта',
  departmentId: p.departmentId,
  plannedEffort: p.plannedEffort,
  startDate: p.startDate,
  endDate: p.endDate,
});

// Режим планирования: редактируемые строки проектов + (REQ-0012) планы без проекта.
const PlanningList = ({
  planned,
  unplanned,
  deptPlans,
  nameWidth,
  periods,
  onSave,
  onSaveDeptPlan,
}: Required<Pick<Props, 'planned' | 'unplanned' | 'nameWidth' | 'periods' | 'onSave'>> & {
  deptPlans: DeptPlanLoad[];
  onSaveDeptPlan?: Props['onSaveDeptPlan'];
}) => {
  const projects = [...planned.map((pl) => pl.project), ...unplanned];
  const fieldsWidth = Math.max(360, periods.length * 56);
  if (projects.length === 0 && deptPlans.length === 0) {
    return (
      <div style={{ padding: '6px 12px 6px 28px', fontSize: 11.5, color: T.textFaint, background: T.rowAlt }}>
        Нет проектов отдела для планирования
      </div>
    );
  }
  return (
    <div style={{ background: T.rowAlt }}>
      {projects.map((project) => (
        <ProjectPlanRow
          key={project.id}
          project={project}
          nameWidth={nameWidth}
          fieldsWidth={fieldsWidth}
          onSave={onSave}
        />
      ))}
      {deptPlans.length > 0 && onSaveDeptPlan && (
        <>
          <div style={{ padding: '6px 12px 4px 28px', fontSize: 11, fontWeight: 600, color: T.textMuted, background: T.rowAlt }}>
            Без проекта (резерв / бронь)
          </div>
          {deptPlans.map((load) => (
            <ProjectPlanRow
              key={load.plan.id}
              project={planAsProject(load.plan)}
              nameWidth={nameWidth}
              fieldsWidth={fieldsWidth}
              onSave={onSaveDeptPlan}
            />
          ))}
        </>
      )}
    </div>
  );
};

export const ProjectDetail = ({
  planned,
  unplanned,
  deptPlans = [],
  periods,
  nameWidth,
  planning,
  onSave,
  onSaveDeptPlan,
  sharesByProject,
  spread,
  deptById,
  metric = 'plan',
  deptCells,
  currentDeptId,
}: Props) => {
  if (planning && onSave) {
    return (
      <PlanningList
        planned={planned}
        unplanned={unplanned}
        deptPlans={deptPlans}
        nameWidth={nameWidth}
        periods={periods}
        onSave={onSave}
        onSaveDeptPlan={onSaveDeptPlan}
      />
    );
  }

  return (
    <div style={{ background: T.rowAlt }}>
      {planned.map((load) => (
        <PlannedProjectRow
          key={load.project.id}
          load={load}
          periods={periods}
          nameWidth={nameWidth}
          sharesByProject={sharesByProject}
          spread={spread}
          deptById={deptById}
          metric={metric}
          deptCells={deptCells}
          currentDeptId={currentDeptId}
        />
      ))}

      {deptPlans.map((load) => (
        <DeptPlanRow
          key={load.plan.id}
          load={load}
          nameWidth={nameWidth}
          periods={periods}
          metric={metric}
          deptCells={deptCells}
        />
      ))}

      {unplanned.length > 0 && (
        <div
          style={{
            padding: '6px 12px 6px 28px',
            fontSize: 11.5,
            color: T.textFaint,
            borderBottom: `1px solid ${T.border}`,
            background: T.rowAlt,
          }}
        >
          Без плана ({unplanned.length}): {unplanned.map((p) => p.code ?? p.name).join(', ')}
        </div>
      )}

      {planned.length === 0 && unplanned.length === 0 && deptPlans.length === 0 && (
        <div
          style={{
            padding: '6px 12px 6px 28px',
            fontSize: 11.5,
            color: T.textFaint,
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          Нет проектов в горизонте
        </div>
      )}
    </div>
  );
};
