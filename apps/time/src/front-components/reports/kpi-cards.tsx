import { T } from 'src/front-components/reports/report-tokens';
import { fmtUtil, fmtHrs, fmtUnder, underTone } from 'src/front-components/reports/report-tokens';
import type { ReportRow } from 'src/front-components/reports/report-types';

// Сводные показатели периода (totals): утилизация, факт, норма, недогруз.
// Плоские карточки-метрики (без hero-плашек/градиентов): подпись + крупное число.

type Props = { totals: ReportRow };

const Card = ({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: string;
  hint?: string;
  color?: string;
}) => (
  <div
    style={{
      flex: '1 1 140px',
      minWidth: 140,
      padding: '12px 14px',
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
    }}
  >
    <div style={{ fontSize: 11.5, color: T.textMuted, marginBottom: 6 }}>{label}</div>
    <div
      style={{
        fontSize: 24,
        fontWeight: 700,
        lineHeight: 1,
        color: color ?? T.text,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </div>
    {hint && (
      <div style={{ fontSize: 11, color: T.textFaint, marginTop: 6 }}>{hint}</div>
    )}
  </div>
);

export const KpiCards = ({ totals }: Props) => {
  const under = underTone(totals.under);
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '12px 14px' }}>
      <Card
        label="Утилизация"
        value={fmtUtil(totals.util)}
        hint="доля клиентских часов"
        color={T.accent}
      />
      <Card label="Факт, ч" value={fmtHrs(totals.fact)} hint="всего списано" />
      <Card
        label="Норма, ч"
        value={totals.norm === null ? '—' : fmtHrs(totals.norm)}
        hint="по произв. календарю"
      />
      <Card
        label="Недогруз, ч"
        value={fmtUnder(totals.under)}
        hint={totals.under !== null && totals.under < 0 ? 'перегруз' : 'до нормы'}
        color={under.fg}
      />
    </div>
  );
};
