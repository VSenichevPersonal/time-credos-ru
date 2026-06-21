import { T } from 'src/front-components/grid/tokens';
import { fmtHrs } from 'src/front-components/reports/report-tokens';
import { Center } from 'src/front-components/grid/center';
import { ErrorState } from 'src/front-components/shared/error-state';
import { useMyEntries } from 'src/front-components/my-time/use-my-entries';
import { summarizeWeeks, type WeekSummary } from 'src/front-components/my-time/period-status';
import { statusMeta } from 'src/front-components/my-time/status-meta';

// REQ-0014 «Мои периоды»: список прошлых недель со статусами. После отправки
// период остаётся виден (статус «На согласовании»), не «исчезает».

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const fmtRange = (start: string, end: string): string => {
  const a = new Date(`${start}T00:00:00Z`);
  const b = new Date(`${end}T00:00:00Z`);
  const left = `${a.getUTCDate()} ${MONTHS[a.getUTCMonth()]}`;
  const right = `${b.getUTCDate()} ${MONTHS[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
  return `${left} — ${right}`;
};

const StatusBadge = ({ status }: { status: WeekSummary['status'] }) => {
  const m = statusMeta(status);
  return (
    <span
      style={{
        fontSize: 11.5,
        fontWeight: 600,
        color: m.fg,
        background: m.bg,
        padding: '3px 9px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      {m.label}
    </span>
  );
};

const Row = ({ w }: { w: WeekSummary }) => (
  <div style={{ borderBottom: `1px solid ${T.border}` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px 8px' }}>
      <span style={{ fontSize: 13, color: T.text, fontWeight: 500, minWidth: 170 }}>
        {fmtRange(w.weekStart, w.weekEnd)}
      </span>
      <span style={{ fontSize: 13, color: T.text, fontVariantNumeric: 'tabular-nums', minWidth: 64 }}>
        {fmtHrs(w.hours)} ч
      </span>
      <span style={{ fontSize: 12, color: T.textFaint, minWidth: 90 }}>
        {w.count} {w.count === 1 ? 'запись' : 'записей'}
      </span>
      <span style={{ marginLeft: 'auto' }}>
        <StatusBadge status={w.status} />
      </span>
    </div>
    {/* UC-APR-05: причина отклонения — что исправить. {text} экранирован React (XSS-safe). */}
    {w.rejectComment && (
      <div
        style={{
          margin: '0 14px 11px',
          padding: '7px 10px',
          background: T.overSoft,
          borderRadius: 8,
          borderLeft: `2px solid ${T.over}`,
          fontSize: 12,
          color: T.text,
          lineHeight: 1.45,
        }}
      >
        <span style={{ fontWeight: 600, color: T.over }}>Причина отклонения: </span>
        {w.rejectComment}
      </div>
    )}
  </div>
);

export const MyPeriods = ({ employeeId }: { employeeId: string }) => {
  const { loading, error, entries } = useMyEntries(employeeId);

  if (error) return <ErrorState title="Не удалось загрузить периоды" detail={error} />;
  if (loading) return <Center>Загрузка периодов…</Center>;

  const weeks = summarizeWeeks(entries);
  if (weeks.length === 0)
    return (
      <Center>
        Пока нет периодов с записями. Внесите трудозатраты на странице «Записи» — недели появятся здесь со статусами.
      </Center>
    );

  return (
    <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 14px',
          fontSize: 11,
          color: T.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          borderBottom: `1px solid ${T.border}`,
          background: T.headerBg,
          position: 'sticky',
          top: 0,
        }}
      >
        <span style={{ minWidth: 170 }}>Неделя</span>
        <span style={{ minWidth: 64 }}>Часы</span>
        <span style={{ minWidth: 90 }}>Записи</span>
        <span style={{ marginLeft: 'auto' }}>Статус</span>
      </div>
      {weeks.map((w) => (
        <Row key={w.weekStart} w={w} />
      ))}
    </div>
  );
};
