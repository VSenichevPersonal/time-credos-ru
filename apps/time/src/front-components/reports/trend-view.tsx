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
}) => {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const live = !disabled && (hover || focus);
  return (
    <button
      type="button"
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
        border: `1px solid ${live ? T.accentRing : T.border}`,
        borderRadius: 7,
        background: !disabled && hover ? T.accentSoft : T.surface,
        color: disabled ? T.textFaint : live ? T.accent : T.textMuted,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit',
        fontSize: 14,
        outline: 'none',
        boxShadow: !disabled && focus ? `0 0 0 2px ${T.accentRing}` : undefined,
        transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease, box-shadow 120ms ease',
      }}
    >
      {label}
    </button>
  );
};

const DeptChip = ({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) => {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        padding: '5px 11px',
        fontFamily: 'inherit',
        fontSize: 12.5,
        borderRadius: 7,
        cursor: active ? 'default' : 'pointer',
        border: `1px solid ${active || hover || focus ? T.accent : T.border}`,
        background: active ? T.accentSoft : hover ? T.accentSoft : T.surface,
        color: active || hover ? T.accentHover : T.textMuted,
        fontWeight: active ? 600 : 400,
        outline: 'none',
        boxShadow: focus ? `0 0 0 2px ${T.accentRing}` : undefined,
        transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease, box-shadow 120ms ease',
      }}
    >
      {label}
    </button>
  );
};

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
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      <DeptChip active={value === null} label="Все отделы" onClick={() => onChange(null)} />
      {options.map((o) => (
        <DeptChip key={o.id} active={value === o.id} label={o.label} onClick={() => onChange(o.id)} />
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

const Stat = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <span>
    {label}: <b style={{ color, fontVariantNumeric: 'tabular-nums' }}>{value}</b>
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
              <Stat label="Утилизация за год" value={fmtUtil(yearUtil)} color={T.accent} />
              <Stat label="Факт" value={`${fmtHrs(totalFact)} ч`} color={T.text} />
              <Stat label="Норма" value={`${fmtHrs(totalNorm)} ч`} color={T.text} />
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
