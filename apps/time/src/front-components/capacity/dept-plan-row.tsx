import { T } from 'src/front-components/capacity/cap-tokens';
import type { DeptPlanLoad, Period } from 'src/front-components/capacity/types';

// REQ-0012: строка плановой загрузки отдела БЕЗ проекта в детализации отдела.
// Визуально отличима от проектов — курсив + тег «без проекта», тёплый акцент.
// Часы по периодам — tabular-nums (как у проектов).

const cellNum = (v: number): string => (v > 0 ? String(Math.round(v)) : '');

type Props = {
  load: DeptPlanLoad;
  nameWidth: number;
  periods: Period[];
};

export const DeptPlanRow = ({ load, nameWidth, periods }: Props) => (
  <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }}>
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
        fontStyle: 'italic',
        color: T.textMuted,
        position: 'sticky',
        left: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={`Без проекта · ${load.plan.label}`}
    >
      <span
        style={{
          fontStyle: 'normal',
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: 0.3,
          textTransform: 'uppercase',
          color: T.warnSolid,
          background: T.warnTint,
          padding: '1px 5px',
          borderRadius: 3,
          flexShrink: 0,
        }}
      >
        без проекта
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {load.plan.label}
      </span>
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
          fontStyle: 'italic',
          color: load.perPeriod[i] > 0 ? T.text : T.textFaint,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {cellNum(load.perPeriod[i])}
      </div>
    ))}
  </div>
);
