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
import type { EmployeeRow, GroupBy, ProjectRow, ReportRow } from 'src/front-components/reports/report-types';
import { ErrorBoundary } from 'src/front-components/shared/error-boundary';
import { ErrorState } from 'src/front-components/shared/error-state';
import { Breadcrumbs } from 'src/front-components/shared/breadcrumbs';
import { useDrill } from 'src/front-components/shared/use-drill';
import { TrendView, type DeptOption } from 'src/front-components/reports/trend-view';
import { departmentLabel } from 'src/constants/labels';

const CATEGORY_OPTS: Option[] = WORK_CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

// Верхний режим дашборда: сводка (срезы/период) или тренд (помесячная динамика).
type View = 'summary' | 'trend';

// Дашборд «Отчёты»: утилизация + загрузка/недогруз по периоду и срезу
// (отдел/проект/человек). Данные — /s/reports. Светлая тема, тинт-нейтрали.

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
}) => {
  const btn = (disabled: boolean) =>
    ({
      width: 28,
      height: 28,
      border: `1px solid ${T.border}`,
      borderRadius: 7,
      background: T.surface,
      color: disabled ? T.textFaint : T.textMuted,
      cursor: disabled ? 'default' : 'pointer',
      fontFamily: 'inherit',
      fontSize: 14,
    }) as const;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <button aria-label="Предыдущий период" onClick={onPrev} style={btn(false)}>
        ‹
      </button>
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
      <button
        aria-label="Следующий период"
        onClick={isCurrent ? undefined : onNext}
        disabled={isCurrent}
        style={btn(isCurrent)}
      >
        ›
      </button>
    </span>
  );
};

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
  // Базовый запрос отдаёт все 3 среза разом — drill «Отдел → Сотрудники»
  // делается client-side (EmployeeRow.dept = код отдела). Backend не дёргаем.
  const { loading, error, data, reload } = useReports(period.from, period.to, groupBy);

  // Drill активен только из среза «Отдел» (в нём строки → сотрудники отдела).
  // Смена среза/периода сбрасывает стек.
  const drilledDept = groupBy === 'dept' && stack.length > 0 ? stack[0].value : null;
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

  // Сотрудники отдела (drill «Отдел → Сотрудники»): EmployeeRow.dept = код отдела
  // (= byDept[].name). Backend-фильтр не нужен — режем уже загруженный byEmployee.
  const employeesOfDept = (dept: string): EmployeeRow[] =>
    (data?.byEmployee ?? []).filter((e) => e.dept === dept);
  // Отдел кликабелен, только если у него есть сотрудники в срезе (без мёртвых кликов).
  const deptHasEmployees = (r: ReportRow): boolean => employeesOfDept(r.name).length > 0;
  const onDrillDept = (r: ReportRow) =>
    drillInto({ dim: 'dept', value: r.name, label: `Отдел: ${departmentLabel(r.name, { short: true }) || r.name}` });

  // Опции отдела для фильтра тренда: byDept[].key = id отдела, name = код.
  // Тренд шлёт departmentId (id), пользователь видит русское название отдела.
  const deptOptions: DeptOption[] = (data?.byDept ?? []).map((d) => ({
    id: d.key,
    label: departmentLabel(d.name, { short: true }) || d.name,
  }));

  return (
    <div
      style={{
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
            <span style={{ marginLeft: 'auto' }}>
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
            </span>
          </>
        )}
      </div>

      {view === 'trend' ? (
        <TrendView deptOptions={deptOptions} />
      ) : error ? (
        <ErrorState title="Не удалось загрузить отчёт" detail={error} onRetry={reload} />
      ) : loading || !data ? (
        <Center>Загрузка отчёта…</Center>
      ) : (
        <ErrorBoundary
          title="Не удалось показать отчёт"
          resetKeys={[groupBy, period.from, period.to, drilledDept ?? '']}
        >
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <KpiCards totals={data.totals} />
            {stack.length > 0 && (
              <div style={{ padding: '0 14px 8px' }}>
                <Breadcrumbs
                  rootLabel="Все отделы"
                  stack={stack}
                  onRoot={reset}
                  onLevel={goToLevel}
                />
              </div>
            )}
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
              {drilledDept ? (
                <BreakdownTable groupBy="employee" rows={employeesOfDept(drilledDept)} />
              ) : (
                <BreakdownTable
                  groupBy={groupBy}
                  rows={filterRows(pickRows(groupBy, data))}
                  onDrill={groupBy === 'dept' ? onDrillDept : undefined}
                  drillable={groupBy === 'dept' ? deptHasEmployees : undefined}
                />
              )}
            </div>
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
};
