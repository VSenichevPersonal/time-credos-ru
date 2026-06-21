import { useState } from 'react';

import { T } from 'src/front-components/grid/tokens';

// Контекст-меню строки (⋯). Собирает разбросанные действия одной строки под
// видимый триггер с ПОДПИСЯМИ (раньше: немой «⧉» + 10px-квадрат в ячейке).
// Сверка: Timetta removeLines / Kimai Duplicate. Поповер на useState — host-DOM
// недоступен (Remote DOM), паттерн как cheatsheet/autocomplete.
//
// WI-01 (решение C1): сюда же перенесён «Комментарий к записи…» — раньше ✎-кнопка
// жила в ячейке (hour-cell), но мышью была недостижима (баг onClick+onMouseDown).
// Теперь коммент правится из меню: пункт открывает список дней строки с часами,
// каждый — инлайн-поле. Точка-индикатор коммента остаётся в ячейке (read-only).
//
// rowLocked=true (вся строка согласована) → правящие пункты скрыты, остаётся
// только «Дублировать» (создаёт новую строку, согласованную не трогает).

// День строки с часами — цель для комментария (WI-01).
export type CommentDay = {
  dayIso: string;
  label: string; // короткая метка дня (напр. «Пн 16.06»)
  hours: number;
  description: string | null;
  locked?: boolean; // согласованный день — коммент read-only
};

type Props = {
  rowLocked?: boolean;
  hasHours?: boolean; // есть что заполнять/очищать (иначе пункты не нужны)
  onDuplicate: () => void;
  onFillWeekdays: () => void; // норма дня во все пустые будни строки (WI-02 SSOT)
  onClearRow: () => void; // обнулить все часы строки
  onDeleteRow: () => void; // убрать строку из сетки целиком
  commentDays?: CommentDay[]; // WI-01: дни строки с часами — цели комментария
  onCommitComment?: (dayIso: string, text: string) => void; // WI-01: сохранить коммент дня
};

type Item = {
  label: string;
  onClick: () => void;
  danger?: boolean;
  hint?: string;
  dividerBefore?: boolean; // визуальный разделитель кластеров
};

// Режим поповера: список действий vs форма комментариев (WI-01).
type View = 'menu' | 'comment';

// WI-01: дни-цели для комментария — только с проставленными часами (без часов
// записи нет, комментировать нечего). Чистый предикат — SSOT для пункта меню
// «Комментарий к записи…» и для панели комментариев.
export const commentTargets = (days?: CommentDay[]): CommentDay[] =>
  (days ?? []).filter((d) => d.hours > 0);

