import { T } from 'src/front-components/grid/tokens';

// Навигация по периоду ‹ дата › + «Сегодня». Заголовок кликабелен (сброс).

const NavButton = ({
  dir,
  label,
  onClick,
}: {
  dir: 'prev' | 'next';
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    aria-label={label}
    style={{
      width: 26,
      height: 26,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1px solid ${T.borderStrong}`,
      borderRadius: 6,
      background: T.surface,
      cursor: 'pointer',
      color: T.textMuted,
      fontSize: 14,
      lineHeight: 1,
      fontFamily: 'inherit',
    }}
  >
    {dir === 'prev' ? '‹' : '›'}
  </button>
);

type Props = {
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

export const PeriodNav = ({ title, onPrev, onNext, onToday }: Props) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <NavButton dir="prev" label="Предыдущий период" onClick={onPrev} />
    <span
      style={{
        minWidth: 168,
        textAlign: 'center',
        fontSize: 12.5,
        fontWeight: 600,
        color: T.text,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {title}
    </span>
    <NavButton dir="next" label="Следующий период" onClick={onNext} />
    <button
      onClick={onToday}
      style={{
        marginLeft: 2,
        padding: '4px 10px',
        fontSize: 12,
        border: `1px solid ${T.border}`,
        borderRadius: 6,
        background: T.surface,
        color: T.textMuted,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      Сегодня
    </button>
  </div>
);
