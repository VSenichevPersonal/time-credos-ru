import { useMemo, useState } from 'react';

import { T } from 'src/front-components/grid/tokens';
import type { EmployeeRef } from 'src/front-components/grid/types';

// On-behalf селектор «Таймшит сотрудника» (MANAGER_ENTRY_ON_BEHALF, REQ on-behalf #1).
// Виден ТОЛЬКО руководителю (вызывающий не рендерит при пустом списке подчинённых).
// Выбор подчинённого → грид грузит/пишет его записи; «Мой таймшит» возвращает свой.
//
// ПДн (CISO-007): ФИО показываем только при reveal=true; иначе стабильный КОД
// (тот же формат, что owner-badge/actor-names). Поповер на useState (Remote DOM,
// host-DOM/портала нет) — паттерн CopyMenu: fixed-оверлей для закрытия по клику вне.
//
// Сервер — истина: даже если выбрать недоступного, /s/time-entry вернёт
// FORBIDDEN_ON_BEHALF (понятный snackbar в use-validation). Список — лишь UX.

type Props = {
  subordinates: ReadonlyArray<EmployeeRef>;
  // Текущий выбранный (null = свой таймшит).
  viewEmployeeId: string | null;
  // ПДн: ФИО (reveal) или КОД сотрудника.
  reveal: boolean;
  onSelect: (employeeId: string | null) => void;
};

// Стабильный КОД без ПДн — единый формат с owner-badge.employeeCode.
const employeeCode = (id: string): string => {
  const suffix = id.replace(/[^0-9a-fA-F]/g, '').slice(-4).toUpperCase();
  return `Сотрудник·${suffix || id.slice(0, 4)}`;
};

const labelOf = (e: EmployeeRef, reveal: boolean): string => {
  if (reveal) {
    const name = e.name?.trim();
    if (name) return name;
  }
  return employeeCode(e.id);
};

export const EmployeeSelector = ({
  subordinates,
  viewEmployeeId,
  reveal,
  onSelect,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => subordinates.find((e) => e.id === viewEmployeeId) ?? null,
    [subordinates, viewEmployeeId],
  );
  const viewingOther = viewEmployeeId !== null;

  // Фильтр по подстроке (ФИО при reveal; КОД иначе). Список отдела может быть
  // десятки человек — поиск ускоряет, но не обязателен (короткие отделы — весь).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subordinates;
    return subordinates.filter((e) => labelOf(e, reveal).toLowerCase().includes(q));
  }, [subordinates, query, reveal]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const triggerLabel = viewingOther && selected ? labelOf(selected, reveal) : 'За сотрудника';

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Открыть таймшит сотрудника отдела (ввод за подчинённого)"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          height: 28,
          padding: '0 10px',
          maxWidth: 200,
          fontSize: 12,
          fontWeight: 500,
          border: `1px solid ${viewingOther ? T.accent : T.border}`,
          borderRadius: 7,
          background: open || viewingOther ? T.accentSoft : T.surface,
          color: open || viewingOther ? T.accent : T.textMuted,
          cursor: 'pointer',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        <PeopleGlyph color={open || viewingOther ? T.accent : T.textMuted} />
        <span
          style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {triggerLabel}
        </span>
        <span aria-hidden style={{ fontSize: 9, opacity: 0.7 }}>▾</span>
      </button>

      {open && (
        <>
          <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
          <div
            role="menu"
            aria-label="Таймшит сотрудника"
            style={{
              position: 'absolute',
              top: 32,
              left: 0,
              zIndex: 21,
              width: 264,
              maxWidth: '80vw',
              background: T.surface,
              border: `1px solid ${T.borderStrong}`,
              borderRadius: 10,
              boxShadow: '0 10px 30px rgba(29,31,38,0.16)',
              padding: 4,
            }}
          >
            <div style={{ padding: '5px 8px 3px', fontSize: 11, color: T.textFaint, fontWeight: 600 }}>
              Таймшит сотрудника
            </div>

            {/* «Мой таймшит» — всегда первый, отмечен галкой если активен. */}
            <Item
              label="Мой таймшит"
              active={!viewingOther}
              onClick={() => {
                onSelect(null);
                close();
              }}
            />

            {subordinates.length > 6 && (
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск сотрудника"
                aria-label="Поиск сотрудника"
                style={{
                  width: '100%',
                  height: 28,
                  margin: '4px 0',
                  padding: '0 8px',
                  fontSize: 12.5,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  background: T.surface,
                  color: T.text,
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            )}

            <div style={{ height: 1, background: T.border, margin: '4px 0' }} />

            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '8px 9px', fontSize: 12, color: T.textFaint }}>
                  {subordinates.length === 0 ? 'Нет подчинённых' : 'Никого не найдено'}
                </div>
              ) : (
                filtered.map((e) => (
                  <Item
                    key={e.id}
                    label={labelOf(e, reveal)}
                    active={e.id === viewEmployeeId}
                    onClick={() => {
                      onSelect(e.id);
                      close();
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Item = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    role="menuitemradio"
    aria-checked={active}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      padding: '7px 9px',
      textAlign: 'left',
      border: 'none',
      borderRadius: 6,
      background: active ? T.accentSoft : 'transparent',
      color: active ? T.accent : T.text,
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontSize: 12.5,
      fontWeight: active ? 600 : 500,
    }}
    onMouseEnter={(e) => {
      if (!active) e.currentTarget.style.background = T.accentSoft;
    }}
    onMouseLeave={(e) => {
      if (!active) e.currentTarget.style.background = 'transparent';
    }}
  >
    <span aria-hidden style={{ width: 12, flexShrink: 0, fontSize: 11, color: T.accent }}>
      {active ? '✓' : ''}
    </span>
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  </button>
);

// Тихий глиф «двое» — статус «таймшит другого» не только цветом (a11y).
const PeopleGlyph = ({ color }: { color: string }) => (
  <svg aria-hidden width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="5.5" cy="5" r="2.4" stroke={color} strokeWidth="1.2" />
    <path d="M1.5 13c0-2.2 1.8-3.6 4-3.6s4 1.4 4 3.6" stroke={color} strokeWidth="1.2" fill="none" />
    <path d="M10.5 3.2a2.4 2.4 0 0 1 0 4.6M11.5 9.6c1.8.2 3 1.6 3 3.4" stroke={color} strokeWidth="1.2" fill="none" />
  </svg>
);
