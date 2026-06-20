import { T, fmtUtil, fmtHrs, fmtUnder, underTone, utilTone } from 'src/front-components/reports/report-tokens';
import { Bar } from 'src/front-components/reports/bar';
import { CategoryBar, CategoryChip, CategoryLegend } from 'src/front-components/reports/category-bar';
import { Explainable, type ExplainPart } from 'src/front-components/shared/explainable';
import { categoryMeta } from 'src/front-components/shared/category-meta';
import { departmentLabel } from 'src/constants/labels';
import type { GroupBy, ProjectRow, ReportRow } from 'src/front-components/reports/report-types';

// Таблица среза. Структура зависит от оси (DP-0003):
//  • Проект (= одна категория) → ЧИП категории + бюджет «факт/план» + остаток.
//  • Отдел/Человек (микс) → бар «факт/норма» + СТЕК категорий (наведение → состав)
//    + утилизация + недогруз.

const COLS = '1fr 120px 150px 72px 70px 88px';

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

// Мини-бар бюджета проекта: заливка = факт/план, терракот при перерасходе.
const BudgetBar = ({ planned, fact }: { planned: number | null; fact: number }) => {
  if (!planned || planned <= 0) return <span style={{ color: T.textFaint, fontSize: 11 }}>нет плана</span>;
  const ratio = fact / planned;
  const over = ratio > 1;
  return (
    <span title={`${fmtHrs(fact)} / ${fmtHrs(planned)} ч`} style={{ width: '100%', height: 8, borderRadius: 8, background: T.headerBg, overflow: 'hidden', display: 'block' }}>
      <span style={{ display: 'block', width: `${Math.min(100, Math.round(ratio * 100))}%`, height: '100%', background: over ? T.over : T.accent }} />
    </span>
  );
};

const explainParts = (r: ReportRow): ExplainPart[] =>
  (r.byCategory ?? []).map((c) => ({
    label: categoryMeta(c.category).label,
    value: `${fmtHrs(c.hours)} ч`,
    share: c.share ?? undefined,
    color: categoryMeta(c.category).solid,
  }));

const rowName = (groupBy: GroupBy, r: ReportRow): string =>
  groupBy === 'dept' ? departmentLabel(r.name, { short: true }) || r.name : r.name;
const rowTitle = (groupBy: GroupBy, r: ReportRow): string =>
  groupBy === 'dept' ? departmentLabel(r.name) || r.name : r.name;

type Props = { groupBy: GroupBy; rows: ReportRow[] };

export const BreakdownTable = ({ groupBy, rows }: Props) => {
  const isProject = groupBy === 'project';
  const maxFact = Math.max(1, ...rows.map((r) => r.fact));

  const present = new Set<string>();
  for (const r of rows) for (const c of r.byCategory ?? []) present.add(c.category);

  if (rows.length === 0) {
    return (
      <div style={{ padding: 24, fontSize: 13, color: T.textMuted, textAlign: 'center' }}>
        За период нет данных по этому срезу.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
          <span style={cell()}>{isProject ? 'Проект' : groupBy === 'dept' ? 'Отдел' : 'Сотрудник'}</span>
          <span style={cell()}>{isProject ? 'Бюджет' : 'Загрузка'}</span>
          <span style={cell()}>{isProject ? 'Категория' : 'Категории'}</span>
          <span style={cell('right')}>Факт, ч</span>
          <span style={cell('right')}>{isProject ? 'План, ч' : 'Утил.'}</span>
          <span style={cell('right')}>{isProject ? 'Остаток' : 'Недогруз'}</span>
        </div>

        {rows.map((r, i) => {
          const p = r as ProjectRow;
          const rest = isProject && p.plannedEffort ? p.plannedEffort - r.fact : null;
          const under = underTone(r.under);
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
                {isProject ? <BudgetBar planned={p.plannedEffort} fact={r.fact} /> : <Bar value={r.fact} max={r.norm && r.norm > 0 ? r.norm : maxFact} />}
              </span>

              <span style={cell()}>
                {isProject ? (
                  <CategoryChip category={p.category} />
                ) : (
                  <Explainable title="Категории" parts={explainParts(r)}>
                    <CategoryBar parts={r.byCategory ?? []} />
                  </Explainable>
                )}
              </span>

              <span style={{ ...cell('right'), fontWeight: 600 }}>{fmtHrs(r.fact)}</span>

              <span style={{ ...cell('right'), color: isProject ? T.textMuted : utilTone(r.util) }}>
                {isProject ? (p.plannedEffort ? fmtHrs(p.plannedEffort) : '—') : fmtUtil(r.util)}
              </span>

              {isProject ? (
                <span style={{ ...cell('right'), fontWeight: 500, color: rest === null ? T.textFaint : rest < 0 ? T.over : T.ok }}>
                  {rest === null ? '—' : rest < 0 ? `−${fmtHrs(-rest)}` : `+${fmtHrs(rest)}`}
                </span>
              ) : (
                <span style={{ ...cell('right'), color: under.fg, background: under.bg, borderRadius: 6, fontWeight: 500 }}>
                  {fmtUnder(r.under)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {!isProject && <CategoryLegend present={present} />}
    </div>
  );
};
