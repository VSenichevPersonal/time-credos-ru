import { useState } from 'react';

import { T, FONT } from 'src/front-components/grid/tokens';

// Дружелюбное состояние ошибки загрузки: понятный текст + кнопка «Повторить».
// Стандарт Timetta/Kimai (graceful error + retry): не пугаем пользователя сырым
// текстом исключения, даём действие. Технический detail прячем под «Подробнее».
// Product-register: спокойные нейтрали, акцент только на кнопке. Песочница-safe:
// без host-DOM и window-слушателей, чистый React + inline-стили.

type ErrorStateProps = {
  // Дружелюбный заголовок: чего не вышло. Без точки в конце.
  title?: string;
  // Сырой текст ошибки (message бэка/сети) — показываем под «Подробнее».
  detail?: string | null;
  // Повторная загрузка. Если не передан — кнопка не показывается.
  onRetry?: () => void;
};

const wrap = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  minHeight: 120,
  height: '100%',
  padding: 24,
  fontFamily: FONT,
  textAlign: 'center' as const,
};

export const ErrorState = ({
  title = 'Не удалось загрузить данные',
  detail,
  onRetry,
}: ErrorStateProps) => {
  const [hover, setHover] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div style={wrap} role="alert">
      <div aria-hidden style={{ fontSize: 26, lineHeight: 1, color: T.textFaint }}>
        ⚠
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, maxWidth: 360 }}>
        {title}
      </div>

      <div style={{ fontSize: 12.5, color: T.textMuted, maxWidth: 360, lineHeight: 1.5 }}>
        Проверьте подключение и попробуйте снова. Если повторяется — обратитесь к администратору.
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            marginTop: 2,
            padding: '7px 16px',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 600,
            color: T.onAccent,
            background: hover ? T.accentHover : T.accent,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Повторить
        </button>
      )}

      {detail && (
        <div style={{ marginTop: 2 }}>
          <button
            type="button"
            onClick={() => setShowDetail((v) => !v)}
            style={{
              padding: 0,
              fontFamily: 'inherit',
              fontSize: 11.5,
              color: T.textFaint,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {showDetail ? 'Скрыть подробности' : 'Подробнее'}
          </button>
          {showDetail && (
            <div
              style={{
                marginTop: 6,
                maxWidth: 360,
                fontSize: 11,
                color: T.textMuted,
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {detail}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
