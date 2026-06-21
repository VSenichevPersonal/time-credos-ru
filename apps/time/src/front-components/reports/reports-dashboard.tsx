import { useState } from 'react';

import { T, FONT } from 'src/front-components/reports/report-tokens';
import { Center } from 'src/front-components/grid/center';
import { Segmented } from 'src/front-components/capacity/mode-switcher';
import { KpiCards } from 'src/front-components/reports/kpi-cards';
import { BreakdownTable } from 'src/front-components/reports/breakdown-table';
import { usePeriod, type PeriodGran } from 'src/front-components/reports/use-period';
import { useReports } from 'src/front-components/reports/use-reports';
import { FilterChip, type Option } from 'src/front-components/grid/filter-chip';
import { WORK_CATEGORY_OPTIONS } from 'src/constants/select-options';
import type { GroupBy, ProjectRow, ReportRow } from 'src/front-components/reports/report-types';
import { ErrorBoundary } from 'src/front-components/shared/error-boundary';
import { ErrorState } from 'src/front-components/shared/error-state';
import { useDrill, type DrillLevel } from 'src/front-components/shared/use-drill';
import { TrendView, type DeptOption } from 'src/front-components/reports/trend-view';
import { MissingView } from 'src/front-components/reports/missing-view';
import { useOlap } from 'src/front-components/reports/use-olap';
import { DrillView } from 'src/front-components/reports/drill-view';
import { dimLabel, nextAxis, valueLabel } from 'src/front-components/reports/drill-axis';
import type { OlapDim, OlapFilter, OlapRow } from 'src/front-components/reports/olap-types';
import { ExportCsvButton } from 'src/front-components/reports/export-csv';
import { scopeKpiTotals } from 'src/front-components/reports/kpi-scope';
import type { DetailFilters } from 'src/front-components/reports/reports-rest';
import { departmentLabel } from 'src/constants/labels';

// Все оси (кроме stage — нет справочника этапов на фронте). Для первого провала из
// легаси-строки корня (у неё нет drillable) считаем следующую ось из полного набора.
const ALL_DIMS: OlapDim[] = ['dept', 'project', 'employee', 'category', 'workTypeGroup', 'workType'];

const CATEGORY_OPTS: Option[] = WORK_CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

// Верхний режим дашборда: сводка (срезы/период), тренд (помесячная динамика) или
// незаполненные (статус заполнения таймшита за текущую неделю — руководителю).
type View = 'summary' | 'trend' | 'missing';

// Дашборд «Отчёты»: утилизация + загрузка/недогруз по периоду и срезу
// (отдел/проект/человек). Данные — /s/reports. Светлая тема, тинт-нейтрали.

const NavBtn = ({
  ariaLabel,
  glyph,
  disabled,
  onClick,
}: {
  ariaLabel: string;
  glyph: string;
  disabled: boolean;
  onClick?: () => void;
}) => {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  return (
    <button
      aria-label={ariaLabel}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        width: 28,
        height: 28,
        border: `1px solid ${!disabled && (hover || focus) ? T.accentRing : T.border}`,
        borderRadius: 7,
        background: !disabled && hover ? T.accentSoft : T.surface,
        color: disabled ? T.textFaint : hover || focus ? T.accent : T.textMuted,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit',
        fontSize: 14,
        outline: 'none',
        boxShadow: !disabled && focus ? `0 0 0 2px ${T.accentRing}` : undefined,
        transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease, box-shadow 120ms ease',
      }}
    >
      {glyph}
    </button>
  );
};

const PeriodNav = ({
  label,
  isCurrent,
  onPrev,
  onNext,
}: {
  label: string;
  isCurrent: boolean;
  onPrev: () => void;
  onNext: () => void;
}) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    <NavBtn ariaLabel="Предыдущий период" glyph="‹" disabled={false} onClick={onPrev} />
    <span
      style={{
        minWidth: 130,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 600,
        color: T.text,
      }}
    >
      {label}
    </span>
    <NavBtn ariaLabel="Следующий период" glyph="›" disabled={isCurrent} onClick={onNext} />
  </span>
);

