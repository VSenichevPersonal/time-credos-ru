import { useState } from 'react';

import { T } from 'src/front-components/grid/tokens';
import { fmtHours } from 'src/front-components/grid/format';
import type { ReminderRow } from 'src/front-components/my-time/reminders-rest';

// Мягкий баннер напоминания заполнить текущую неделю (REQ-0019-UI / F-E).
// Не алёрт, не модалка: спокойная плашка над KPI «Мои часы».
//   · Личный — если МОЯ неделя недозаполнена (norm−fact>0): «Заполните неделю».
//   · Дайджест руководителю — список команды (кто не заполнил), сворачиваемый;
//     ФИО показываем только если бэк их раскрыл (revealEmployeeNames=true) — иначе
//     адресно по отделу/«сотрудник», без раскрытия ПДн (CISO-007).
// Янтарь (T.warn*), полная рамка + фон-тинт + ведущая иконка (без side-stripe).

const weekLabel = (week: { from: string; to: string } | null): string => {
  if (!week) return 'текущую неделю';
  const d = (iso: string) => iso.slice(8, 10) + '.' + iso.slice(5, 7);
  return `неделю ${d(week.from)}–${d(week.to)}`;
};

export const ReminderBanner = ({
  mine,
  team,
  week,
  isManager,
}: {
  mine: ReminderRow | null;
  team: ReminderRow[];
  week: { from: string; to: string } | null;
  isManager: boolean;
}) => {
  const [open, setOpen] = useState(false);

  // Команда без меня (для дайджеста руководителю).
  const others = team.filter((r) => r.employeeId !== mine?.employeeId);
  const showTeam = isManager && others.length > 0;

  if (!mine && !showTeam) return null;

  return (
    <div style={{ padding: '10px 14px 0' }}>
      <div
        role="status"
        aria-live="polite"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '11px 13px',
          background: T.warnTint,
          border: `1px solid #f6da90`,
          borderRadius: 10,
          fontSize: 13,
          color: T.warnSolid,
        }}
      >
        <span
          aria-hidden
          style={{
            flexShrink: 0,
            width: 20,
            height: 20,
            marginTop: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: T.warnSolid,
            color: T.onAccent,
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          △
        </span>

        <div style={{ flex: 1, minWidth: 0, lineHeight: 1.45 }}>
          {mine && (
            <div style={{ fontWeight: 600 }}>
              Заполните {weekLabel(week)}: {fmtHours(mine.fact)} из {fmtHours(mine.norm)} ч
              {mine.under > 0 && (
                <span style={{ fontWeight: 500 }}> (не хватает {fmtHours(mine.under)} ч)</span>
              )}
            </div>
          )}
          {mine && (
            <div style={{ fontSize: 11.5, marginTop: 2, color: T.warn, fontWeight: 500 }}>
              Внесите трудозатраты на странице «Записи».
            </div>
          )}

          {showTeam && (
            <div style={{ marginTop: mine ? 9 : 0 }}>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                style={{
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  color: T.warnSolid,
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                }}
              >
                {open ? '▾' : '▸'} В команде не заполнили: {others.length}
              </button>
              {open && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {others.map((r) => (
                    <div
                      key={r.employeeId}
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        color: T.warn,
                      }}
                    >
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.name || (r.deptCode ? `Сотрудник · ${r.deptCode}` : 'Сотрудник')}
                      </span>
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmtHours(r.fact)} / {fmtHours(r.norm)} ч
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
