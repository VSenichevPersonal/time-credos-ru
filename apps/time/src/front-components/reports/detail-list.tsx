import { useEffect, useState } from 'react';

import { T, fmtHrs } from 'src/front-components/reports/report-tokens';
import { Center } from 'src/front-components/grid/center';
import { ErrorState } from 'src/front-components/shared/error-state';
import { fetchDetailRows, type DetailFilters, type DetailRow } from 'src/front-components/reports/reports-rest';
import type { OlapDim, OlapFilter } from 'src/front-components/reports/olap-types';

// REQ-0006 п.3: drill-до-записей — inline-лист отдельных записей под таблицей среза,
// когда пользователь выбрал строку-«лист» (дальше проваливаться некуда). Источник —
// /s/reports groupBy=detail (computeDetail на бэке, 7 колонок MVP).
//
// CISO-007 (152-ФЗ): бэк отдаёт КОД сотрудника, а не ФИО (revealNames=false — нет
// доверенного server-identity, см. reports-detail.ts). Поэтому листа без ПДн: reveal
// ФИО появится отдельным контуром, когда будет identity (TODO CISO-005). До тех пор
// строки различимы по коду — ПДн не утекают.

// Ось drill → ключ detail-фильтра. detail умеет только dept/project/employee;
// прочие оси (category/workType/…) в detail-фильтр не проецируются.
const DIM_TO_DETAIL: Partial<Record<OlapDim, keyof DetailFilters>> = {
  dept: 'deptId',
  project: 'projectId',
  employee: 'employeeId',
};

// Чистая, тестируемая. Строит detail-фильтр из накопленного пути drill + выбранной
// листовой строки (её ось + ключ). Возвращает null, если ось листа не проецируется
// в detail (category/workType) — тогда inline-лист не показываем (нет контракта).
export const leafDetailFilter = (
  path: OlapFilter[],
  leafAxis: OlapDim,
  leafKey: string,
): DetailFilters | null => {
  const leafField = DIM_TO_DETAIL[leafAxis];
  if (!leafField) return null;
  const filters: DetailFilters = {};
  for (const f of path) {
    const field = DIM_TO_DETAIL[f.dim];
    if (field) filters[field] = f.value;
  }
  filters[leafField] = leafKey;
  return filters;
};

// Мягкая нормализация статуса записи к русскому ярлыку (бэк отдаёт raw — Pascal/UPPER).
const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  submitted: 'На согласовании',
  approved: 'Согласовано',
  rejected: 'Отклонено',
};
const STATUS_TONE: Record<string, { fg: string; bg: string }> = {
  approved: { fg: T.ok, bg: T.okSoft },
  submitted: { fg: T.accent, bg: T.accentSoft },
  rejected: { fg: T.over, bg: T.overSoft },
  draft: { fg: T.textMuted, bg: T.headerBg },
};
const statusKey = (s: string): string => s.toLowerCase();
const statusLabel = (s: string): string => (s ? STATUS_LABELS[statusKey(s)] ?? s : '—');

const COLS = '96px 1fr 1.4fr 1fr 72px 124px';

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

type Props = {
  from: string;
  to: string;
  filters: DetailFilters;
  title: string;
  onClose: () => void;
};

export const DetailList = ({ from, to, filters, title, onClose }: Props) => {
  const [state, setState] = useState<{ loading: boolean; error: string | null; rows: DetailRow[]; count: number }>({
    loading: true,
    error: null,
    rows: [],
    count: 0,
  });

  const load = () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    void fetchDetailRows(from, to, filters).then((r) =>
      setState({ loading: false, error: r.ok ? null : r.error ?? 'Ошибка', rows: r.rows, count: r.count }),
    );
  };

  // Перезапрос при смене периода/фильтра.
  useEffect(load, [from, to, filters.deptId, filters.projectId, filters.employeeId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        flex: '0 0 auto',
        maxHeight: '42%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        margin: '0 14px 14px',
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        background: T.surface,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderBottom: `1px solid ${T.border}`,
          background: T.panelBg,
        }}
      >
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>Записи: {title}</span>
        {!state.loading && !state.error && (
          <span style={{ fontSize: 12, color: T.textMuted, fontVariantNumeric: 'tabular-nums' }}>{state.count}</span>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Свернуть список записей"
          style={{
            marginLeft: 'auto',
            width: 24,
            height: 24,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            background: T.surface,
            color: T.textMuted,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {state.error ? (
        <ErrorState title="Не удалось загрузить записи" detail={state.error} onRetry={load} />
      ) : state.loading ? (
        <Center>Загрузка записей…</Center>
      ) : state.rows.length === 0 ? (
        <Center>За период по этому срезу записей нет.</Center>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: COLS,
              height: 30,
              position: 'sticky',
              top: 0,
              background: T.headerBg,
              borderBottom: `1px solid ${T.borderStrong}`,
              fontSize: 11,
              fontWeight: 600,
              color: T.textMuted,
              zIndex: 1,
            }}
          >
            <span style={cell()}>Дата</span>
            <span style={cell()}>Сотрудник</span>
            <span style={cell()}>Проект</span>
            <span style={cell()}>Вид работ</span>
            <span style={cell('right')}>Часы</span>
            <span style={cell()}>Статус</span>
          </div>
          {state.rows.map((r, i) => {
            const tone = STATUS_TONE[statusKey(r.status)] ?? { fg: T.textMuted, bg: T.headerBg };
            return (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: COLS,
                  height: 34,
                  borderBottom: `1px solid ${T.border}`,
                  background: i % 2 === 1 ? T.rowAlt : 'transparent',
                  fontSize: 12,
                }}
              >
                <span style={{ ...cell(), color: T.textMuted }}>{r.date}</span>
                <span style={cell()} title={r.employeeName}>{r.employeeName || '—'}</span>
                <span style={cell()} title={r.projectName}>{r.projectName || '—'}</span>
                <span style={cell()} title={r.workTypeName}>{r.workTypeName || '—'}</span>
                <span style={{ ...cell('right'), fontWeight: 600 }}>{fmtHrs(r.hours)}</span>
                <span style={cell()}>
                  {r.status ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: tone.fg,
                        background: tone.bg,
                        padding: '2px 8px',
                        borderRadius: 999,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {statusLabel(r.status)}
                    </span>
                  ) : (
                    <span style={{ color: T.textFaint }}>—</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
