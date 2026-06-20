import { T } from 'src/front-components/capacity/cap-tokens';
import { Segmented } from 'src/front-components/capacity/mode-switcher';
import { SaveIndicator } from 'src/front-components/grid/save-indicator';
import type { SaveStatus } from 'src/front-components/grid/use-save-status';
import type { Granularity } from 'src/front-components/capacity/use-capacity';
import type { CapAxis, CellMetric } from 'src/front-components/capacity/types';

// Шапка доски: срез/метрика/гранулярность + кнопка «Планировать» (только
// руководителю) и индикатор автосохранения. Логика расчётов — в родителе.

const HINT: Record<CellMetric, string> = {
  free: 'Свободно ч = ёмкость − план (по производственному календарю РФ)',
  pct: 'Загрузка % = план / ёмкость',
  plan: 'План ч = плановые часы проектов отдела в периоде',
};

type Props = {
  axis: CapAxis;
  metric: CellMetric;
  granularity: Granularity;
  planning: boolean;
  isManager: boolean;
  saveStatus: SaveStatus;
  onAxis: (v: CapAxis) => void;
  onMetric: (v: CellMetric) => void;
  onGranularity: (v: Granularity) => void;
  onTogglePlanning: () => void;
};

export const BoardToolbar = ({
  axis,
  metric,
  granularity,
  planning,
  isManager,
  saveStatus,
  onAxis,
  onMetric,
  onGranularity,
  onTogglePlanning,
}: Props) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 14px',
      borderBottom: `1px solid ${T.border}`,
      background: T.panelBg,
      flexWrap: 'wrap',
    }}
  >
    <span style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Планирование</span>
    <Segmented
      ariaLabel="Срез группировки"
      value={axis}
      segments={[
        { value: 'dept', label: 'Отделы' },
        { value: 'employee', label: 'Люди' },
      ]}
      onChange={(v) => {
        if (planning) return; // в планировании срез фиксирован на «Отделы»
        onAxis(v);
      }}
    />
    <Segmented
      ariaLabel="Метрика ячейки"
      value={metric}
      segments={[
        { value: 'free', label: 'Свободно ч' },
        { value: 'pct', label: 'Загрузка %' },
        { value: 'plan', label: 'План ч' },
      ]}
      onChange={onMetric}
    />
    <Segmented
      ariaLabel="Гранулярность"
      value={granularity}
      segments={[
        { value: 'week', label: 'Недели' },
        { value: 'month', label: 'Месяцы' },
      ]}
      onChange={onGranularity}
    />
    {isManager && (
      <button
        type="button"
        aria-pressed={planning}
        onClick={onTogglePlanning}
        title="Ввод плановых часов и сроков по проектам отдела"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 14px',
          fontSize: 12.5,
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: 'pointer',
          borderRadius: 8,
          border: `1px solid ${planning ? T.accent : T.border}`,
          color: planning ? '#fff' : T.accent,
          background: planning ? T.accent : T.surface,
        }}
      >
        {planning ? '✓ Планирование' : '✎ Планировать'}
      </button>
    )}
    {planning && <SaveIndicator status={saveStatus} />}
    <span style={{ marginLeft: 'auto', fontSize: 11.5, color: planning ? T.accent : T.textFaint }}>
      {planning
        ? 'Раскройте отдел → задайте плановые часы и срок проекту. Загрузка пересчитается.'
        : HINT[metric]}
    </span>
  </div>
);
