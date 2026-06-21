import { T } from 'src/front-components/reports/report-tokens';
import { dimLabel } from 'src/front-components/reports/drill-axis';
import type { OlapFilter } from 'src/front-components/reports/olap-types';

// Активные cross-filter drill как съёмные пилюли (DP-0002: что именно сужает срез,
// видно явно). Каждая = «Ось: значение ✕»; ✕ снимает фильтр (возврат на уровень).
// Не side-stripe, не чип-кнопка: пилюля с тинт-фоном, ✕ — кнопка внутри.

type Props = {
  filters: { filter: OlapFilter; label: string }[];
  onRemove: (index: number) => void;
};

export const FilterPills = ({ filters, onRemove }: Props) => {
  if (filters.length === 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
      {filters.map(({ filter, label }, i) => (
        <span
          key={`${filter.dim}:${filter.value}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 24,
            padding: '0 4px 0 9px',
            background: T.accentSoft,
            border: `1px solid ${T.accentRing}`,
            borderRadius: 12,
            fontSize: 12,
            color: T.text,
            maxWidth: 240,
          }}
        >
          <span style={{ color: T.textMuted, flexShrink: 0 }}>{dimLabel(filter.dim)}:</span>
          <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={label}>
            {label}
          </span>
          <button
            type="button"
            aria-label={`Снять фильтр «${dimLabel(filter.dim)}: ${label}»`}
            onClick={() => onRemove(i)}
            style={{
              width: 18,
              height: 18,
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'transparent',
              color: T.textMuted,
              cursor: 'pointer',
              borderRadius: 9,
              fontSize: 13,
              lineHeight: 1,
              fontFamily: 'inherit',
            }}
          >
            ✕
          </button>
        </span>
      ))}
    </div>
  );
};
