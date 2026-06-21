import { useState } from 'react';

import { T, fmtHrs } from 'src/front-components/reports/report-tokens';
import { Center } from 'src/front-components/grid/center';
import { ErrorBoundary } from 'src/front-components/shared/error-boundary';
import { useTimesheetGrid } from 'src/front-components/reports/timesheet-grid/use-timesheet-grid';
import { fetchTimesheetGridCsv } from 'src/front-components/reports/timesheet-grid/timesheet-grid-rest';
import type { T13Cell } from 'src/front-components/reports/timesheet-grid/types';

// REQ-0006 п.4: экран «Табель Т-13» — сетка сотрудник×день за месяц + Итого.
// Источник — /s/reports groupBy=timesheet-grid. Песочница-safe (REST, без host-DOM).
// codes=true → буквенные коды (Я/ОТ/Б/…). CSV — текст для копирования (нет скачивания).

const NAME_W = 220;
const DAY_W = 30;
const TOTAL_W = 56;

const isWeekendIso = (iso: string): boolean => {
  const d = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return d === 0 || d === 6;
};

// Содержимое ячейки: код приоритетнее часов (Т-13), иначе часы, иначе пусто.
const cellText = (c: T13Cell, withCodes: boolean): string => {
  if (withCodes && c.code) return c.code;
  return c.hours > 0 ? fmtHrs(c.hours) : '';
};

const btn = (active?: boolean) =>
  ({
    height: 28,
    padding: '0 11px',
    fontSize: 12,
    fontWeight: 500,
    border: `1px solid ${active ? T.accent : T.border}`,
    borderRadius: 7,
    background: active ? T.accentSoft : T.surface,
    color: active ? T.accent : T.textMuted,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap' as const,
  }) as const;

const Grid = () => {
  const { data, loading, label, from, to, withCodes, setWithCodes, prev, next } = useTimesheetGrid();
  const [csv, setCsv] = useState<{ status: 'idle' | 'loading' | 'ready' | 'error'; text: string; error: string }>({
    status: 'idle',
    text: '',
    error: '',
  });

  const runCsv = () => {
    setCsv({ status: 'loading', text: '', error: '' });
    void fetchTimesheetGridCsv(from, to, { withCodes }).then((r) =>
      r.ok
        ? setCsv({ status: 'ready', text: r.csv, error: '' })
        : setCsv({ status: 'error', text: '', error: r.error ?? 'Ошибка' }),
    );
  };

  const cols = `${NAME_W}px repeat(${data.dates.length}, ${DAY_W}px) ${TOTAL_W}px`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.bg, color: T.text, overflow: 'hidden' }}>
      {/* Тулбар */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>Табель Т-13</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
          <button onClick={prev} aria-label="Предыдущий месяц" style={{ ...btn(), width: 28, padding: 0 }}>‹</button>
          <span style={{ minWidth: 130, textAlign: 'center', fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{label}</span>
          <button onClick={next} aria-label="Следующий месяц" style={{ ...btn(), width: 28, padding: 0 }}>›</button>
        </span>
        <button onClick={() => setWithCodes((v) => !v)} style={btn(withCodes)} title="Буквенные коды Т-13 (Я/ОТ/Б/…) вместо часов в дни отсутствий">
          Коды Т-13
        </button>
        <button onClick={runCsv} style={{ ...btn(), marginLeft: 'auto' }}>Экспорт CSV</button>
      </div>

      {csv.status !== 'idle' && (
        <div style={{ padding: '8px 14px', borderBottom: `1px solid ${T.border}`, background: T.panelBg, fontSize: 12 }}>
          {csv.status === 'loading' && <span style={{ color: T.textMuted }}>Готовлю CSV…</span>}
          {csv.status === 'error' && <span style={{ color: T.over }}>{csv.error}</span>}
          {csv.status === 'ready' && (
            <div>
              <span style={{ color: T.textMuted }}>CSV (выделите и скопируйте — скачивание из песочницы недоступно):</span>
              <textarea
                readOnly
                value={csv.text}
                style={{ width: '100%', height: 90, marginTop: 4, fontFamily: 'monospace', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 6, padding: 6, boxSizing: 'border-box' }}
              />
            </div>
          )}
        </div>
      )}

      {/* Сетка */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {loading && data.rows.length === 0 ? (
          <Center>Загрузка табеля…</Center>
        ) : !data.ok ? (
          <Center>{data.error ?? 'Нет данных табеля'}</Center>
        ) : data.rows.length === 0 ? (
          <Center>За {label} нет списанных часов.</Center>
        ) : (
          <div style={{ minWidth: NAME_W + data.dates.length * DAY_W + TOTAL_W }}>
            {/* Заголовок дней */}
            <div style={{ display: 'grid', gridTemplateColumns: cols, position: 'sticky', top: 0, zIndex: 2, background: T.headerBg, borderBottom: `1px solid ${T.borderStrong}` }}>
              <div style={{ position: 'sticky', left: 0, zIndex: 1, background: T.headerBg, padding: '0 10px', height: 32, display: 'flex', alignItems: 'center', fontSize: 11.5, fontWeight: 600, color: T.textMuted, borderRight: `1px solid ${T.border}` }}>
                Сотрудник
              </div>
              {data.dates.map((iso) => {
                const we = isWeekendIso(iso);
                return (
                  <div key={iso} title={iso} style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: we ? T.textFaint : T.textMuted, background: we ? T.panelBg : 'transparent', borderRight: `1px solid ${T.border}` }}>
                    {Number(iso.slice(8, 10))}
                  </div>
                );
              })}
              <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px', fontSize: 11.5, fontWeight: 700, color: T.text }}>
                Итого
              </div>
            </div>

            {/* Строки сотрудников */}
            {data.rows.map((row, ri) => (
              <div key={row.employeeKey} style={{ display: 'grid', gridTemplateColumns: cols, borderBottom: `1px solid ${T.border}`, background: ri % 2 === 1 ? T.rowAlt : 'transparent' }}>
                <div title={`${row.employeeName} · ${row.deptName}`} style={{ position: 'sticky', left: 0, zIndex: 1, background: ri % 2 === 1 ? T.rowAlt : T.bg, padding: '0 10px', height: 30, display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 500, borderRight: `1px solid ${T.border}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.employeeName}
                </div>
                {row.cells.map((c, i) => {
                  const we = isWeekendIso(data.dates[i]);
                  const txt = cellText(c, data.withCodes);
                  const isCode = data.withCodes && !!c.code;
                  return (
                    <div key={i} style={{ height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontVariantNumeric: 'tabular-nums', color: isCode ? T.textMuted : c.hours > 0 ? T.text : T.textFaint, background: we ? T.panelBg : 'transparent', borderRight: `1px solid ${T.border}` }}>
                      {txt}
                    </div>
                  );
                })}
                <div style={{ height: 30, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px', fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {row.total > 0 ? fmtHrs(row.total) : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const TimesheetGridScreen = () => (
  <ErrorBoundary title="Не удалось показать табель">
    <Grid />
  </ErrorBoundary>
);
