import { T } from 'src/front-components/reports/report-tokens';

// Горизонтальный бар «факт vs норма». Заливка = доля факта от нормы (capped 100%),
// перелив над нормой — терракот. Без градиентов/side-stripe (impeccable).

type Props = {
  value: number; // факт
  max: number | null; // норма (null → бар не рисуем, только число у вызова)
  height?: number;
};

export const Bar = ({ value, max, height = 8 }: Props) => {
  const norm = max && max > 0 ? max : 0;
  const ratio = norm > 0 ? value / norm : 0;
  const fillPct = Math.min(100, Math.round(ratio * 100));
  const over = ratio > 1;
  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: height,
        background: T.headerBg,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: `${fillPct}%`,
          height: '100%',
          background: over ? T.over : T.accent,
          transition: 'width 200ms ease',
        }}
      />
    </div>
  );
};

// Маркер процента над нормой (для подписи у бара).
export const pctOfNorm = (value: number, max: number | null): string => {
  if (!max || max <= 0) return '—';
  return `${Math.round((value / max) * 100)}%`;
};
