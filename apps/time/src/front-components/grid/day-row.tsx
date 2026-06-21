import { useEffect, useState } from 'react';

import { T, cellFill } from 'src/front-components/grid/tokens';
import { fmtHours, isOvertime, parseHours } from 'src/front-components/grid/format';
import { categoryMeta } from 'src/front-components/shared/category-meta';

// Строка дня: цвет-точка категории · проект (600) · вид работ (400) · описание · ячейка часов.

type Props = {
  alt: boolean;
  projectName: string;
  category?: string | null;
  workTypeName: string;
  hours: number;
  locked?: boolean; // W6-2: согласованная запись — только чтение
  overtimeThreshold?: number; // REQ-0019: порог переработки/день из настроек
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
  locked,
  overtimeThreshold,
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
          aria-disabled={locked || undefined}
          aria-label={locked ? `Согласовано, только чтение: ${fmtHours(hours)} ч` : undefined}
          title={
            locked
              ? 'Согласовано — правка запрещена'
              : isOvertime(hours, overtimeThreshold)
                ? 'Переработка: часов больше порога'
                : undefined
          }
          onClick={() => {
            if (locked) return; // W6-2: согласованную не редактируем
            setDraft(fmtHours(hours));
            setEditing(true);
          }}
          style={{
            width: 72,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 5,
            padding: '0 12px',
            fontSize: 16,
            fontWeight: hours > 0 ? 600 : 400,
            fontVariantNumeric: 'tabular-nums',
            color: locked
              ? T.textMuted
              : isOvertime(hours, overtimeThreshold)
                ? T.warn
                : hours > 0
                  ? T.text
                  : T.textFaint,
            // Read-only: тихий нейтральный фон, статус не только цветом (замок).
            background: locked ? T.panelBg : hours > 0 ? cellFill(hours) : T.panelBg,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            cursor: locked ? 'default' : 'text',
            boxSizing: 'border-box',
          }}
        >
          {locked && (
            <svg
              aria-hidden
              width="11"
              height="11"
              viewBox="0 0 10 10"
              fill="none"
              style={{ opacity: 0.55, flexShrink: 0 }}
            >
              <rect x="1.5" y="4.5" width="7" height="5" rx="1" fill={T.textMuted} />
              <path
                d="M3 4.5V3a2 2 0 0 1 4 0v1.5"
                stroke={T.textMuted}
                strokeWidth="1.1"
                fill="none"
              />
            </svg>
          )}
          {hours > 0 ? fmtHours(hours) : '·'}
        </div>
      )}
    </div>
  );
};
