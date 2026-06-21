import { useState } from 'react';

import { T, loadTone, formatCell, formatPct, formatGapHours, formatGapPctShort, avgRatio, SIGMA_W, colWidth, gapTone, gapPct, gapIcon, conflictShadow } from 'src/front-components/capacity/cap-tokens';
import { BookingMarker } from 'src/front-components/capacity/booking-marker';
import { EmployeePlanPanel } from 'src/front-components/capacity/employee-plan-panel';
import { departmentLabel } from 'src/constants/labels';
import type {
  CapProject,
  CellMetric,
  EmployeeRef,
  LoadCell,
  Period,
} from 'src/front-components/capacity/types';

// Строка сотрудника (срез «по людям»): имя + код отдела + ячейки личной ёмкости.
// Без раскрытия — лист дерева. Личная ёмкость из произв. календаря × коэф отдела.
// В режиме планирования (planning) — кнопка «✎ План» → персональный план по
// месяцам (employee-plan-panel, слоты с employeeId). Раньше план-на-человека был
// недоступен (тумблер перекидывал на «Отделы»).

type Props = {
  employee: EmployeeRef;
  deptCode: string | null;
  cells: LoadCell[];
  periods: Period[];
  nameWidth: number;
  metric: CellMetric;
  planning?: boolean; // режим планирования → показать персональный план
  projects?: CapProject[]; // проекты для привязки персонального слота
  onSavedPlan?: () => void; // перезагрузка доски после сохранения
};

export const EmployeeRow = ({
  employee,
  deptCode,
  cells,
  periods,
  nameWidth,
  metric,
  planning,
  projects,
  onSavedPlan,
}: Props) => {
  // Поповер «✎ План» живёт в этой sticky-ячейке (stacking-контекст zIndex:1).
  // При открытии поднимаем ячейку выше соседних строк, иначе их sticky-ячейки
  // (тот же zIndex, позже в DOM) перекрывают поповер → «карточка уезжает».
  const [panelOpen, setPanelOpen] = useState(false);
  return (
  <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, alignItems: 'stretch' }}>
    <div
      style={{
        width: nameWidth,
        minWidth: nameWidth,
        padding: planning ? '6px 12px' : '0 12px',
        minHeight: 40,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 1,
        borderRight: `1px solid ${T.border}`,
        background: T.surface,
        position: 'sticky',
        left: 0,
        zIndex: panelOpen ? 30 : 1,
      }}
    >
      <span
        title={employee.name}
        style={{
          fontSize: 12.5,
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {employee.name}
      </span>
      <span style={{ fontSize: 10.5, color: T.textFaint, whiteSpace: 'nowrap' }}>
        {deptCode ? departmentLabel(deptCode, { short: true }) : 'без отдела'}
      </span>
      {planning && (
        <div style={{ marginTop: 3 }}>
          <EmployeePlanPanel
            employee={employee}
            projects={projects ?? []}
            onSaved={onSavedPlan}
            onOpenChange={setPanelOpen}
          />
        </div>
      )}
    </div>

    {periods.map((p, i) => {
      const cell = cells[i];
      const isGap = metric === 'gap';
      const gp = isGap ? gapPct(cell) : null;
      const tone = isGap ? gapTone(gp) : loadTone(cell.ratio);
      const icon = isGap ? gapIcon(gp) : '';
      // REQ-0004 C: конфликт-обводка (овербукинг) + индикатор брони (см. dept-row).
      const conflict = conflictShadow(cell);
      const firstCol = i === 0 ? `inset 2px 0 0 ${T.accentRing}` : '';
      const boxShadow = [conflict, firstCol].filter(Boolean).join(', ') || undefined;
      return (
        <div
          key={p.key}
          title={`Загрузка ${Math.round(cell.load)} / ${Math.round(cell.capacity)} ч${cell.ratio !== null ? ` (${Math.round(cell.ratio * 100)}%)` : ''} · свободно ${Math.round(cell.free)} ч${isGap ? ` · баланс ${Math.round(cell.load - cell.capacity)} ч` : ''}${cell.hardBooking > 0 ? ` · бронь HARD ${Math.round(cell.hardBooking)} ч` : ''}${cell.softBooking > 0 ? ` · бронь SOFT ${Math.round(cell.softBooking)} ч` : ''}${cell.conflict ? ' · ⚠ овербукинг' : ''}`}
          style={{
            flex: 1,
            minWidth: colWidth(metric),
            minHeight: 40,
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
            minHeight: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderLeft: `1px solid ${T.borderStrong}`,
            background: tone.bg,
            color: tone.fg,
            fontSize: 12,
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
