import { useState } from 'react';

import type { Ref } from 'src/front-components/grid/types';
import { makeRowKey } from 'src/front-components/grid/types';
import { T } from 'src/front-components/grid/tokens';

// Панель добавления строки: выбор проекта + вида работ → новая пустая строка.

type Props = {
  projects: Ref[];
  workTypes: Ref[];
  onAdd: (rowKey: string) => void;
};

const selectStyle = {
  height: 28,
  fontSize: 12,
  padding: '0 8px',
  border: `1px solid ${T.borderStrong}`,
  borderRadius: 6,
  background: T.surface,
  color: T.text,
  fontFamily: 'inherit',
  maxWidth: 220,
} as const;

export const AddRow = ({ projects, workTypes, onAdd }: Props) => {
  const [projectId, setProjectId] = useState('');
  const [workTypeId, setWorkTypeId] = useState('');

  const add = () => {
    if (!projectId || !workTypeId) return;
    onAdd(makeRowKey(projectId, workTypeId));
    setProjectId('');
    setWorkTypeId('');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderTop: `1px solid ${T.border}`,
        background: T.bg,
      }}
    >
      <select
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        style={selectStyle}
      >
        <option value="">Проект…</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select
        value={workTypeId}
        onChange={(e) => setWorkTypeId(e.target.value)}
        style={selectStyle}
      >
        <option value="">Вид работ…</option>
        {workTypes.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
      <button
        onClick={add}
        disabled={!projectId || !workTypeId}
        style={{
          height: 28,
          padding: '0 14px',
          fontSize: 12,
          fontWeight: 600,
          border: 'none',
          borderRadius: 6,
          background: projectId && workTypeId ? T.accent : T.border,
          color: projectId && workTypeId ? '#ffffff' : T.textFaint,
          cursor: projectId && workTypeId ? 'pointer' : 'default',
          fontFamily: 'inherit',
        }}
      >
        Добавить строку
      </button>
    </div>
  );
};
