import { useState } from 'react';

import { T, loadTone, formatCell, formatPct, formatGapHours, formatGapPctShort, avgRatio, SIGMA_W, colWidth, gapTone, gapPct, gapIcon, conflictShadow } from 'src/front-components/capacity/cap-tokens';
import { BookingMarker } from 'src/front-components/capacity/booking-marker';
import type { CellMetric, DeptRef, LoadCell, Period } from 'src/front-components/capacity/types';
import { departmentLabel } from 'src/constants/labels';

// Строка отдела: имя + чип допущений (N чел × коэф) + бейдж «свободен с» +
// ячейки по выбранной метрике. Всегда раскрываема (клик → проекты отдела).

type Props = {
  dept: DeptRef;
  cells: LoadCell[];
  periods: Period[];
  nameWidth: number;
  metric: CellMetric;
  freeFrom: string | null;
  expanded: boolean;
  onToggle: () => void;
};

export const DeptRow = ({
  dept,
  cells,
  periods,
  nameWidth,
  metric,
  freeFrom,
  expanded,
  onToggle,
}: Props) => {
  // Видимая подпись — кириллица-аббревиатура отдела (ОПИБ/ОИБ/ТЦ/…), не латиница.
  // Полное название — в тултипе (title).
  const shortName = dept.code ? departmentLabel(dept.code, { short: true }) : dept.name;
  const fullName = dept.code ? departmentLabel(dept.code) : dept.name;
  // Без ёмкости (headcount 0 / нет календаря) «нет окна» врёт — отделяем кейс.
  const hasCapacity = cells.some((c) => c.capacity > 0);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const colW = colWidth(metric);
  return (
  <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }}>
    <button
      onClick={onToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      aria-expanded={expanded}
      title={`${fullName} — ${expanded ? 'свернуть' : 'раскрыть проекты'}`}
      style={{
        width: nameWidth,
        minWidth: nameWidth,
        textAlign: 'left',
        padding: '0 12px',
        height: 46,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 2,
        border: 'none',
        borderRight: `1px solid ${T.border}`,
        background: hover ? T.accentSoft : T.surface,
        cursor: 'pointer',
        fontFamily: 'inherit',
        color: T.text,
        position: 'sticky',
        left: 0,
        zIndex: 1,
        outline: 'none',
        boxShadow: focus ? `inset 0 0 0 2px ${T.accentRing}` : undefined,
        transition: 'background 120ms ease, box-shadow 120ms ease',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: hover || focus ? T.accent : T.textFaint, fontSize: 10, width: 10, transition: 'color 120ms ease' }}>
          {expanded ? '▾' : '▸'}
        </span>
        <span
          title={fullName}
          style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {shortName}
        </span>
        <span style={{ color: T.textFaint, fontSize: 11, fontWeight: 400, whiteSpace: 'nowrap' }}>
          {dept.headcount} чел · ×{dept.capacityFactor}
        </span>
      </span>
      <span style={{ paddingLeft: 16, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>
        {!hasCapacity ? (
          <span style={{ color: T.textFaint }}>ёмкость не задана</span>
        ) : freeFrom ? (
          <span style={{ color: T.ok }}>свободен с {freeFrom}</span>
        ) : (
          <span style={{ color: T.textFaint }}>нет окна в горизонте</span>
        )}
      </span>
    </button>

    {periods.map((p, i) => {
      const cell = cells[i];
      // Метрика «Gap» использует шкалу отклонения (±5/10/15%), иначе — шкалу загрузки.
      const isGap = metric === 'gap';
      const gp = isGap ? gapPct(cell) : null;
      const tone = isGap ? gapTone(gp) : loadTone(cell.ratio);
      const icon = isGap ? gapIcon(gp) : '';
      // REQ-0004 C: конфликт (Demand>ёмкости с учётом HARD-брони) — терракот-обводка
      // + ▲, без смены заливки. Совмещается с accent-обводкой первой колонки.
      const conflict = conflictShadow(cell);
      const firstCol = i === 0 ? `inset 2px 0 0 ${T.accentRing}` : '';
      const boxShadow = [conflict, firstCol].filter(Boolean).join(', ') || undefined;
      return (
        <div
          key={p.key}
          title={`Загрузка ${Math.round(cell.load)} / ${Math.round(cell.capacity)} ч${cell.ratio !== null ? ` (${Math.round(cell.ratio * 100)}%)` : ''} · свободно ${Math.round(cell.free)} ч${isGap ? ` · gap ${Math.round(cell.load - cell.capacity)} ч` : ''}${cell.hardBooking > 0 ? ` · бронь HARD ${Math.round(cell.hardBooking)} ч` : ''}${cell.softBooking > 0 ? ` · бронь SOFT ${Math.round(cell.softBooking)} ч` : ''}${cell.conflict ? ' · ⚠ овербукинг' : ''}`}
          style={{
            flex: 1,
            minWidth: colW,
            height: 46,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            borderRight: `1px solid ${T.border}`,
            background: tone.bg,
            color: tone.fg,
            fontSize: isGap ? 11.5 : 12.5,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            boxShadow,
          }}
        >
          {isGap ? (
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, lineHeight: 1, whiteSpace: 'nowrap' }}>
              {icon && <span aria-hidden style={{ fontSize: 8, alignSelf: 'center' }}>{icon}</span>}
              {cell.conflict && <span aria-hidden title="Овербукинг" style={{ fontSize: 8, alignSelf: 'center', color: T.over }}>▲</span>}
              <span style={{ fontWeight: 600 }}>{formatGapHours(cell)}</span>
              {formatGapPctShort(cell) && (
                <span style={{ fontSize: 9, fontWeight: 500, color: T.textFaint }}>{formatGapPctShort(cell)}</span>
              )}
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              {cell.conflict && <span aria-hidden title="Овербукинг" style={{ fontSize: 9, color: T.over }}>▲</span>}
              {formatCell(metric, cell)}
            </span>
          )}
          <BookingMarker cell={cell} />
        </div>
      );
    })}
    {(() => {
      const avg = avgRatio(cells);
      const tone = loadTone(avg);
      return (
        <div
          title={`Средняя загрузка за горизонт: ${formatPct(avg) || '—'}`}
          style={{
            width: SIGMA_W,
            minWidth: SIGMA_W,
            height: 46,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderLeft: `1px solid ${T.borderStrong}`,
            background: tone.bg,
            color: tone.fg,
            fontSize: 12.5,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatPct(avg)}
        </div>
      );
    })()}
  </div>
  );
};
