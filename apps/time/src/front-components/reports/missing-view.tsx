import { T, fmtHrs } from 'src/front-components/reports/report-tokens';
import { Bar, pctOfNorm } from 'src/front-components/reports/bar';
import { weekRangeLabel } from 'src/front-components/reports/month-label';
import { useMissing } from 'src/front-components/reports/use-missing';
import { useSortable } from 'src/front-components/shared/use-sortable';
import { SortHeader } from 'src/front-components/shared/sort-header';
import { ErrorState } from 'src/front-components/shared/error-state';
import { departmentLabel } from 'src/constants/labels';
import type { ReminderRow } from 'src/front-components/my-time/reminders-rest';

// Раздел «Незаполненные» в Отчётах: сводная таблица недозаполнивших таймшит за
// ТЕКУЩУЮ неделю (норма−факт по /s/reminders) — руководителю «кого пинговать».
//
// Период-селектор дашборда здесь НЕ применяется: бэк считает фиксированную текущую
// неделю (Timetta: статус заполнения за текущий период). Подпись недели — из ответа.
//
// ПДн (CISO-007): «Сотрудник» = name из бэка как есть (ФИО при revealEmployeeNames,
// иначе стабильный КОД). Сортировка по умолчанию — недобор убыв. (worst first).

type SortKey = 'name' | 'dept' | 'norm' | 'fact' | 'under';

// 6 колонок: имя · отдел · бар загрузки · норма · факт · недобор.
const COLS = '1fr 92px 120px 78px 78px 96px';

const cell = (align: 'left' | 'right' = 'left') =>
  ({
    padding: '0 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums' as const,
  }) as const;

const HeaderRow = ({
  sortKey,
  dir,
  toggle,
}: {
  sortKey: SortKey | null;
  dir: 'asc' | 'desc';
  toggle: (k: SortKey) => void;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: COLS,
      height: 32,
      position: 'sticky',
      top: 0,
      background: T.headerBg,
      borderBottom: `1px solid ${T.borderStrong}`,
      fontSize: 11.5,
      fontWeight: 600,
      color: T.textMuted,
      zIndex: 1,
    }}
  >
    <span style={cell()}>
      <SortHeader label="Сотрудник" active={sortKey === 'name'} dir={dir} onSort={() => toggle('name')} />
    </span>
    <span style={cell()}>
      <SortHeader label="Отдел" active={sortKey === 'dept'} dir={dir} onSort={() => toggle('dept')} />
    </span>
    <span style={cell()}>Заполнено</span>
    <span style={cell('right')}>
      <SortHeader label="Норма, ч" align="right" active={sortKey === 'norm'} dir={dir} onSort={() => toggle('norm')} />
    </span>
    <span style={cell('right')}>
      <SortHeader label="Факт, ч" align="right" active={sortKey === 'fact'} dir={dir} onSort={() => toggle('fact')} />
    </span>
    <span style={cell('right')}>
      <SortHeader label="Недобор, ч" align="right" active={sortKey === 'under'} dir={dir} onSort={() => toggle('under')} />
    </span>
  </div>
);

const SkeletonRows = () => (
  <>
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        aria-hidden
        style={{
          display: 'grid',
          gridTemplateColumns: COLS,
          height: 40,
          borderBottom: `1px solid ${T.border}`,
          background: i % 2 === 1 ? T.rowAlt : 'transparent',
          alignItems: 'center',
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((c) => (
          <span key={c} style={{ padding: '0 10px' }}>
            <span
              style={{
                display: 'block',
                height: 10,
                width: c === 0 ? '60%' : c === 2 ? '100%' : '50%',
                marginLeft: c >= 3 ? 'auto' : 0,
                borderRadius: 6,
                background: T.headerBg,
                // Тихая пульсация — состояние загрузки, не декор.
                animation: 'credosPulse 1200ms ease-in-out infinite',
              }}
            />
          </span>
        ))}
      </div>
    ))}
    <style>{`@keyframes credosPulse{0%,100%{opacity:.45}50%{opacity:.9}}`}</style>
  </>
);

const sortValue = (key: SortKey | null, r: ReminderRow): number | string => {
  switch (key) {
    case 'name':
      return r.name.toLowerCase();
    case 'dept':
      return (departmentLabel(r.deptCode, { short: true }) || r.deptCode).toLowerCase();
    case 'norm':
      return r.norm;
    case 'fact':
      return r.fact;
    default:
      return r.under;
  }
};

