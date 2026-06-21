import { useState } from 'react';

import { T, fmtUtil, fmtHrs, fmtUnder, underTone, utilTone } from 'src/front-components/reports/report-tokens';
import { Bar } from 'src/front-components/reports/bar';
import { CategoryBar, CategoryChip, CategoryLegend } from 'src/front-components/reports/category-bar';
import { Explainable, type ExplainPart } from 'src/front-components/shared/explainable';
import { categoryMeta } from 'src/front-components/shared/category-meta';
import { useSortable } from 'src/front-components/shared/use-sortable';
import { SortHeader } from 'src/front-components/shared/sort-header';
import { departmentLabel } from 'src/constants/labels';
import type { GroupBy, ProjectRow, ReportRow } from 'src/front-components/reports/report-types';

type SortKey = 'name' | 'fact' | 'metric' | 'tail';

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

type Props = {
  groupBy: GroupBy;
  rows: ReportRow[];
  // Drill-down (research §3.2): onDrill — провал в дочерний срез. drillable —
  // ключи строк, у которых детализация есть (иначе строка не кликабельна — без
  // мёртвых кликов). Не задан onDrill → таблица плоская (виджет «Бюджет» и т.п.).
  onDrill?: (row: ReportRow) => void;
  drillable?: (row: ReportRow) => boolean;
  // OLAP-drill: заголовок колонки имени для произвольной оси (вид работ/категория/
  // группа), когда срез выходит за dept/project/employee. Не задан → по groupBy.
  axisLabel?: string;
  // P2-пресет «Загрузка людей»: начальная сортировка таблицы (по умолчанию 'fact').
  // 'metric' для среза employee = утилизация (desc) — рейтинг загрузки сотрудников.
  defaultSort?: SortKey;
};

export const BreakdownTable = ({ groupBy, rows, onDrill, drillable, axisLabel, defaultSort = 'fact' }: Props) => {
  const isProject = groupBy === 'project';
  const nameHeader = axisLabel ?? (isProject ? 'Проект' : groupBy === 'dept' ? 'Отдел' : 'Сотрудник');
  const maxFact = Math.max(1, ...rows.map((r) => r.fact));
  const { key: sortKey, dir, toggle, sort } = useSortable<SortKey>(defaultSort);
  const [hover, setHover] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const canDrill = (r: ReportRow): boolean =>
    !!onDrill && (drillable ? drillable(r) : true);
  const onRowKey = (r: ReportRow) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onDrill?.(r);
    }
  };

  // DP-0004: сортировка по выбранной колонке (имя/факт/метрика/хвост).
  const sortValue = (r: ReportRow): number | string => {
    const p = r as ProjectRow;
    switch (sortKey) {
      case 'name':
        return rowName(groupBy, r).toLowerCase();
      case 'metric':
        return isProject ? p.plannedEffort ?? -1 : r.util ?? -1;
      case 'tail':
        return isProject
          ? p.plannedEffort != null ? p.plannedEffort - r.fact : -1e9
          : r.under ?? -1e9;
      default:
        return r.fact;
    }
  };
  const sorted = sort(rows, sortValue);

  const present = new Set<string>();
  for (const r of rows) for (const c of r.byCategory ?? []) present.add(c.category);

  if (rows.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: 140,
          height: '100%',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <span aria-hidden style={{ fontSize: 24, lineHeight: 1, color: T.textFaint }}>
          ▦
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>
          Нет данных за период
        </span>
        <span style={{ fontSize: 12, color: T.textMuted, maxWidth: 320, lineHeight: 1.5 }}>
          По этому срезу за выбранный период списаний нет. Смените период или срез группировки.
        </span>
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
          <span style={cell()}>
            <SortHeader label={nameHeader} active={sortKey === 'name'} dir={dir} onSort={() => toggle('name')} />
          </span>
          <span style={cell()}>{isProject ? 'Бюджет' : 'Загрузка'}</span>
          <span style={cell()}>{isProject ? 'Категория' : 'Категории'}</span>
          <span style={cell('right')}>
            <SortHeader label="Факт, ч" align="right" active={sortKey === 'fact'} dir={dir} onSort={() => toggle('fact')} />
          </span>
          <span style={cell('right')}>
            <SortHeader label={isProject ? 'План, ч' : 'Утил.'} align="right" active={sortKey === 'metric'} dir={dir} onSort={() => toggle('metric')} />
          </span>
          <span style={cell('right')}>
            <SortHeader label={isProject ? 'Остаток' : 'Недогруз'} align="right" active={sortKey === 'tail'} dir={dir} onSort={() => toggle('tail')} />
          </span>
        </div>

        {sorted.map((r, i) => {
          const p = r as ProjectRow;
          const rest = isProject && p.plannedEffort ? p.plannedEffort - r.fact : null;
          const under = underTone(r.under);
          const clickable = canDrill(r);
          const isFocus = clickable && focused === r.key;
          const isHover = clickable && (hover === r.key || isFocus);
          return (
            <div
              key={r.key}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              aria-label={clickable ? `${rowTitle(groupBy, r)} — детализация` : undefined}
              onClick={clickable ? () => onDrill?.(r) : undefined}
              onKeyDown={clickable ? onRowKey(r) : undefined}
              onMouseEnter={clickable ? () => setHover(r.key) : undefined}
              onMouseLeave={clickable ? () => setHover(null) : undefined}
              onFocus={clickable ? () => setFocused(r.key) : undefined}
              onBlur={clickable ? () => setFocused(null) : undefined}
              style={{
                display: 'grid',
                gridTemplateColumns: COLS,
                height: 40,
                borderBottom: `1px solid ${T.border}`,
                background: isHover ? T.accentSoft : i % 2 === 1 ? T.rowAlt : 'transparent',
                fontSize: 12.5,
                cursor: clickable ? 'pointer' : 'default',
                transition: 'background 120ms ease, box-shadow 120ms ease',
                outline: 'none',
                // Видимая клавиатурная фокус-рамка (inset, не ломает grid-высоту).
                boxShadow: isFocus ? `inset 0 0 0 2px ${T.accentRing}` : undefined,
              }}
            >
              <span style={{ ...cell(), fontWeight: 500, gap: 6 }} title={rowTitle(groupBy, r)}>
                {rowName(groupBy, r)}
                {clickable && (
                  <span aria-hidden style={{ color: isHover ? T.accent : T.textFaint, fontSize: 11, flexShrink: 0 }}>
                    ›
                  </span>
                )}
              </span>

              <span style={cell()}>
                {isProject ? <BudgetBar planned={p.plannedEffort} fact={r.fact} /> : <Bar value={r.fact} max={r.norm && r.norm > 0 ? r.norm : maxFact} />}
              </span>

              <span style={cell()}>
                {isProject ? (
                  <CategoryChip category={p.category} />
                ) : (
                  <Explainable title="Категории" parts={explainParts(r)} block>
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
