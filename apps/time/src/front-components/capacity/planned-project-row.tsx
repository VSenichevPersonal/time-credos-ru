import { useState } from 'react';

import { T } from 'src/front-components/capacity/cap-tokens';
import { projectDeptShareLoads } from 'src/front-components/capacity/calc-load';
import { departmentLabel } from 'src/constants/labels';
import type {
  CapProject,
  DeptRef,
  Period,
  ProjectDeptShare,
  ProjectLoad,
} from 'src/front-components/capacity/types';

// Drill 3-й уровень (заказчик «дрилл-даун полный»): строка проекта в детализации
// отдела раскрывается в доли по ВСЕМ участвующим отделам (мульти-отдел REQ-0013
// 13b). Кликабельна только если у проекта ≥2 отдела (иначе детализировать нечего —
// без мёртвых кликов). Состояние раскрытия локальное (React, без host-DOM/URL).

const title = (p: CapProject): string => p.name; // UX-5: name уже «КОД · Клиент · Название»
const cellNum = (v: number): string => (v > 0 ? String(Math.round(v)) : '');

const deptCrumb = (id: string | null, deptById?: Map<string, DeptRef>): string => {
  const dept = id ? deptById?.get(id) : undefined;
  const code = dept?.code ?? null;
  return code ? departmentLabel(code, { short: true }) || code : 'Без отдела';
};

type Props = {
  load: ProjectLoad;
  periods: Period[];
  nameWidth: number;
  sharesByProject?: Map<string, ProjectDeptShare[]>;
  deptById?: Map<string, DeptRef>;
};

export const PlannedProjectRow = ({ load, periods, nameWidth, sharesByProject, deptById }: Props) => {
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
