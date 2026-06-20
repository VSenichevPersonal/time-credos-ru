import { T } from 'src/front-components/grid/tokens';
import type { SortDir } from 'src/front-components/shared/use-sortable';

// DP-0004: кликабельный заголовок-колонка со стрелкой сортировки. DOM-free.

type Props = {
  label: string;
  active: boolean;
  dir: SortDir;
  onSort: () => void;
  align?: 'left' | 'right';
};

export const SortHeader = ({ label, active, dir, onSort, align = 'left' }: Props) => (
  <button
    type="button"
    onClick={onSort}
    title="Сортировать"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 3,
      justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      width: '100%',
      height: '100%',
      padding: 0,
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      font: 'inherit',
      fontWeight: 600,
      color: active ? T.accent : T.textMuted,
      fontFamily: 'inherit',
    }}
  >
    {label}
    <span style={{ fontSize: 9, width: 8, opacity: active ? 1 : 0.25 }}>
      {active ? (dir === 'asc' ? '▲' : '▼') : '▾'}
    </span>
  </button>
);
