import { useState } from 'react';

import { T } from 'src/front-components/grid/tokens';
import { ModeSwitcher } from 'src/front-components/grid/mode-switcher';
import { PeriodNav } from 'src/front-components/grid/period-nav';
import { Cheatsheet } from 'src/front-components/grid/cheatsheet';
import { SaveIndicator } from 'src/front-components/grid/save-indicator';
import type { SaveStatus } from 'src/front-components/grid/use-save-status';
import type { ViewMode } from 'src/front-components/grid/types';

// Верхний тулбар: название · режимы · период · действия (копировать неделю, «?»).

type Props = {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  periodTitle: string;
  saveStatus: SaveStatus;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCopyWeek?: () => void;
  copyDisabled?: boolean;
};

const actionBtn = (disabled?: boolean) =>
  ({
    height: 28,
    padding: '0 11px',
    fontSize: 12,
    fontWeight: 500,
    border: `1px solid ${T.border}`,
    borderRadius: 7,
    background: T.surface,
    color: disabled ? T.textFaint : T.textMuted,
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  }) as const;

export const Toolbar = ({
  mode,
  onModeChange,
  periodTitle,
  saveStatus,
  onPrev,
  onNext,
  onToday,
  onCopyWeek,
  copyDisabled,
}: Props) => {
  const [help, setHelp] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        padding: '9px 12px',
        position: 'relative',
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Таймшит</span>
      <SaveIndicator status={saveStatus} />
      <ModeSwitcher value={mode} onChange={onModeChange} />
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        <PeriodNav title={periodTitle} onPrev={onPrev} onNext={onNext} onToday={onToday} />
        {onCopyWeek && (
          <button
            onClick={onCopyWeek}
            disabled={copyDisabled}
            style={actionBtn(copyDisabled)}
            title="Скопировать строки прошлой недели"
          >
            Копировать неделю
          </button>
        )}
        <button
          onClick={() => setHelp((v) => !v)}
          aria-label="Горячие клавиши"
          style={{ ...actionBtn(), width: 28, padding: 0, fontWeight: 700 }}
        >
          ?
        </button>
        {help && <Cheatsheet onClose={() => setHelp(false)} />}
      </div>
    </div>
  );
};
