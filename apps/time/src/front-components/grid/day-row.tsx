import { useEffect, useState } from 'react';

import { T, cellFill } from 'src/front-components/grid/tokens';
import { fmtHours, parseHours } from 'src/front-components/grid/format';
import { categoryMeta } from 'src/front-components/shared/category-meta';

// Строка дня: цвет-точка категории · проект (600) · вид работ (400) · описание · ячейка часов.

type Props = {
  alt: boolean;
  projectName: string;
  category?: string | null;
  workTypeName: string;
  hours: number;
  description: string | null;
  onCommit: (hours: number) => void;
  onCommitDescription?: (text: string) => void; // U11: инлайн-комментарий
};

export const DayRow = ({
  alt,
  projectName,
  category,
  workTypeName,
  hours,
  description,
  onCommit,
  onCommitDescription,
}: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [editDesc, setEditDesc] = useState(false);
  const [draftDesc, setDraftDesc] = useState('');

  useEffect(() => {
    if (!editing) setDraft(fmtHours(hours));
  }, [hours, editing]);
  useEffect(() => {
    if (!editDesc) setDraftDesc(description ?? '');
  }, [description, editDesc]);

  const commitDesc = () => {
    setEditDesc(false);
    if (draftDesc !== (description ?? '')) onCommitDescription?.(draftDesc);
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              flexShrink: 0,
              background: category ? categoryMeta(category).solid : T.border,
            }}
          />
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
        </div>
        <div
          title={workTypeName}
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
        </div>
        {onCommitDescription && hours > 0 &&
          (editDesc ? (
            <input
              autoFocus
              value={draftDesc}
              placeholder="Комментарий…"
              onChange={(e) => setDraftDesc(e.target.value)}
              onBlur={commitDesc}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') {
                  setDraftDesc(description ?? '');
                  setEditDesc(false);
                }
              }}
              style={{
                marginTop: 3,
                width: '100%',
                maxWidth: 340,
                height: 24,
                fontSize: 11.5,
                padding: '0 7px',
                border: `1px solid ${T.accent}`,
                borderRadius: 5,
                outline: 'none',
                color: T.text,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <div
              onClick={() => setEditDesc(true)}
              title="Добавить/изменить комментарий"
              style={{
                marginTop: 2,
                fontSize: 11.5,
                color: description ? T.textFaint : T.accent,
                cursor: 'text',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {description || '+ комментарий'}
            </div>
          ))}
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
