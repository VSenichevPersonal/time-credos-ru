import { T } from 'src/front-components/grid/tokens';
import type { DrillLevel } from 'src/front-components/shared/use-drill';

// Хлебные крошки drill (research §3.1). DOM-free: кнопки goTo, без measure/URL.
// Корень («Все отделы») = reset. Последняя крошка = текущий уровень (статична,
// акцент). Разделитель «›». Узкий виджет — крошки переносятся (flex-wrap).

type Props = {
  rootLabel: string;
  stack: DrillLevel[];
  onRoot: () => void;
  onLevel: (index: number) => void;
};

const sep = (
  <span aria-hidden style={{ color: T.textFaint, fontSize: 12 }}>
    ›
  </span>
);

const crumbBtn = {
  border: 'none',
  background: 'none',
  padding: '2px 4px',
  margin: 0,
  font: 'inherit',
  fontSize: 12.5,
  color: T.textMuted,
  cursor: 'pointer',
  borderRadius: 5,
  fontFamily: 'inherit',
} as const;

export const Breadcrumbs = ({ rootLabel, stack, onRoot, onLevel }: Props) => {
  if (stack.length === 0) return null;
  return (
    <nav
      aria-label="Уровни детализации"
      style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', minWidth: 0 }}
    >
      <button type="button" onClick={onRoot} style={crumbBtn}>
        {rootLabel}
      </button>
      {stack.map((level, i) => {
        const isLast = i === stack.length - 1;
        return (
          <span key={`${level.dim}:${level.value}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {sep}
            {isLast ? (
              <span style={{ fontSize: 12.5, fontWeight: 600, color: T.accent, padding: '2px 4px' }} aria-current="true">
                {level.label}
              </span>
            ) : (
              <button type="button" onClick={() => onLevel(i + 1)} style={crumbBtn}>
                {level.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
};
