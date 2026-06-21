import { useState } from 'react';

import { HourCell } from 'src/front-components/grid/hour-cell';
import { RowMenu } from 'src/front-components/grid/row-menu';
import type { CommentDay } from 'src/front-components/grid/row-menu';
import { recallPlanForCell, recallPlanForRow, type RecallPlan } from 'src/front-components/grid/recall-action';
import { TagChips } from 'src/front-components/grid/tag-chips';
import { T } from 'src/front-components/grid/tokens';
import { GRID_TEMPLATE, GRID_TEMPLATE_SINGLE } from 'src/front-components/grid/week-header';
import { fmtTotal } from 'src/front-components/grid/format';
import { categoryMeta } from 'src/front-components/shared/category-meta';
import type { WeekDay } from 'src/front-components/grid/use-week';
import type { Nav } from 'src/front-components/grid/use-keyboard';
import type { NormForDay } from 'src/front-components/grid/use-daily-norm';

// Строка сетки. Две левых колонки: «Проект» (цвет-точка категории + код/клиент,
// 600) и «Вид работ» (название читаемого кегля 13/500, не tiny-faint) + 7 ячеек
// часов + итог. Ячейки адресуются (rowIndex, dayIndex) для клавиатуры.
//
// singleColumn=true (режим «Проект»): проект фиксирован селектором сверху —
// левая колонка одна, в ней рендерится вид работ как основная метка.

type Props = {
  rowIndex: number;
  projectName: string;
  category: string | null;
  workTypeName: string;
  tags?: string[]; // W3-2: теги записей строки (чипы под видом работ)
  singleColumn?: boolean; // режим «Проект»: только колонка «Вид работ»
  days: WeekDay[];
  hoursByDay: number[];
  lockedByDay?: boolean[];
  entryIdByDay?: (string | null)[]; // WI-10: id записей строки по дням (для отзыва)
  statusByDay?: (string | null)[]; // WI-10: статус записей строки по дням (для отзыва)
  isManager?: boolean; // WI-10: UI-гейт revoke (серверный гард в /s/approval)
  onRecall?: (plan: RecallPlan) => void; // WI-10: отозвать согласование/отправку записей
  normFor?: NormForDay; // W3A.17: норма дня — бледный плейсхолдер в пустой ячейке
  overtimeThreshold?: number; // REQ-0019: порог переработки/день из настроек
  rowTotal: number;
  alt: boolean;
  nav: Nav;
  onCellCommit: (dayIso: string, hours: number) => void;
  onDuplicate?: () => void; // W3-1: дублировать строку (тот же проект, новый вид работ)
  onFillWeekdays?: () => void; // меню строки: 8 ч во все пустые будни
  onClearRow?: () => void; // меню строки: обнулить все часы строки
  onDeleteRow?: () => void; // меню строки: убрать строку из сетки
  onCommitDescription?: (dayIso: string, text: string) => void; // комментарий к ячейке (Неделя)
  descByDay?: (string | null)[]; // описания записей строки по дням
};

