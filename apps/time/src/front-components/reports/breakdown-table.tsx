import { T } from 'src/front-components/reports/report-tokens';
import {
  fmtUtil,
  fmtHrs,
  fmtUnder,
  underTone,
  utilTone,
} from 'src/front-components/reports/report-tokens';
import { Bar } from 'src/front-components/reports/bar';
import { departmentLabel } from 'src/constants/labels';
import type { GroupBy, ReportRow } from 'src/front-components/reports/report-types';

// Таблица среза (отдел/проект/человек): имя · бар загрузки · факт · утил · недогруз.
// Для проектов нормы нет → бар = факт относительно макс. факта строк (визуальный масштаб).

const COLS = '1fr 120px 72px 64px 84px';

const cell = (align: 'left' | 'right' = 'left') =>
  ({
    padding: '0 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums' as const,
  }) as const;

// Имя строки: для отдела показываем русскую аббревиатуру по коду.
const rowName = (groupBy: GroupBy, r: ReportRow): string =>
  groupBy === 'dept' ? departmentLabel(r.name, { short: true }) || r.name : r.name;

const rowTitle = (groupBy: GroupBy, r: ReportRow): string =>
  groupBy === 'dept' ? departmentLabel(r.name) || r.name : r.name;

type Props = {
  groupBy: GroupBy;
  rows: ReportRow[];
};

export const BreakdownTable = ({ groupBy, rows }: Props) => {
  // Масштаб бара: для отдела/человека — норма строки; для проекта — макс факт.
  const maxFact = Math.max(1, ...rows.map((r) => r.fact));

  if (rows.length === 0) {
    return (
      <div style={{ padding: 24, fontSize: 13, color: T.textMuted, textAlign: 'center' }}>
        За период нет данных по этому срезу.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: COLS,
          height: 32,
          position: 'sticky',
          top: 0,
          background: T.headerBg,
          borderBottom: `1px solid ${T.borderStrong}`,
          fontSize: 11.5,
          fontWeight: 600,
          color: T.textMuted,
          zIndex: 1,
        }}
      >
        <span style={cell()}>
          {groupBy === 'dept' ? 'Отдел' : groupBy === 'project' ? 'Проект' : 'Сотрудник'}
        </span>
        <span style={cell()}>Загрузка</span>
        <span style={cell('right')}>Факт, ч</span>
        <span style={cell('right')}>Утил.</span>
        <span style={cell('right')}>Недогруз</span>
      </div>

      {rows.map((r, i) => {
        const under = underTone(r.under);
        const barMax = r.norm && r.norm > 0 ? r.norm : maxFact;
        return (
          <div
            key={r.key}
            style={{
              display: 'grid',
              gridTemplateColumns: COLS,
              height: 40,
              borderBottom: `1px solid ${T.border}`,
              background: i % 2 === 1 ? T.rowAlt : 'transparent',
              fontSize: 12.5,
            }}
          >
            <span style={{ ...cell(), fontWeight: 500 }} title={rowTitle(groupBy, r)}>
              {rowName(groupBy, r)}
            </span>
            <span style={cell()}>
              <Bar value={r.fact} max={barMax} />
            </span>
            <span style={{ ...cell('right'), fontWeight: 600 }}>{fmtHrs(r.fact)}</span>
            <span style={{ ...cell('right'), color: utilTone(r.util) }}>{fmtUtil(r.util)}</span>
            <span
              style={{
                ...cell('right'),
                color: under.fg,
                background: under.bg,
                borderRadius: 6,
                fontWeight: 500,
              }}
            >
              {fmtUnder(r.under)}
            </span>
          </div>
        );
      })}
    </div>
  );
};
