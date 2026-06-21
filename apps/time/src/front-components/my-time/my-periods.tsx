import { useEffect, useState } from 'react';

import { T } from 'src/front-components/grid/tokens';
import { fmtHrs } from 'src/front-components/reports/report-tokens';
import { Center } from 'src/front-components/grid/center';
import { ErrorState } from 'src/front-components/shared/error-state';
import { useMyEntries } from 'src/front-components/my-time/use-my-entries';
import { summarizeWeeks, type WeekSummary } from 'src/front-components/my-time/period-status';
import { statusMeta } from 'src/front-components/my-time/status-meta';
import { fetchActorNames } from 'src/front-components/grid/actor-names';
import { useGlobalSettings } from 'src/front-components/shared/use-global-settings';

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

const Row = ({ w, actorNames }: { w: WeekSummary; actorNames: Map<string, string> }) => {
  // WI-56 аудит-подпись: «Отклонил: …» (resolvedBy при REJECTED) / «Отозвал: …»
  // (revokedBy при отзыве согласования). ФИО/КОД уже разрешены по ПДн в actorNames.
  const rejectedBy = w.resolvedBy ? actorNames.get(w.resolvedBy) : undefined;
  const revokedBy = w.revokedBy ? actorNames.get(w.revokedBy) : undefined;
  return (
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
      {/* WI-56: кто отклонил/отозвал. Под причиной (или сам по себе при отзыве). */}
      {(rejectedBy || revokedBy) && (
        <div style={{ margin: '0 14px 11px', fontSize: 11.5, color: T.textMuted }}>
          {rejectedBy && <span>Отклонил: {rejectedBy}</span>}
          {rejectedBy && revokedBy && <span> · </span>}
          {revokedBy && <span>Отозвал согласование: {revokedBy}</span>}
        </div>
      )}
    </div>
  );
};

export const MyPeriods = ({ employeeId }: { employeeId: string }) => {
  const { loading, error, entries } = useMyEntries(employeeId);
  const reveal = useGlobalSettings()?.revealEmployeeNames === true;

  const weeks = summarizeWeeks(entries);

  // WI-56: резолв подписей акторов (resolvedBy/revokedBy недель) → ФИО/КОД по ПДн.
  const [actorNames, setActorNames] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    const ids = weeks.flatMap((w) => [w.resolvedBy, w.revokedBy]);
    if (ids.every((id) => !id)) return;
    let alive = true;
    void fetchActorNames(ids, reveal).then((map) => {
      if (alive) setActorNames(map);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, reveal]);

  if (error) return <ErrorState title="Не удалось загрузить периоды" detail={error} />;
  if (loading) return <Center>Загрузка периодов…</Center>;

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
        <Row key={w.weekStart} w={w} actorNames={actorNames} />
      ))}
    </div>
  );
};
