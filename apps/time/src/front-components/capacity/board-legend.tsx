import { T, loadTone } from 'src/front-components/capacity/cap-tokens';

// Легенда цветовой шкалы доски: что значит цвет ячейки. Без неё новый юзер не
// читает heatmap (зелёный=свободно — контринтуитивно для деливери). DP-0006 §1.

const Swatch = ({ ratio, label }: { ratio: number; label: string }) => {
  const tone = loadTone(ratio);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
      <span
        aria-hidden
        style={{
          width: 14,
          height: 14,
          borderRadius: 3,
          background: tone.bg === 'transparent' ? T.surface : tone.bg,
          border: `1px solid ${T.border}`,
        }}
      />
      <span style={{ fontSize: 11, color: T.textMuted }}>{label}</span>
    </span>
  );
};

export const BoardLegend = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '5px 14px',
      borderBottom: `1px solid ${T.border}`,
      background: T.surface,
      flexWrap: 'wrap',
    }}
  >
    <span style={{ fontSize: 11, fontWeight: 600, color: T.textFaint }}>Цвет = загрузка:</span>
    <Swatch ratio={0.2} label="много свободно" />
    <Swatch ratio={0.7} label="оптимально" />
    <Swatch ratio={0.99} label="полная" />
    <Swatch ratio={1.2} label="перегруз" />
  </div>
);
