import { HourCell } from 'src/front-components/grid/hour-cell';
import { TagChips } from 'src/front-components/grid/tag-chips';
import { T } from 'src/front-components/grid/tokens';
import { GRID_TEMPLATE, GRID_TEMPLATE_SINGLE } from 'src/front-components/grid/week-header';
import { fmtTotal } from 'src/front-components/grid/format';
import { categoryMeta } from 'src/front-components/shared/category-meta';
import type { WeekDay } from 'src/front-components/grid/use-week';
import type { Nav } from 'src/front-components/grid/use-keyboard';

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
  overtimeThreshold?: number; // REQ-0019: порог переработки/день из настроек
  rowTotal: number;
  alt: boolean;
  nav: Nav;
  onCellCommit: (dayIso: string, hours: number) => void;
  onFill?: (value: number) => void; // U5: заполнить будни строки значением ячейки
  onDuplicate?: () => void; // W3-1: дублировать строку (тот же проект, новый вид работ)
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
  overtimeThreshold,
  rowTotal,
  alt,
  nav,
  onCellCommit,
  onFill,
  onDuplicate,
}: Props) => (
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
            {onDuplicate && <DuplicateButton onClick={onDuplicate} />}
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
        overtimeThreshold={overtimeThreshold}
        active={nav.isActive(rowIndex, i)}
        seed={nav.isActive(rowIndex, i) ? nav.editSeed : null}
        onActivate={() => nav.setActive({ row: rowIndex, col: i })}
        onCommit={(h) => onCellCommit(day.iso, h)}
        onFill={onFill ? () => onFill(hoursByDay[i]) : undefined}
        onKey={(e) => nav.handleKey(e)}
        onSeedConsumed={nav.consumeSeed}
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

// W3-1 (Kimai Duplicate): иконка «⧉» — дублировать строку. Подставляет тот же
// проект в форму добавления ниже, вид работ и часы вводятся заново.
const DuplicateButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    title="Дублировать строку: тот же проект, выберите вид работ"
    aria-label="Дублировать строку"
    style={{
      flexShrink: 0,
      width: 22,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      border: 'none',
      borderRadius: 6,
      background: 'transparent',
      color: T.textMuted,
      cursor: 'pointer',
      fontSize: 13,
      lineHeight: 1,
      fontFamily: 'inherit',
    }}
  >
    ⧉
  </button>
);