const pickRows = (
  groupBy: GroupBy,
  data: ReturnType<typeof useReports>['data'],
): ReportRow[] => {
  if (!data) return [];
  // `?? []` — защита от ответа без 3-срезовых массивов (напр. OLAP-форма):
  // BreakdownTable делает rows.map, undefined уронил бы виджет.
  if (groupBy === 'project') return data.byProject ?? [];
  if (groupBy === 'employee') return data.byEmployee ?? [];
  return data.byDept ?? [];
};

export const ReportsDashboard = () => {
  const [view, setView] = useState<View>('summary');
  const { period, gran, isCurrent, prev, next, setGran } = usePeriod();
  const [groupBy, setGroupBy] = useState<GroupBy>('dept');
  const [catFilter, setCatFilter] = useState<Set<string>>(new Set());
  const { stack, drillInto, goToLevel, reset } = useDrill();
  // Корень: 3-срезовый ответ (KPI + норма/утил по периоду). Backend не дёргаем
  // на корне за drill. Drill (stack>0) → параметрический OLAP-срез (ниже).
  const { loading, error, data, reload } = useReports(period.from, period.to, groupBy);

  const rootAxis = groupBy as OlapDim; // GroupBy ⊂ OlapDim (dept/project/employee)
  const drilled = stack.length > 0;
  // Накопленные cross-filter (AND) = весь путь drill. childAxis последнего уровня
  // = ось дочернего среза, которую сейчас показываем.
  const olapFilters: OlapFilter[] = stack.map((l) => ({ dim: l.dim as OlapDim, value: l.value }));
  const childAxis = (stack[stack.length - 1]?.childAxis as OlapDim | undefined) ?? rootAxis;
  const { loading: olapLoading, error: olapError, data: olapData, reload: reloadOlap } = useOlap(
    period.from,
    period.to,
    childAxis,
    olapFilters,
    drilled,
  );

  const switchGroupBy = (g: GroupBy) => {
    reset();
    setGroupBy(g);
  };
  const onPeriodChange = (fn: () => void) => () => {
    reset();
    fn();
  };

  // DP-0004 P1: фильтр по категории — осмыслен в срезе «Проекты» (проект = 1 категория).
  const toggleCat = (v: string) =>
    setCatFilter((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  const filterRows = (rows: ReportRow[]): ReportRow[] =>
    groupBy === 'project' && catFilter.size > 0
      ? rows.filter((r) => catFilter.has((r as ProjectRow).category ?? ''))
      : rows;

  // --- Drill-down (полный, через OLAP-бэкенд) ---
  // Провал строки: следующая ось из drillable строки (OLAP-строки несут drillable;
  // легаси-строки корня — нет, fallback набор). Накапливаем фильтр {ось: ключ}.
  const drillRow = (fromAxis: OlapDim, fallbackDims: OlapDim[]) => (r: ReportRow) => {
    const dims = (r as OlapRow).drillable ?? fallbackDims;
    const child = nextAxis(fromAxis, dims);
    if (!child) return; // тупик — без мёртвых кликов
    const lbl = valueLabel(fromAxis, r.key, r.name);
    const level: DrillLevel = {
      dim: fromAxis,
      value: r.key,
      label: `${dimLabel(fromAxis)}: ${lbl}`,
      valueLabel: lbl,
      childAxis: child,
    };
    drillInto(level);
  };
  // Кликабельность: есть ли куда проваливаться. Корень (легаси-строки) — по полному
  // набору осей; OLAP-строки — по их drillable.
  const rootDrillable = (): boolean => nextAxis(rootAxis, ALL_DIMS) !== null;
  const olapRowDrillable = (r: ReportRow): boolean =>
    nextAxis(childAxis, (r as OlapRow).drillable ?? []) !== null;

  // F-F (REQ-0006): фильтры для экспорта detail-CSV = накопленный путь drill,
  // спроецированный на оси deptId/projectId/employeeId (бэк-контракт detail).
  // Без drill — пустые фильтры (весь период). Остальные оси (category/workType)
  // в detail-фильтре не участвуют — экспорт сужается до этих трёх измерений.
  const exportFilters: DetailFilters = {};
  for (const f of olapFilters) {
    if (f.dim === 'dept') exportFilters.deptId = f.value;
    else if (f.dim === 'project') exportFilters.projectId = f.value;
    else if (f.dim === 'employee') exportFilters.employeeId = f.value;
  }

  // KPI-карточки отражают ТЕКУЩИЙ скоуп дрилла. Корень — глобал (data.totals).
  // Drill — Итого OLAP-среза по накопленным filters[] (scopeKpiTotals: scoped
  // fact/client/util из olap totals + норма реконструирована из строк среза).
  const scopedTotals: ReportRow =
    drilled && olapData ? scopeKpiTotals(olapData.totals, olapData.rows) : data.totals;
  // Подпись скоупа для карточек: путь дрилла (ось: значение › …). Пусто на корне.
  const kpiScope = drilled
    ? stack.map((l) => `${dimLabel(l.dim as OlapDim)}: ${l.valueLabel ?? l.label}`).join(' › ')
    : undefined;

  // Опции отдела для фильтра тренда: byDept[].key = id отдела, name = код.
  // Тренд шлёт departmentId (id), пользователь видит русское название отдела.
  const deptOptions: DeptOption[] = (data?.byDept ?? []).map((d) => ({
    id: d.key,
    label: departmentLabel(d.name, { short: true }) || d.name,
  }));

  return (
    <div
      style={{
        position: 'relative', // якорь для поповера экспорта CSV
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: T.bg,
        fontFamily: FONT,
        color: T.text,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          borderBottom: `1px solid ${T.border}`,
          background: T.panelBg,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600 }}>Отчёты</span>
        <Segmented
          ariaLabel="Режим отчёта"
          value={view}
          segments={[
            { value: 'summary', label: 'Сводка' },
            { value: 'trend', label: 'Тренд' },
            { value: 'missing', label: 'Незаполненные' },
          ]}
          onChange={(v: View) => setView(v)}
        />
        {view === 'summary' && (
          <>
            <PeriodNav label={period.label} isCurrent={isCurrent} onPrev={onPeriodChange(prev)} onNext={onPeriodChange(next)} />
            <Segmented
              ariaLabel="Гранулярность периода"
              value={gran}
              segments={[
                { value: 'month', label: 'Месяц' },
                { value: 'quarter', label: 'Квартал' },
                { value: 'year', label: 'Год' },
              ]}
              onChange={(g: PeriodGran) => {
                reset();
                setGran(g);
              }}
            />
            {groupBy === 'project' && (
              <FilterChip
                label="Категория"
                options={CATEGORY_OPTS}
                selected={catFilter}
                onToggle={toggleCat}
                onClear={() => setCatFilter(new Set())}
              />
            )}
            <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <Segmented
                ariaLabel="Срез группировки"
                value={groupBy}
                segments={[
                  { value: 'dept', label: 'Отдел' },
                  { value: 'project', label: 'Проект' },
                  { value: 'employee', label: 'Человек' },
                ]}
                onChange={(g: GroupBy) => switchGroupBy(g)}
              />
              <ExportCsvButton from={period.from} to={period.to} filters={exportFilters} disabled={loading} />
            </span>
          </>
        )}
      </div>

      {view === 'missing' ? (
        <ErrorBoundary title="Не удалось показать раздел">
          <MissingView />
        </ErrorBoundary>
      ) : view === 'trend' ? (
        <TrendView deptOptions={deptOptions} />
      ) : error ? (
        <ErrorState title="Не удалось загрузить отчёт" detail={error} onRetry={reload} />
      ) : loading || !data ? (
        <Center>Загрузка отчёта…</Center>
      ) : (
        <ErrorBoundary
          title="Не удалось показать отчёт"
          resetKeys={[groupBy, period.from, period.to, stack.length]}
        >
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <KpiCards totals={scopedTotals} scope={kpiScope} />
            {!drilled ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  margin: '0 14px 14px',
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: T.surface,
                }}
              >
                <BreakdownTable
                  groupBy={groupBy}
                  rows={filterRows(pickRows(groupBy, data))}
                  onDrill={rootDrillable() ? drillRow(rootAxis, ALL_DIMS) : undefined}
                  drillable={rootDrillable() ? () => true : undefined}
                />
              </div>
            ) : (
              <DrillView
                rootAxis={rootAxis}
                childAxis={childAxis}
                stack={stack}
                loading={olapLoading}
                error={olapError}
                data={olapData}
                onReload={reloadOlap}
                onDrillRow={drillRow(childAxis, ALL_DIMS)}
                rowDrillable={olapRowDrillable}
                onRoot={reset}
                onLevel={goToLevel}
              />
            )}
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
};
