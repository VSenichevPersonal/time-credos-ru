import { useState } from 'react';

import { T, FONT } from 'src/front-components/reports/report-tokens';
import { Center } from 'src/front-components/grid/center';
import { Segmented } from 'src/front-components/capacity/mode-switcher';
import { KpiCards } from 'src/front-components/reports/kpi-cards';
import { BreakdownTable } from 'src/front-components/reports/breakdown-table';
import { usePeriod, type PeriodGran } from 'src/front-components/reports/use-period';
import { useReports } from 'src/front-components/reports/use-reports';
import type { GroupBy, ReportRow } from 'src/front-components/reports/report-types';

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
  const { period, gran, isCurrent, prev, next, setGran } = usePeriod();
  const [groupBy, setGroupBy] = useState<GroupBy>('dept');
  const { loading, error, data } = useReports(period.from, period.to, groupBy);

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
        <PeriodNav label={period.label} isCurrent={isCurrent} onPrev={prev} onNext={next} />
        <Segmented
          ariaLabel="Гранулярность периода"
          value={gran}
          segments={[
            { value: 'month', label: 'Месяц' },
            { value: 'quarter', label: 'Квартал' },
            { value: 'year', label: 'Год' },
          ]}
          onChange={(g: PeriodGran) => setGran(g)}
        />
        <span style={{ marginLeft: 'auto' }}>
          <Segmented
            ariaLabel="Срез группировки"
            value={groupBy}
            segments={[
              { value: 'dept', label: 'Отдел' },
              { value: 'project', label: 'Проект' },
              { value: 'employee', label: 'Человек' },
            ]}
            onChange={(g: GroupBy) => setGroupBy(g)}
          />
        </span>
      </div>

      {error ? (
        <Center>Не удалось загрузить отчёт: {error}</Center>
      ) : loading || !data ? (
        <Center>Загрузка отчёта…</Center>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <KpiCards totals={data.totals} />
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
            <BreakdownTable groupBy={groupBy} rows={pickRows(groupBy, data)} />
          </div>
        </div>
      )}
    </div>
  );
};
