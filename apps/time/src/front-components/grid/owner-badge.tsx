import { T } from 'src/front-components/grid/tokens';
import type { TimesheetOwner } from 'src/front-components/grid/whose-timesheet';

// Контекст-индикатор «чей это таймшит»: ФИО (акцент) · отдел (приглушённо).
// Всегда виден над сеткой — даже для собственного таймшита (REQ on-behalf #1).
// Read-only: НЕ селектор. Когда появится выбор «за кого» (фаза on-behalf с
// server-gate) — тот же индикатор покажет владельца записей, ничего менять не надо.
//
// Имя — основной акцент (вес 600, основной цвет); слово «Таймшит» и отдел —
// приглушённый второй план. aria-label проговаривает контекст целиком.

type Props = {
  owner: TimesheetOwner;
};

export const OwnerBadge = ({ owner }: Props) => (
  <span
    aria-label={`Таймшит сотрудника: ${owner.full}`}
    title={owner.full}
    style={{
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: 6,
      minWidth: 0,
      maxWidth: 360,
      fontSize: 12.5,
      lineHeight: 1.3,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}
  >
    <span aria-hidden style={{ color: T.textMuted, fontWeight: 500 }}>Таймшит:</span>
    <span
      style={{
        color: T.text,
        fontWeight: 600,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {owner.label}
    </span>
    {owner.department && (
      <span aria-hidden style={{ color: T.textMuted, fontWeight: 400 }}>
        · {owner.department}
      </span>
    )}
  </span>
);
