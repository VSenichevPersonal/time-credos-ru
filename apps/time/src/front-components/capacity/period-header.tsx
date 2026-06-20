import { T } from 'src/front-components/capacity/cap-tokens';
import type { Period } from 'src/front-components/capacity/types';

// Шапка таблицы: угловая ячейка «Отдел» + колонки периодов.

type Props = { periods: Period[]; nameWidth: number };

export const PeriodHeader = ({ periods, nameWidth }: Props) => (
  <div
    style={{
      display: 'flex',
      position: 'sticky',
      top: 0,
      zIndex: 2,
      borderBottom: `1px solid ${T.borderStrong}`,
      background: T.headerBg,
    }}
  >
    <div
      style={{
        width: nameWidth,
        minWidth: nameWidth,
        padding: '0 12px',
        height: 36,
        display: 'flex',
        alignItems: 'center',
        borderRight: `1px solid ${T.border}`,
        background: T.headerBg,
        position: 'sticky',
        left: 0,
        zIndex: 1,
        fontSize: 12,
        fontWeight: 600,
        color: T.textMuted,
      }}
    >
      Отдел
    </div>
    {periods.map((p) => (
      <div
        key={p.key}
        style={{
          flex: 1,
          minWidth: 56,
          height: 36,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: `1px solid ${T.border}`,
          fontSize: 11.5,
          color: T.textMuted,
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        <span>{p.label}</span>
      </div>
    ))}
  </div>
);
