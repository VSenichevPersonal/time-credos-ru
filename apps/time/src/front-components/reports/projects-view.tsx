import { useState } from 'react';

import { T, fmtHrs } from 'src/front-components/reports/report-tokens';
import { useSortable } from 'src/front-components/shared/use-sortable';
import { SortHeader } from 'src/front-components/shared/sort-header';
import { ErrorState } from 'src/front-components/shared/error-state';
import { useProjectsPlanFact } from 'src/front-components/reports/use-projects-plan-fact';
import { PROJECT_STATUS_OPTIONS } from 'src/constants/select-options';
import type {
  ProjectPlanFactRow,
  ProjectsPlanFactTotals,
} from 'src/front-components/reports/report-types';

// Отчёт «Проекты — бюджет/распланировано/факт/остаток» (REPORTS_COMPLETENESS P1,
// аналог Timetta «Список проектов в работе»). Часы, без денег [[no-billable-concept]].
// B1-витрина: бэк отдаёт ТРИ величины (бюджет=planned · распланировано=allocated ·
// факт) + остаток освоения + переаллокацию (overbooked). РП видит сверху проекты в
// перерасходе (бэк сортирует overrun → факт), подсветка терракотом + знак не только
// цветом: ▲ «перерасход» (факт>бюджет, терракот) и ⚠ «переаллокация» (распланировано>
// бюджет, янтарь). Опц. фильтр статуса.

type SortKey = 'name' | 'status' | 'planned' | 'allocated' | 'fact' | 'remaining' | 'pct';

// 8 колонок: проект (код+имя) · статус · бюджет · распланировано (+покрытие) · факт ·
// остаток · % освоения · флаги.
const COLS = '1fr 110px 88px 132px 88px 96px 60px 124px';

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

// Метаданные статуса (label/цвет) из SSOT select-options. Неизвестный код → серый.
const STATUS_META: Record<string, { label: string; tone: string; bg: string }> = {
  PLANNED: { label: 'Запланирован', tone: T.textMuted, bg: T.headerBg },
  ACTIVE: { label: 'В работе', tone: T.ok, bg: T.okSoft },
  ON_HOLD: { label: 'Приостановлен', tone: T.warn, bg: T.warnTint },
  DONE: { label: 'Завершён', tone: T.accent, bg: T.accentSoft },
};

const StatusBadge = ({ status }: { status: string | null }) => {
  if (!status) return <span style={{ color: T.textFaint, fontSize: 12 }}>—</span>;
  const m = STATUS_META[status] ?? { label: status, tone: T.textMuted, bg: T.headerBg };
  return (
    <span
      style={{
        fontSize: 11.5,
        fontWeight: 600,
        color: m.tone,
        background: m.bg,
        padding: '2px 8px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      {m.label}
    </span>
  );
};

// Процент выработки: null → «—». Знак перерасхода передаётся отдельно (>100%).
const fmtPct = (pct: number | null): string =>
  pct === null ? '—' : `${Math.round(pct * 100)}%`;

// Опции статус-фильтра: «Все» + значения SELECT. '' = без фильтра (все статусы).
const STATUS_OPTS = [
  { value: '', label: 'Все' },
  ...PROJECT_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
];

// KPI-полоска (B1): Σ бюджет / распланировано / факт / остаток + счётчики
// перерасхода (факт>бюджет, терракот) и переаллокации (распланировано>бюджет, янтарь).
const Kpi = ({ totals }: { totals: ProjectsPlanFactTotals }) => {
  const overWarn = totals.overrunCount > 0;
  const obWarn = (totals.overbookedCount ?? 0) > 0;
  const remNeg = totals.remaining < 0;
  // Остаток распределения = бюджет − распланировано (< 0 = распланировано сверх бюджета).
  const unalloc = totals.unallocated ?? 0;
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '12px 14px' }}>
      <KpiCard label="Бюджет, ч" value={fmtHrs(totals.planned)} hint="план по проектам" />
      <KpiCard
        label="Распланировано, ч"
        value={fmtHrs(totals.allocated ?? 0)}
        hint={
          unalloc < 0
            ? `сверх бюджета на ${fmtHrs(-unalloc)} ч`
            : `${fmtHrs(unalloc)} ч свободно`
        }
        color={unalloc < 0 ? T.warn : T.text}
      />
      <KpiCard label="Факт, ч" value={fmtHrs(totals.fact)} hint="списано за период" />
      <KpiCard
        label="Остаток, ч"
        value={remNeg ? `−${fmtHrs(-totals.remaining)}` : fmtHrs(totals.remaining)}
        hint={remNeg ? 'бюджет освоен сверх плана' : 'бюджета до факта'}
        color={remNeg ? T.over : T.text}
      />
      <KpiCard
        label="Перерасход"
        value={`${totals.overrunCount}`}
        hint={overWarn ? 'проектов: факт сверх бюджета' : 'нет перерасхода'}
        color={overWarn ? T.over : T.text}
      />
      <KpiCard
        label="Переаллокация"
        value={`${totals.overbookedCount ?? 0}`}
        hint={obWarn ? 'проектов: план сверх бюджета' : 'нет переаллокации'}
        color={obWarn ? T.warn : T.text}
      />
    </div>
  );
};

