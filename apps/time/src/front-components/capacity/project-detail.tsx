import { T } from 'src/front-components/capacity/cap-tokens';
import { DeptPlanRow } from 'src/front-components/capacity/dept-plan-row';
import { ProjectPlanRow } from 'src/front-components/capacity/project-plan-row';
import type {
  CapProject,
  DeptPlanLoad,
  Period,
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
};

// UX-5: name уже содержит «КОД · Клиент · Название» — показываем как есть.
const title = (p: CapProject): string => p.name;

const cellNum = (v: number): string => (v > 0 ? String(Math.round(v)) : '');

// Режим планирования: единый список редактируемых строк (план + без плана).
const PlanningList = ({
  planned,
  unplanned,
  nameWidth,
  periods,
  onSave,
}: Required<Pick<Props, 'planned' | 'unplanned' | 'nameWidth' | 'periods' | 'onSave'>>) => {
  const projects = [...planned.map((pl) => pl.project), ...unplanned];
  const fieldsWidth = Math.max(280, periods.length * 56);
  if (projects.length === 0) {
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
}: Props) => {
  if (planning && onSave) {
    return (
      <PlanningList
        planned={planned}
        unplanned={unplanned}
        nameWidth={nameWidth}
        periods={periods}
        onSave={onSave}
      />
    );
  }

  return (
    <div style={{ background: T.rowAlt }}>
      {planned.map(({ project, perPeriod }) => (
        <div key={project.id} style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }}>
          <div
            style={{
              width: nameWidth,
              minWidth: nameWidth,
              padding: '0 12px 0 28px',
              height: 32,
              display: 'flex',
              alignItems: 'center',
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
            {title(project)}
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