export const GridRow = ({
  rowIndex,
  projectName,
  category,
  workTypeName,
  tags,
  singleColumn,
  days,
  hoursByDay,
  lockedByDay,
  entryIdByDay,
  statusByDay,
  isManager,
  onRecall,
  normFor,
  overtimeThreshold,
  rowTotal,
  alt,
  nav,
  onCellCommit,
  onDuplicate,
  onFillWeekdays,
  onClearRow,
  onDeleteRow,
  onCommitDescription,
  descByDay,
}: Props) => {
  const rowLocked = (lockedByDay ?? []).length > 0 && (lockedByDay ?? []).every(Boolean);
  const hasHours = hoursByDay.some((h) => h > 0);
  // WI-01: дни строки с часами — цели для «Комментарий к записи…» в меню ⋯
  // (раньше ✎-кнопка жила в ячейке и была недостижима мышью).
  const commentDays: CommentDay[] = days.map((day, i) => ({
    dayIso: day.iso,
    label: `${day.dayLabel} ${day.dateLabel}`,
    hours: hoursByDay[i] ?? 0,
    description: descByDay?.[i] ?? null,
    locked: lockedByDay?.[i],
  }));
  // W3A.11: счётчик записей для confirm удаления — дни с проставленными часами.
  const recordCount = hoursByDay.filter((h) => h > 0).length;

  // WI-10: отзыв согласования/отправки из строки. План считается по статусам
  // записей строки (revoke APPROVED руководителем / recall SUBMITTED владельцем).
  // Клик по 🔒-ячейке шлёт сигнал в меню (открыть подтверждение) — не тупик.
  const rowRecall =
    onRecall && entryIdByDay && statusByDay
      ? recallPlanForRow({ entryIdByDay, statusByDay }, isManager === true)
      : null;
  const [recallSignal, setRecallSignal] = useState(0);
  const triggerCellRecall = (dayIndex: number) => {
    if (!onRecall || !entryIdByDay || !statusByDay) return;
    const plan = recallPlanForCell(entryIdByDay[dayIndex], statusByDay[dayIndex], isManager === true);
    if (!plan) return;
    // Поповер-подтверждение (или подсказка о правах) открывается в меню строки.
    setRecallSignal((n) => n + 1);
  };

  const menu = onDuplicate && (
    <RowMenu
      rowLocked={rowLocked}
      hasHours={hasHours}
      recordCount={recordCount}
      onDuplicate={onDuplicate}
      onFillWeekdays={() => onFillWeekdays?.()}
      onClearRow={() => onClearRow?.()}
      onDeleteRow={() => onDeleteRow?.()}
      commentDays={commentDays}
      onCommitComment={
        onCommitDescription ? (dayIso, text) => onCommitDescription(dayIso, text) : undefined
      }
      recall={rowRecall ? { mode: rowRecall.mode, denied: rowRecall.deniedReason } : null}
      onRecall={rowRecall && onRecall ? () => onRecall(rowRecall) : undefined}
      openRecallSignal={recallSignal}
    />
  );
  return (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: singleColumn ? GRID_TEMPLATE_SINGLE : GRID_TEMPLATE,
      background: alt ? T.rowAlt : T.surface,
      borderBottom: `1px solid ${T.border}`,
    }}
  >
    {singleColumn ? (
      // Режим «Проект»: одна левая колонка — вид работ как основная метка.
      <div style={{ padding: '6px 12px', borderRight: `1px solid ${T.border}`, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <span
            aria-hidden
            title={category ? categoryMeta(category).label : undefined}
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
              fontSize: 13,
              fontWeight: 600,
              color: T.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
            }}
          >
            {projectName}
          </div>
          {menu}
        </div>
        <TagChips tags={tags} />
      </div>
    ) : (
      <>
        {/* Колонка «Проект»: цвет-точка категории + код/клиент. */}
        <div style={{ padding: '6px 12px', borderRight: `1px solid ${T.border}`, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            <span
              aria-hidden
              title={category ? categoryMeta(category).label : undefined}
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
                fontSize: 13,
                fontWeight: 600,
                color: T.text,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
              }}
            >
              {projectName}
            </div>
            {menu}
          </div>
          <TagChips tags={tags} />
        </div>

        {/* Колонка «Вид работ»: читаемый кегль (13/500, цвет text), не серый-мелкий. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 12px',
            borderRight: `1px solid ${T.border}`,
            minWidth: 0,
          }}
        >
          <div
            title={workTypeName}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: workTypeName ? T.text : T.textFaint,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {workTypeName || '—'}
          </div>
        </div>
      </>
    )}

    {days.map((day, i) => (
      <HourCell
        key={day.iso}
        value={hoursByDay[i]}
        weekend={day.isWeekend}
        today={day.isToday}
        locked={lockedByDay?.[i]}
        normHint={normFor ? normFor(day.iso, day.isWeekend) : undefined}
        overtimeThreshold={overtimeThreshold}
        active={nav.isActive(rowIndex, i)}
        selected={nav.isSelected(rowIndex, i)}
        seed={nav.isActive(rowIndex, i) ? nav.editSeed : null}
        description={descByDay?.[i] ?? null}
        onActivate={(extend) =>
          extend
            ? nav.extendTo({ row: rowIndex, col: i })
            : nav.setActive({ row: rowIndex, col: i })
        }
        onCommit={(h) => onCellCommit(day.iso, h)}
        onKey={(e) => nav.handleKey(e)}
        onSeedConsumed={nav.consumeSeed}
        onLockedClick={rowRecall ? () => triggerCellRecall(i) : undefined}
      />
    ))}

    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 12px',
        fontSize: 13,
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        color: rowTotal > 0 ? T.text : T.textFaint,
      }}
    >
      {fmtTotal(rowTotal)}
    </div>
  </div>
  );
};
