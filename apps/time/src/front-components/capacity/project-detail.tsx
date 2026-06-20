import { T } from 'src/front-components/capacity/cap-tokens';
import { DeptPlanRow } from 'src/front-components/capacity/dept-plan-row';
import { ProjectPlanRow } from 'src/front-components/capacity/project-plan-row';
import { PlannedProjectRow } from 'src/front-components/capacity/planned-project-row';
import type {
  CapProject,
  DeptPlan,
  DeptPlanLoad,
  DeptRef,
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
  deptById?: Map<string, DeptRef>;
};

// UX-5: name уже содержит «КОД · Клиент · Название» — показываем как есть.
const title = (p: CapProject): string => p.name;

const cellNum = (v: number): string => (v > 0 ? String(Math.round(v)) : '');

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
  const fieldsWidth = Math.max(280, periods.length * 56);
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

// Drill-строка проекта (read-mode): раскрывается в доли по отделам, если у
// проекта >1 участвующего отдела. Иначе — обычная статичная строка (без мёртвых
// кликов). Состояние раскрытия локальное (React, без host-DOM/URL).
const deptCrumb = (id: string | null, deptById?: Map<string, DeptRef>): string => {
  const dept = id ? deptById?.get(id) : undefined;
  const code = dept?.code ?? null;
  return code ? departmentLabel(code, { short: true }) || code : 'Без отдела';
};

const PlannedProjectRow = ({
  load,
  periods,
  nameWidth,
  sharesByProject,
  deptById,
}: {
  load: ProjectLoad;
  periods: Period[];
  nameWidth: number;
  sharesByProject?: Map<string, ProjectDeptShare[]>;
  deptById?: Map<string, DeptRef>;
}) => {
  const { project, perPeriod } = load;
  const [open, setOpen] = useState(false);
  const breakdown = projectDeptShareLoads(project, periods, sharesByProject);
  const drillable = breakdown.length > 1; // ≥2 отдела — есть что детализировать
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen((v) => !v);
    }
  };
  return (
    <>
      <div
        role={drillable ? 'button' : undefined}
        tabIndex={drillable ? 0 : undefined}
        aria-expanded={drillable ? open : undefined}
        aria-label={drillable ? `${title(project)} — доли по отделам` : undefined}
        onClick={drillable ? () => setOpen((v) => !v) : undefined}
        onKeyDown={drillable ? onKey : undefined}
        style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, cursor: drillable ? 'pointer' : 'default' }}
      >
        <div
          style={{
            width: nameWidth,
            minWidth: nameWidth,
            padding: '0 12px 0 28px',
            height: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            borderRight: `1px solid ${T.border}`,
            background: T.rowAlt,
            fontSize: 12,
            color: T.textMuted,
            position: 'sticky',
            left: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={title(project)}
        >
          {drillable && (
            <span aria-hidden style={{ fontSize: 9, color: T.textFaint, flexShrink: 0 }}>
              {open ? '▾' : '▸'}
            </span>
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{title(project)}</span>
        </div>
        {periods.map((p, i) => (
          <div
            key={p.key}
            style={{
              flex: 1,
              minWidth: 56,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: `1px solid ${T.border}`,
              fontSize: 11.5,
              color: perPeriod[i] > 0 ? T.text : T.textFaint,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {cellNum(perPeriod[i])}
          </div>
        ))}
      </div>
      {open &&
        breakdown.map((b) => (
          <div key={b.departmentId ?? 'none'} style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, background: T.bg }}>
            <div
              style={{
                width: nameWidth,
                minWidth: nameWidth,
                padding: '0 12px 0 44px',
                height: 28,
                display: 'flex',
                alignItems: 'center',
                borderRight: `1px solid ${T.border}`,
                background: T.bg,
                fontSize: 11.5,
                color: T.textFaint,
                position: 'sticky',
                left: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={deptCrumb(b.departmentId, deptById)}
            >
              {deptCrumb(b.departmentId, deptById)}
            </div>
            {periods.map((p, i) => (
              <div
                key={p.key}
                style={{
                  flex: 1,
                  minWidth: 56,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: `1px solid ${T.border}`,
                  fontSize: 11,
                  color: b.perPeriod[i] > 0 ? T.textMuted : T.textFaint,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {cellNum(b.perPeriod[i])}
              </div>
            ))}
          </div>
        ))}
    </>
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
  deptById,
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
          deptById={deptById}
        />
      ))}

      {deptPlans.map((load) => (
        <DeptPlanRow key={load.plan.id} load={load} nameWidth={nameWidth} periods={periods} />
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
