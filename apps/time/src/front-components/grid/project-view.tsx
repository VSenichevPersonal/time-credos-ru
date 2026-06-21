import { useMemo } from 'react';

import { T } from 'src/front-components/grid/tokens';
import { Center } from 'src/front-components/grid/center';
import { Autocomplete } from 'src/front-components/grid/autocomplete';
import { WeekHeader } from 'src/front-components/grid/week-header';
import { GridRow } from 'src/front-components/grid/grid-row';
import { FooterTotals } from 'src/front-components/grid/footer-totals';
import { useKeyboard } from 'src/front-components/grid/use-keyboard';
import { makeRowKey } from 'src/front-components/grid/types';
import type { GridRowModel } from 'src/front-components/grid/use-grid-model';
import type { WeekDay } from 'src/front-components/grid/use-week';
import type { NormForDay } from 'src/front-components/grid/use-daily-norm';
import type { ProjectRef, WorkTypeRef } from 'src/front-components/grid/types';

// Режим «Проект»: один проект × неделя. Строки = виды работ, колонки = дни.

type Props = {
  days: WeekDay[];
  rowList: GridRowModel[];
  projects: ProjectRef[];
  workTypes: WorkTypeRef[];
  recentProjectIds: string[];
  lastWorkTypeByProject?: Record<string, string>; // W3-5: не используется (добавляем новый вид работ)
  normFor: NormForDay;
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  loading: boolean;
  overtimeThreshold?: number; // REQ-0019: порог переработки/день из настроек
  onCellCommit: (rowKey: string, dayIso: string, hours: number) => void;
  onAddRow: (rowKey: string) => void;
};

export const ProjectView = ({
  days,
  rowList,
  projects,
  workTypes,
  recentProjectIds,
  normFor,
  selectedProjectId,
  onSelectProject,
  loading,
  overtimeThreshold,
  onCellCommit,
  onAddRow,
}: Props) => {
  const rows = useMemo(
    () => rowList.filter((r) => r.projectId === selectedProjectId),
    [rowList, selectedProjectId],
  );
  const nav = useKeyboard(rows.length, 7);
  const projectItems = useMemo(
    () => projects.map((p) => ({ id: p.id, label: p.name })),
    [projects],
  );

  const dayTotals = useMemo(() => {
    const t = Array(7).fill(0) as number[];
    for (const r of rows) for (let i = 0; i < 7; i++) t[i] += r.hoursByDay[i];
    return t;
  }, [rows]);
  const total = dayTotals.reduce((s, n) => s + n, 0);

  // Виды работ, ограниченные отделом проекта (для добавления строки).
  const scopedWorkTypes = useMemo(() => {
    const dep = projects.find((p) => p.id === selectedProjectId)?.departmentId ?? null;
    return dep ? workTypes.filter((w) => !w.departmentId || w.departmentId === dep) : workTypes;
  }, [workTypes, projects, selectedProjectId]);

  return (
    <>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${T.border}`, background: T.panelBg }}>
        <Autocomplete
          placeholder="Выберите проект…"
          items={projectItems}
          recentIds={recentProjectIds}
          value={selectedProjectId}
          onChange={onSelectProject}
          width={340}
        />
      </div>

      {!selectedProjectId ? (
        <Center>Выберите проект, чтобы заполнить виды работ за неделю.</Center>
      ) : (
        <>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <WeekHeader days={days} leftLabel="Вид работ" normFor={normFor} />
            {loading && rows.length === 0 ? (
              <Center>Загрузка…</Center>
            ) : rows.length === 0 ? (
              <Center>По проекту нет записей. Добавьте вид работ ниже.</Center>
            ) : (
              rows.map((row, i) => (
                <GridRow
                  key={row.key}
                  rowIndex={i}
                  projectName={row.workTypeName}
                  category={null}
                  workTypeName=""
                  days={days}
                  hoursByDay={row.hoursByDay}
                  overtimeThreshold={overtimeThreshold}
                  rowTotal={row.rowTotal}
                  alt={i % 2 === 1}
                  nav={nav}
                  onCellCommit={(dayIso, hours) => onCellCommit(row.key, dayIso, hours)}
                />
              ))
            )}
          </div>
          <FooterTotals days={days} dayTotals={dayTotals} weekTotal={total} normFor={normFor} />
          <AddWorkTypeRow
            workTypes={scopedWorkTypes}
            onAdd={(wid) => onAddRow(makeRowKey(selectedProjectId, wid))}
          />
        </>
      )}
    </>
  );
};

// Добавление вида работ в выбранный проект (проект уже задан селектором сверху).
const AddWorkTypeRow = ({
  workTypes,
  onAdd,
}: {
  workTypes: WorkTypeRef[];
  onAdd: (workTypeId: string) => void;
}) => {
  const items = useMemo(() => workTypes.map((w) => ({ id: w.id, label: w.name })), [workTypes]);
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
      <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>+ вид работ</span>
      <Autocomplete
        placeholder="Вид работ…"
        items={items}
        value={null}
        onChange={(id) => id && onAdd(id)}
        width={260}
      />
    </div>
  );
};
