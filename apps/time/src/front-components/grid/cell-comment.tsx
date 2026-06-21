import { useEffect, useState } from 'react';

import { T } from 'src/front-components/grid/tokens';

// U11: комментарий к ячейке часов в режиме Неделя. Триггер ✎ слева снизу +
// поповер с инпутом. Раньше комментарий был только в режиме День — устраняем
// разрыв (commitDescription уже был в actions, не выведен в UI Недели).
// Поповер на useState (Remote DOM, host-DOM нет) — паттерн как cheatsheet.

type Props = {
  description: string | null;
  onCommit: (text: string) => void;
};

export const CellComment = ({ description, onCommit }: Props) => {
  const [commenting, setCommenting] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!commenting) setDraft(description ?? '');
  }, [description, commenting]);

  const commit = () => {
    setCommenting(false);
    if (draft !== (description ?? '')) onCommit(draft);
  };

  return (
    <>
      <button
        type="button"
        title={description ? `Комментарий: ${description}` : 'Добавить комментарий'}
        aria-label="Комментарий к записи"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          setDraft(description ?? '');
          setCommenting(true);
        }}
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: 18,
          height: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          border: 'none',
          borderRadius: 4,
          background: 'transparent',
          color: description ? T.accent : T.textMuted,
          cursor: 'pointer',
          fontSize: 11,
          lineHeight: 0,
          fontFamily: 'inherit',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = T.accentSoft;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        ✎
      </button>
      {commenting && (
        <>
          <div
            onClick={(e) => {
              e.stopPropagation();
              commit();
            }}
            style={{ position: 'fixed', inset: 0, zIndex: 20 }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 34,
              right: 0,
              zIndex: 21,
              width: 240,
              background: T.surface,
              border: `1px solid ${T.borderStrong}`,
              borderRadius: 9,
              boxShadow: '0 8px 24px rgba(29,31,38,0.16)',
              padding: 8,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 5 }}>
              Комментарий к записи
            </div>
            <input
              autoFocus
              value={draft}
              placeholder="Что делали…"
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') {
                  setDraft(description ?? '');
                  setCommenting(false);
                }
              }}
              style={{
                width: '100%',
                height: 28,
                padding: '0 8px',
                fontSize: 12,
                border: `1px solid ${T.accent}`,
                borderRadius: 6,
                outline: 'none',
                color: T.text,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                background: T.surface,
              }}
            />
          </div>
        </>
      )}
    </>
  );
};
