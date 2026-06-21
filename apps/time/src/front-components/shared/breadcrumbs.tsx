import { useState } from 'react';

import { T } from 'src/front-components/grid/tokens';
import type { DrillLevel } from 'src/front-components/shared/use-drill';

// Хлебные крошки drill (research §3.1). DOM-free: кнопки goTo, без measure/URL.
// Корень («Все отделы») = reset. Последняя крошка = текущий уровень (статична,
// акцент). Разделитель «›». Узкий виджет — крошки переносятся (flex-wrap).
// Кликабельные крошки = возврат на уровень: hover тинт-фон + видимый focus-ring.

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
  padding: '2px 6px',
  margin: 0,
  font: 'inherit',
  fontSize: 12.5,
  color: T.textMuted,
  cursor: 'pointer',
  borderRadius: 5,
  fontFamily: 'inherit',
  transition: 'background 120ms ease, color 120ms ease, box-shadow 120ms ease',
} as const;

// Крошка-кнопка с hover/focus: подсвечивает, что клик вернёт на этот уровень.
const CrumbButton = ({ label, onClick }: { label: string; onClick: () => void }) => {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      title={`Вернуться: ${label}`}
      style={{
        ...crumbBtn,
        color: hover || focus ? T.accent : T.textMuted,
        background: hover ? T.accentSoft : 'transparent',
        boxShadow: focus ? `0 0 0 2px ${T.accentRing}` : undefined,
      }}
    >
      {label}
    </button>
  );
};

export const Breadcrumbs = ({ rootLabel, stack, onRoot, onLevel }: Props) => {
  if (stack.length === 0) return null;
  return (
    <nav
      aria-label="Уровни детализации"
      style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', minWidth: 0 }}
    >
      <CrumbButton label={rootLabel} onClick={onRoot} />
      {stack.map((level, i) => {
        const isLast = i === stack.length - 1;
        return (
          <span key={`${level.dim}:${level.value}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {sep}
            {isLast ? (
              <span style={{ fontSize: 12.5, fontWeight: 600, color: T.accent, padding: '2px 6px' }} aria-current="true">
                {level.label}
              </span>
            ) : (
              <CrumbButton label={level.label} onClick={() => onLevel(i + 1)} />
            )}
          </span>
        );
      })}
    </nav>
  );
};