export const RowMenu = ({
  rowLocked,
  hasHours,
  onDuplicate,
  onFillWeekdays,
  onClearRow,
  onDeleteRow,
  commentDays,
  onCommitComment,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('menu');

  const close = () => {
    setOpen(false);
    setView('menu');
  };

  const run = (fn: () => void) => () => {
    fn();
    close();
  };

  // WI-01: коммент доступен, если есть колбэк и хотя бы один день с часами.
  const targets = commentTargets(commentDays);
  const canComment = !rowLocked && !!onCommitComment && targets.length > 0;

  const items: Item[] = [
    { label: 'Дублировать строку', onClick: run(onDuplicate), hint: 'тот же проект, новый вид работ' },
  ];
  if (!rowLocked) {
    items.push({
      label: 'Заполнить будни нормой',
      onClick: run(onFillWeekdays),
      hint: 'норма дня в пустые будни этой строки',
      dividerBefore: true,
    });
    if (canComment)
      items.push({
        label: 'Комментарий к записи…',
        onClick: () => setView('comment'),
        hint: 'что делали в этот день',
      });
    if (hasHours)
      items.push({
        label: 'Обнулить часы',
        onClick: run(onClearRow),
        hint: 'все часы строки → пусто',
        dividerBefore: true,
      });
    items.push({ label: 'Убрать строку', onClick: run(onDeleteRow), danger: true });
  }

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setView('menu');
          setOpen((v) => !v);
        }}
        title="Действия со строкой"
        aria-label="Действия со строкой"
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          border: 'none',
          borderRadius: 6,
          background: open ? T.accentSoft : 'transparent',
          color: open ? T.accent : T.textMuted,
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          fontFamily: 'inherit',
        }}
      >
        ⋯
      </button>
      {open && (
        <>
          <div
            onClick={close}
            onKeyDown={(e) => {
              if (e.key === 'Escape') close();
            }}
            style={{ position: 'fixed', inset: 0, zIndex: 20 }}
          />
          {view === 'menu' ? (
            <div
              role="menu"
              style={{
                position: 'absolute',
                top: 28,
                left: 0,
                zIndex: 21,
                minWidth: 210,
                background: T.surface,
                border: `1px solid ${T.borderStrong}`,
                borderRadius: 10,
                boxShadow: '0 10px 30px rgba(29,31,38,0.16)',
                padding: 4,
              }}
            >
              {items.map((it) => (
                <div key={it.label}>
                  {it.dividerBefore && (
                    <div style={{ height: 1, background: T.border, margin: '4px 0' }} />
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={it.onClick}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '7px 9px',
                      textAlign: 'left',
                      border: 'none',
                      borderRadius: 6,
                      background: 'transparent',
                      color: it.danger ? T.over : T.text,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = it.danger ? T.overSoft : T.accentSoft;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ fontSize: 12.5, fontWeight: 500 }}>{it.label}</span>
                    {it.hint && (
                      <span style={{ display: 'block', fontSize: 11, color: T.textFaint, marginTop: 1 }}>
                        {it.hint}
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <CommentPanel
              days={targets}
              onCommit={(dayIso, text) => onCommitComment?.(dayIso, text)}
              onBack={() => setView('menu')}
              onClose={close}
            />
          )}
        </>
      )}
    </div>
  );
};

// WI-01: панель комментариев — по одному инлайн-полю на день с часами. Сохранение
// по blur/Enter, Esc — назад. Поповер на useState (Remote DOM, host-DOM нет).
const CommentPanel = ({
  days,
  onCommit,
  onBack,
  onClose,
}: {
  days: CommentDay[];
  onCommit: (dayIso: string, text: string) => void;
  onBack: () => void;
  onClose: () => void;
}) => (
  <div
    role="menu"
    onClick={(e) => e.stopPropagation()}
    style={{
      position: 'absolute',
      top: 28,
      left: 0,
      zIndex: 21,
      width: 280,
      background: T.surface,
      border: `1px solid ${T.borderStrong}`,
      borderRadius: 10,
      boxShadow: '0 10px 30px rgba(29,31,38,0.16)',
      padding: 8,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <button
        type="button"
        onClick={onBack}
        aria-label="Назад к действиям"
        title="Назад"
        style={{
          width: 22,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          borderRadius: 6,
          background: 'transparent',
          color: T.textMuted,
          cursor: 'pointer',
          fontSize: 14,
          fontFamily: 'inherit',
        }}
      >
        ‹
      </button>
      <span style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>Комментарий к записи</span>
    </div>
    {days.map((d) => (
      <CommentField key={d.dayIso} day={d} onCommit={onCommit} onDone={onClose} />
    ))}
  </div>
);

// Одно поле комментария на день. Локальный draft, коммит по blur/Enter (Esc — откат).
const CommentField = ({
  day,
  onCommit,
  onDone,
}: {
  day: CommentDay;
  onCommit: (dayIso: string, text: string) => void;
  onDone: () => void;
}) => {
  const [draft, setDraft] = useState(day.description ?? '');

  const commit = () => {
    if (draft !== (day.description ?? '')) onCommit(day.dayIso, draft);
  };

  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
        <span style={{ color: T.text, fontWeight: 500 }}>{day.label}</span>
        <span style={{ color: T.textFaint, fontVariantNumeric: 'tabular-nums' }}>{day.hours} ч</span>
      </div>
      <input
        value={draft}
        placeholder="Что делали…"
        disabled={day.locked}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            commit();
            onDone();
          }
          if (e.key === 'Escape') setDraft(day.description ?? '');
        }}
        style={{
          width: '100%',
          height: 28,
          padding: '0 8px',
          fontSize: 12,
          border: `1px solid ${day.locked ? T.border : T.accent}`,
          borderRadius: 6,
          outline: 'none',
          color: day.locked ? T.textMuted : T.text,
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          background: day.locked ? T.panelBg : T.surface,
        }}
      />
    </div>
  );
};
