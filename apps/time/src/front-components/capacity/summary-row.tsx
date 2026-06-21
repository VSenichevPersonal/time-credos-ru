import { T, loadTone, formatCell, formatPct, formatGapHours, formatGapPctShort, avgRatio, SIGMA_W, colWidth, gapTone, gapPct, gapIcon, conflictShadow, overbookTip } from 'src/front-components/capacity/cap-tokens';
import type { CellMetric, LoadCell, Period } from 'src/front-components/capacity/types';

// Сводная строка «Все отделы»: суммарная загрузка компании по периодам.
// Не раскрываема. Полужирная — визуальный якорь над строками отделов.

type Props = {
  cells: LoadCell[];
  periods: Period[];
  nameWidth: number;
  metric: CellMetric;
};

export const SummaryRow = ({ cells, periods, nameWidth, metric }: Props) => (
  <div style={{ display: 'flex', borderBottom: `1px solid ${T.borderStrong}`, background: T.headerBg }}>
    <div
      style={{
        width: nameWidth,
        minWidth: nameWidth,
        padding: '0 12px',
        height: 34,
        display: 'flex',
        alignItems: 'center',
        borderRight: `1px solid ${T.border}`,
        background: T.headerBg,
        position: 'sticky',
        left: 0,
        zIndex: 1,
        fontSize: 12.5,
        fontWeight: 700,
        color: T.text,
      }}
    >
      Все отделы
    </div>
    {periods.map((p, i) => {
      const cell = cells[i];
      const isGap = metric === 'gap';
      const gp = isGap ? gapPct(cell) : null;
      const tone = isGap ? gapTone(gp) : loadTone(cell.ratio);
      const icon = isGap ? gapIcon(gp) : '';
      // REQ-0004 C: компактная сводка — без подстроки брони (теснит), но конфликт
      // (овербукинг) обводим + ▲, бронь в тултипе.
      const conflict = conflictShadow(cell);
      const firstCol = i === 0 ? `inset 2px 0 0 ${T.accentRing}` : '';
      const boxShadow = [conflict, firstCol].filter(Boolean).join(', ') || undefined;
      return (
        <div
          key={p.key}
          title={`${Math.round(cell.load)} / ${Math.round(cell.capacity)} ч${isGap ? ` · баланс ${Math.round(cell.load - cell.capacity)} ч` : ''}${cell.hardBooking > 0 ? ` · бронь HARD ${Math.round(cell.hardBooking)} ч` : ''}${cell.softBooking > 0 ? ` · бронь SOFT ${Math.round(cell.softBooking)} ч` : ''}${cell.conflict ? ` · ⚠ ${overbookTip(cell)}` : ''}`}
          style={{
            flex: 1,
            minWidth: colWidth(metric),
            height: 34,
            display: 'flex',
            alignItems: isGap ? 'baseline' : 'center',
            justifyContent: 'center',
            gap: isGap ? 2 : 3,
            borderRight: `1px solid ${T.border}`,
            background: tone.bg,
            color: tone.fg,
            fontSize: isGap ? 11.5 : 12.5,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
            boxShadow,
          }}
        >
          {icon && <span aria-hidden style={{ fontSize: isGap ? 8 : 9, alignSelf: 'center' }}>{icon}</span>}
          {cell.conflict && <span aria-hidden title={overbookTip(cell)} style={{ fontSize: isGap ? 8 : 9, alignSelf: 'center', color: T.over }}>▲</span>}
          {isGap ? (
            <>
              <span style={{ fontWeight: 700 }}>{formatGapHours(cell)}</span>
              {formatGapPctShort(cell) && (
                <span style={{ fontSize: 9, fontWeight: 600, color: T.textFaint }}>{formatGapPctShort(cell)}</span>
              )}
            </>
          ) : (
            formatCell(metric, cell)
          )}
        </div>
      );
    })}
    {(() => {
      const avg = avgRatio(cells);
      const tone = loadTone(avg);
      return (
        <div
          title={`Средняя загрузка компании за горизонт: ${formatPct(avg) || '—'}`}
          style={{
            width: SIGMA_W,
            minWidth: SIGMA_W,
            height: 34,
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