export const MissingView = () => {
  const { loading, error, enabled, week, rows, reload } = useMissing();
  const { key: sortKey, dir, toggle, sort } = useSortable<SortKey>('under');

  const weekLabel = week ? weekRangeLabel(week.from, week.to) : null;
  const sorted = sort(rows, (r) => sortValue(sortKey, r));

  // Состояния, в приоритете: ошибка → загрузка → выключено → пусто → таблица.
  const body = () => {
    if (error) {
      return (
        <ErrorState
          title="Не удалось загрузить статус заполнения"
          detail={error}
          onRetry={reload}
        />
      );
    }

    if (loading) {
      return (
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <HeaderRow sortKey={sortKey} dir={dir} toggle={toggle} />
          <SkeletonRows />
        </div>
      );
    }

    // Напоминания выключены в настройках — учим, где включить (а не «пусто»).
    if (!enabled) {
      return (
        <EmptyBox
          glyph="🔕"
          title="Напоминания выключены"
          hint="Включите напоминания о заполнении таймшита в настройках учёта времени — здесь появится сводка по недозаполнившим за неделю."
        />
      );
    }

    // Все заполнили — недоборов нет.
    if (rows.length === 0) {
      return (
        <EmptyBox
          glyph="🎉"
          title="Все заполнили — недоборов нет"
          hint={weekLabel ? `За ${weekLabel} норма закрыта у всех сотрудников.` : 'Норма недели закрыта у всех сотрудников.'}
        />
      );
    }

    return (
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <HeaderRow sortKey={sortKey} dir={dir} toggle={toggle} />
        {sorted.map((r, i) => {
          const dept = departmentLabel(r.deptCode, { short: true }) || r.deptCode || '—';
          return (
            <div
              key={r.employeeId}
              style={{
                display: 'grid',
                gridTemplateColumns: COLS,
                height: 40,
                borderBottom: `1px solid ${T.border}`,
                background: i % 2 === 1 ? T.rowAlt : 'transparent',
                fontSize: 12.5,
              }}
            >
              <span style={{ ...cell(), fontWeight: 500 }} title={r.name}>
                {r.name}
              </span>
              <span style={{ ...cell(), color: T.textMuted }} title={departmentLabel(r.deptCode) || r.deptCode}>
                {dept}
              </span>
              <span style={cell()}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <span style={{ flex: 1 }}>
                    <Bar value={r.fact} max={r.norm} />
                  </span>
                  <span style={{ fontSize: 11, color: T.textFaint, minWidth: 32, textAlign: 'right' }}>
                    {pctOfNorm(r.fact, r.norm)}
                  </span>
                </span>
              </span>
              <span style={{ ...cell('right'), color: T.textMuted }}>{fmtHrs(r.norm)}</span>
              <span style={{ ...cell('right'), fontWeight: 600 }}>{fmtHrs(r.fact)}</span>
              {/* Недобор — действенная проблема: мягкий warn-тинт (не нейтраль). */}
              <span
                style={{
                  ...cell('right'),
                  fontWeight: 600,
                  color: T.warnSolid,
                  background: T.warnTint,
                  borderRadius: 6,
                }}
              >
                −{fmtHrs(r.under)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Контекст-полоса: неделя + сколько недозаполнили (когда есть данные). */}
      {!error && !loading && enabled && (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
            padding: '10px 14px 0',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
            Незаполненные таймшиты
          </span>
          {weekLabel && (
            <span style={{ fontSize: 12, color: T.textMuted }}>неделя {weekLabel}</span>
          )}
          {rows.length > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 12,
                fontWeight: 600,
                color: T.warnSolid,
                background: T.warnTint,
                padding: '2px 9px',
                borderRadius: 999,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {rows.length} {plural(rows.length, 'сотрудник', 'сотрудника', 'сотрудников')}
            </span>
          )}
        </div>
      )}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          margin: '10px 14px 14px',
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          overflow: 'hidden',
          background: T.surface,
        }}
      >
        {body()}
      </div>
    </div>
  );
};

// Русское склонение числительного (1 сотрудник / 2 сотрудника / 5 сотрудников).
const plural = (n: number, one: string, few: string, many: string): string => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
};

// Пустое/выключенное состояние — учит интерфейсу, не «ничего нет».
const EmptyBox = ({ glyph, title, hint }: { glyph: string; title: string; hint: string }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 160,
      height: '100%',
      padding: 24,
      textAlign: 'center',
    }}
  >
    <span aria-hidden style={{ fontSize: 30, lineHeight: 1 }}>
      {glyph}
    </span>
    <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{title}</span>
    <span style={{ fontSize: 12, color: T.textMuted, maxWidth: 360, lineHeight: 1.5 }}>{hint}</span>
  </div>
);
