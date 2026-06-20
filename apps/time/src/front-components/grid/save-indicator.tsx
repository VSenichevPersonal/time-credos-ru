import { T } from 'src/front-components/grid/tokens';
import type { SaveStatus } from 'src/front-components/grid/use-save-status';

// Индикатор автосохранения в тулбаре: точка + подпись. Ширина зарезервирована,
// чтобы смена статуса не двигала раскладку. aria-live — для скринридеров.

type Cfg = { label: string; color: string; dot: string };

const MAP: Record<SaveStatus, Cfg | null> = {
  idle: null,
  saving: { label: 'Сохранение…', color: T.textMuted, dot: T.textFaint },
  saved: { label: 'Сохранено', color: T.ok, dot: T.ok },
  error: { label: 'Не сохранено', color: T.over, dot: T.over },
};

export const SaveIndicator = ({ status }: { status: SaveStatus }) => {
  const cfg = MAP[status];
  return (
    <span
      role="status"
      aria-live="polite"
      title={cfg?.label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        minWidth: 104,
        height: 20,
        fontSize: 11.5,
        fontWeight: 500,
        color: cfg ? cfg.color : 'transparent',
        transition: 'color 160ms ease-out',
        userSelect: 'none',
      }}
    >
      {cfg && (
        <>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: cfg.dot,
              flexShrink: 0,
            }}
          />
          {cfg.label}
        </>
      )}
    </span>
  );
};
