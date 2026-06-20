import { useMemo, useState } from 'react';

import { Autocomplete } from 'src/front-components/grid/autocomplete';
import type { ProjectRef, WorkTypeRef } from 'src/front-components/grid/types';
import { makeRowKey } from 'src/front-components/grid/types';
import { T } from 'src/front-components/grid/tokens';

// Быстрое добавление строки: автокомплит проекта (код/клиент) → вид работ.
// Недавние проекты — вверху списка.

type Props = {
  projects: ProjectRef[];
  workTypes: WorkTypeRef[];
  recentProjectIds: string[];
  onAdd: (rowKey: string) => void;
};

export const AddRow = ({ projects, workTypes, recentProjectIds, onAdd }: Props) => {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [workTypeId, setWorkTypeId] = useState<string | null>(null);

  const projectItems = useMemo(
    () => projects.map((p) => ({ id: p.id, label: p.name })),
    [projects],
  );
  // Виды работ ограничиваем отделом проекта (или глобальные), если проект выбран.
  const workTypeItems = useMemo(() => {
    const dep = projects.find((p) => p.id === projectId)?.departmentId ?? null;
    const scoped = dep
      ? workTypes.filter((w) => !w.departmentId || w.departmentId === dep)
      : workTypes;
    return scoped.map((w) => ({ id: w.id, label: w.name }));
  }, [workTypes, projects, projectId]);

  const ready = Boolean(projectId && workTypeId);
  const add = () => {
    if (!projectId || !workTypeId) return;
    onAdd(makeRowKey(projectId, workTypeId));
    setProjectId(null);
    setWorkTypeId(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderTop: `1px solid ${T.border}`,
        background: T.panelBg,
      }}
    >
      <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>+ строка</span>
      <Autocomplete
        placeholder="Проект (код или клиент)…"
        items={projectItems}
        recentIds={recentProjectIds}
        value={projectId}
        onChange={setProjectId}
        width={260}
      />
      <Autocomplete
        placeholder="Вид работ…"
        items={workTypeItems}
        value={workTypeId}
        onChange={setWorkTypeId}
        width={200}
      />
      <button
        onClick={add}
        disabled={!ready}
        style={{
          height: 30,
          padding: '0 14px',
          fontSize: 12,
          fontWeight: 600,
          border: 'none',
          borderRadius: 7,
          background: ready ? T.accent : T.border,
          color: ready ? T.surface : T.textFaint,
          cursor: ready ? 'pointer' : 'default',
          fontFamily: 'inherit',
        }}
      >
        Добавить
      </button>
    </div>
  );
};
