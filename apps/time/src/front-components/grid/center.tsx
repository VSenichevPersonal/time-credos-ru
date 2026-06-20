import { T, FONT } from 'src/front-components/grid/tokens';

// Центрированное сообщение (загрузка / пусто / ошибка).

export const Center = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 120,
      height: '100%',
      padding: 24,
      fontSize: 13,
      color: T.textMuted,
      fontFamily: FONT,
      textAlign: 'center',
    }}
  >
    {children}
  </div>
);
