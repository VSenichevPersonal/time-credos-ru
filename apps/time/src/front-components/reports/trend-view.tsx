import { useState } from 'react';

import { T, fmtUtil, fmtHrs } from 'src/front-components/reports/report-tokens';
import { Center } from 'src/front-components/grid/center';
import { TrendChart } from 'src/front-components/reports/trend-chart';
import { useTrend } from 'src/front-components/reports/use-trend';
import { ErrorBoundary } from 'src/front-components/shared/error-boundary';
import { ErrorState } from 'src/front-components/shared/error-state';

// Раздел «Тренд»: помесячная динамика факт/норма + util % за год.
// Год целиком (янв–дек) + опц. фильтр отдела. Данные — /s/reports mode=timeseries.

export type DeptOption = { id: string; label: string };

type Props = { deptOptions: DeptOption[] };

const yearRange = (year: number) => ({
  from: new Date(Date.UTC(year, 0, 1)).toISOString(),
  to: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)).toISOString(),
});

const NavBtn = ({
  label,
  disabled,
  onClick,
  ariaLabel,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel: string;
}) => (
  <button
    type="button"
    aria-label={ariaLabel}
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    style={{
      width: 28,
      height: 28,
      border: `1px solid ${T.border}`,
      borderRadius: 7,
      background: T.surface,
      color: disabled ? T.textFaint : T.textMuted,
      cursor: disabled ? 'default' : 'pointer',
      fontFamily: 'inherit',
      fontSize: 14,
    }}
  >
    {label}
  </button>
);

const DeptPicker = ({
  options,
  value,
  onChange,
}: {
  options: DeptOption[];
  value: string | null;
  onChange: (id: string | null) => void;
}) => {
  if (options.length === 0) return null;
  const chip = (active: boolean) =>
    ({
      padding: '5px 11px',
      fontFamily: 'inherit',
      fontSize: 12.5,
      borderRadius: 7,
      cursor: 'pointer',
      border: `1px solid ${active ? T.accent : T.border}`,
      background: active ? T.accentSoft : T.surface,
      color: active ? T.accentHover : T.textMuted,
      fontWeight: active ? 600 : 400,
    }) as const;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      <button type="button" onClick={() => onChange(null)} style={chip(value === null)}>
        Все отделы
      </button>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          style={chip(value === o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};

const LegendDot = ({ color, hollow, line, text }: { color: string; hollow?: boolean; line?: boolean; text: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: T.textMuted }}>
    <span
      aria-hidden
      style={{
        width: line ? 14 : 11,
        height: line ? 2 : 11,
        borderRadius: line ? 2 : 3,
        background: hollow ? T.headerBg : color,
        border: hollow ? `1px solid ${T.borderStrong}` : 'none',
      }}
    />
    {text}
  </span>
);

export const TrendView = ({ deptOptions }: Props) => {
  const nowYear = new Date().getUTCFullYear();
  const [year, setYear] = useState(nowYear);
  const [deptId, setDeptId] = useState<string | null>(null);
  const { from, to } = yearRange(year);
  const { loading, error, data, reload } = useTrend(from, to, deptId);

  const months = data?.months ?? [];
  const totalFact = months.reduce((s, m) => s + m.fact, 0);
  const totalClient = months.reduce((s, m) => s + m.client, 0);
  const totalNorm = months.reduce((s, m) => s + m.norm, 0);
  const yearUtil = totalFact > 0 ? totalClient / totalFact : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '10px 14px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <NavBtn ariaLabel="Предыдущий год" label="‹" onClick={() => setYear((y) => y - 1)} />
          <span
            style={{
              minWidth: 64,
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 600,
              color: T.text,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {year}
          </span>
          <NavBtn
            ariaLabel="Следующий год"
            label="›"
            disabled={year >= nowYear}
            onClick={() => setYear((y) => Math.min(nowYear, y + 1))}
          />
        </span>
        <DeptPicker options={deptOptions} value={deptId} onChange={setDeptId} />
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 14, flexWrap: 'wrap' }}>
          <LegendDot color={T.accent} text="Факт" />
          <LegendDot color={T.headerBg} hollow text="Норма" />
          <LegendDot color={T.ok} line text="Утилизация" />
        </span>
      </div>

      {error ? (
        <ErrorState title="Не удалось загрузить тренд" detail={error} onRetry={reload} />
      ) : loading || !data ? (
        <Center>Загрузка тренда…</Center>
      ) : months.length === 0 ? (
        <Center>За {year} год нет данных. Выберите другой год или отдел.</Center>
      ) : (
        <ErrorBoundary title="Не удалось показать тренд" resetKeys={[year, deptId ?? '']}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 14px 16px', overflow: 'auto' }}>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12, color: T.textMuted }}>
              <span>
                Утилизация за год:{' '}
                <b style={{ color: T.accent, fontVariantNumeric: 'tabular-nums' }}>{fmtUtil(yearUtil)}</b>
              </span>
              <span>
                Факт: <b style={{ color: T.text, fontVariantNumeric: 'tabular-nums' }}>{fmtHrs(totalFact)} ч</b>
              </span>
              <span>
                Норма: <b style={{ color: T.text, fontVariantNumeric: 'tabular-nums' }}>{fmtHrs(totalNorm)} ч</b>
              </span>
            </div>
            <div
              style={{
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                background: T.surface,
                padding: '18px 16px 12px',
              }}
            >
              <TrendChart months={months} />
            </div>
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
};
