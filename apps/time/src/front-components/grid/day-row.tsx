import { useEffect, useState } from 'react';

import { T, cellFill } from 'src/front-components/grid/tokens';
import { fmtHours, parseHours } from 'src/front-components/grid/format';

// Строка дня: проект (600) · вид работ (400) · описание · крупная ячейка часов.

type Props = {
  alt: boolean;
  projectName: string;
  workTypeName: string;
  hours: number;
  description: string | null;
  onCommit: (hours: number) => void;
};

export const DayRow = ({
  alt,
  projectName,
  workTypeName,
  hours,
  description,
  onCommit,
}: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!editing) setDraft(fmtHours(hours));
  }, [hours, editing]);

  const commit = () => {
    setEditing(false);
    const parsed = parseHours(draft);
    if (parsed === null) return setDraft(fmtHours(hours));
    if (parsed !== hours) onCommit(parsed);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        background: alt ? T.rowAlt : T.surface,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          title={projectName}
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: T.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {projectName}
        </div>
        <div
          title={description ? `${workTypeName} · ${description}` : workTypeName}
          style={{
            fontSize: 11.5,
            color: T.textMuted,
            marginTop: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {workTypeName}
          {description ? (
            <span style={{ color: T.textFaint }}> · {description}</span>
          ) : null}
        </div>
      </div>

      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(fmtHours(hours));
              setEditing(false);
            }
          }}
          style={{
            width: 72,
            height: 38,
            textAlign: 'right',
            padding: '0 12px',
            fontSize: 16,
            fontVariantNumeric: 'tabular-nums',
            border: `1px solid ${T.accent}`,
            borderRadius: 8,
            outline: 'none',
            color: T.text,
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <div
          onClick={() => {
            setDraft(fmtHours(hours));
            setEditing(true);
          }}
          style={{
            width: 72,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 12px',
            fontSize: 16,
            fontWeight: hours > 0 ? 600 : 400,
            fontVariantNumeric: 'tabular-nums',
            color: hours > 0 ? T.text : T.textFaint,
            background: hours > 0 ? cellFill(hours) : T.panelBg,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            cursor: 'text',
            boxSizing: 'border-box',
          }}
        >
          {hours > 0 ? fmtHours(hours) : '·'}
        </div>
      )}
    </div>
  );
};