const KpiCard = ({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: string;
  hint?: string;
  color?: string;
}) => (
  <div
    style={{
      flex: '1 1 140px',
      minWidth: 140,
      padding: '12px 14px',
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
    }}
  >
    <div style={{ fontSize: 11.5, color: T.textMuted, marginBottom: 6 }}>{label}</div>
    <div
      style={{
        fontSize: 24,
        fontWeight: 700,
        lineHeight: 1,
        color: color ?? T.text,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </div>
    {hint && <div style={{ fontSize: 11, color: T.textFaint, marginTop: 6 }}>{hint}</div>}
  </div>
);

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
      <SortHeader label="Проект" active={sortKey === 'name'} dir={dir} onSort={() => toggle('name')} />
    </span>
    <span style={cell()}>
      <SortHeader label="Статус" active={sortKey === 'status'} dir={dir} onSort={() => toggle('status')} />
    </span>
    <span style={cell('right')}>
      <SortHeader label="Бюджет, ч" align="right" active={sortKey === 'planned'} dir={dir} onSort={() => toggle('planned')} />
    </span>
    <span style={cell('right')}>
      <SortHeader label="Распланировано, ч" align="right" active={sortKey === 'allocated'} dir={dir} onSort={() => toggle('allocated')} />
    </span>
    <span style={cell('right')}>
      <SortHeader label="Факт, ч" align="right" active={sortKey === 'fact'} dir={dir} onSort={() => toggle('fact')} />
    </span>
    <span style={cell('right')}>
      <SortHeader label="Остаток, ч" align="right" active={sortKey === 'remaining'} dir={dir} onSort={() => toggle('remaining')} />
    </span>
    <span style={cell('right')}>
      <SortHeader label="%" align="right" active={sortKey === 'pct'} dir={dir} onSort={() => toggle('pct')} />
    </span>
    <span style={cell()}> </span>
  </div>
);

const SkeletonRows = () => (
  <>
    {Array.from({ length: 7 }).map((_, i) => (
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
        {[0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
          <span key={c} style={{ padding: '0 10px' }}>
            <span
              style={{
                display: 'block',
                height: 10,
                width: c === 0 ? '70%' : c === 1 ? '80%' : c === 7 ? '60%' : '50%',
                marginLeft: c >= 2 && c <= 6 ? 'auto' : 0,
                borderRadius: 6,
                background: T.headerBg,
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

const EmptyBox = ({ hint }: { hint: string }) => (
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
    <span aria-hidden style={{ fontSize: 24, lineHeight: 1, color: T.textFaint }}>
      ▦
    </span>
    <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Проектов не найдено</span>
    <span style={{ fontSize: 12, color: T.textMuted, maxWidth: 360, lineHeight: 1.5 }}>{hint}</span>
  </div>
);

const sortValue = (key: SortKey | null, r: ProjectPlanFactRow): number | string => {
  switch (key) {
    case 'name':
      return r.name.toLowerCase();
    case 'status':
      return (r.status ? STATUS_META[r.status]?.label ?? r.status : '').toLowerCase();
    case 'planned':
      return r.planned ?? -1;
    case 'allocated':
      return r.allocated ?? -1;
    case 'remaining':
      return r.remaining ?? Number.POSITIVE_INFINITY; // «нет плана» — в конец при сорте
    case 'pct':
      return r.pct ?? -1;
    default:
      return r.fact;
  }
};

type Props = { from: string; to: string };

export const ProjectsView = ({ from, to }: Props) => {
  // Фильтр статуса: '' = все. Перезапрос на бэке (status опц.).
  const [status, setStatus] = useState('');
  const { loading, error, data, reload } = useProjectsPlanFact(from, to, status || null);
  // Дефолт сортировки не задан → сохраняем порядок бэка (перерасход → факт).
  const { key: sortKey, dir, toggle, sort } = useSortable<SortKey>(null);

  const rows = data?.rows ?? [];
  const sorted = sortKey ? sort(rows, (r) => sortValue(sortKey, r)) : rows;

  const body = () => {
    if (error) {
      return <ErrorState title="Не удалось загрузить отчёт по проектам" detail={error} onRetry={reload} />;
    }
    if (loading) {
      return (
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <HeaderRow sortKey={sortKey} dir={dir} toggle={toggle} />
          <SkeletonRows />
        </div>
      );
    }
    if (rows.length === 0) {
      return (
        <EmptyBox
          hint={
            status
              ? 'По выбранному статусу проектов за период нет. Смените статус или период.'
              : 'За выбранный период проектов с активностью нет. Смените период.'
          }
        />
      );
    }
    return (
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <HeaderRow sortKey={sortKey} dir={dir} toggle={toggle} />
        {sorted.map((r, i) => (
          <Row key={r.projectId} r={r} alt={i % 2 === 1} />
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Контекст-полоса: фильтр статуса (заголовок дашборда несёт период/экспорт). */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px 0',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 12, color: T.textMuted }}>Статус</span>
        {STATUS_OPTS.map((o) => (
          <StatusPill
            key={o.value || 'all'}
            label={o.label}
            on={status === o.value}
            onClick={() => setStatus(o.value)}
          />
        ))}
        {!loading && !error && data && (
          <span style={{ marginLeft: 'auto', fontSize: 12, color: T.textMuted, fontVariantNumeric: 'tabular-nums' }}>
            {data.count} {plural(data.count, 'проект', 'проекта', 'проектов')}
          </span>
        )}
      </div>
      {!loading && !error && data && data.totals && <Kpi totals={data.totals} />}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          margin: '4px 14px 14px',
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

const Row = ({ r, alt }: { r: ProjectPlanFactRow; alt: boolean }) => {
  const over = r.overrun || (r.remaining !== null && r.remaining < 0);
  // Переаллокация = распланировано сверх бюджета (warning, янтарь — отдельно от
  // перерасхода факта). Подсветка строки терракотом приоритетнее (перерасход важнее).
  const overbooked = r.overbooked || (r.allocatedPct !== null && r.allocatedPct > 1);
  const remVal =
    r.remaining === null
      ? '—'
      : r.remaining < 0
        ? `−${fmtHrs(-r.remaining)}`
        : fmtHrs(r.remaining);
  // Подпись покрытия бюджета планом: «X из Y» (распланировано из бюджета).
  // Нет бюджета → только распланировано без знаменателя.
  const coverage =
    r.planned === null
      ? null
      : `${fmtHrs(r.allocated)} из ${fmtHrs(r.planned)} (${fmtPct(r.allocatedPct)})`;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: COLS,
        height: 40,
        borderBottom: `1px solid ${T.border}`,
        // Перерасход — мягкий терракот-тинт строки (а не только текста).
        background: over ? T.overSoft : alt ? T.rowAlt : 'transparent',
        fontSize: 12.5,
      }}
    >
      <span style={{ ...cell(), fontWeight: 500, gap: 7 }} title={r.name}>
        {r.code && (
          <span style={{ color: T.textFaint, fontSize: 11.5, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
            {r.code}
          </span>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
      </span>

      <span style={cell()}>
        <StatusBadge status={r.status} />
      </span>

      <span style={{ ...cell('right'), color: r.planned === null ? T.textFaint : T.textMuted }}>
        {r.planned === null ? '—' : fmtHrs(r.planned)}
      </span>

      {/* Распланировано (allocated) + покрытие бюджета «X из Y (Z%)». Переаллокация
          (распланировано > бюджет) — янтарём. */}
      <span
        style={{
          ...cell('right'),
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 1,
          color: overbooked ? T.warn : T.text,
        }}
      >
        <span style={{ fontWeight: 600, lineHeight: 1.1 }}>{fmtHrs(r.allocated)}</span>
        {coverage && (
          <span style={{ fontSize: 10.5, color: overbooked ? T.warn : T.textFaint, lineHeight: 1.1 }}>
            {coverage}
          </span>
        )}
      </span>

      <span style={{ ...cell('right'), fontWeight: 600 }}>{fmtHrs(r.fact)}</span>

      <span style={{ ...cell('right'), fontWeight: 500, color: r.remaining === null ? T.textFaint : over ? T.over : T.ok }}>
        {remVal}
      </span>

      <span style={{ ...cell('right'), color: over ? T.over : T.textMuted }}>{fmtPct(r.pct)}</span>

      {/* Флаги — знак не только цветом: ▲ «перерасход» (факт>бюджет, терракот) и
          ⚠ «переаллокация» (распланировано>бюджет, янтарь). */}
      <span style={{ ...cell(), gap: 4, flexWrap: 'wrap' }}>
        {over ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              color: T.over,
              background: T.surface,
              border: `1px solid ${T.over}`,
              padding: '1px 7px',
              borderRadius: 999,
            }}
          >
            <span aria-hidden>▲</span> перерасход
          </span>
        ) : null}
        {overbooked ? (
          <span
            title="Распланировано (план слотов) больше бюджета проекта"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              color: T.warnSolid,
              background: T.warnTint,
              border: `1px solid ${T.warnBorder}`,
              padding: '1px 7px',
              borderRadius: 999,
            }}
          >
            <span aria-hidden>⚠</span> переаллокация
          </span>
        ) : null}
      </span>
    </div>
  );
};

// Псевдо-радио для статуса (single-select). Активный — accent-тинт. На корне «Все».
const StatusPill = ({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={on}
    style={{
      height: 26,
      padding: '0 11px',
      fontSize: 12,
      fontFamily: 'inherit',
      fontWeight: on ? 600 : 500,
      border: `1px solid ${on ? T.accentRing : T.border}`,
      borderRadius: 7,
      background: on ? T.accentSoft : T.surface,
      color: on ? T.accent : T.textMuted,
      cursor: on ? 'default' : 'pointer',
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </button>
);

// Русское склонение (1 проект / 2 проекта / 5 проектов).
const plural = (n: number, one: string, few: string, many: string): string => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
};
