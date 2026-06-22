import { useEffect, useState } from 'react';

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
  recordCount?: number; // W3A.11: сколько записей удалит «Убрать строку» (счётчик в confirm)
  onDuplicate: () => void;
  onFillWeekdays: () => void; // норма дня во все пустые будни строки (WI-02 SSOT)
  onClearRow: () => void; // обнулить все часы строки (W3A.11: мгновенно + undo-тост наверху)
  onDeleteRow: () => void; // убрать строку из сетки целиком (W3A.11: через confirm)
  commentDays?: CommentDay[]; // WI-01: дни строки с часами — цели комментария
  onCommitComment?: (dayIso: string, text: string) => void; // WI-01: сохранить коммент дня
  // WI-10 отзыв согласования из строки. recall — режим действия (revoke/recall);
  // recallDenied — текст подсказки, если прав нет (UI-гейт, серверный гард в /s/).
  recall?: { mode: 'recall' | 'revoke'; denied: string | null } | null;
  onRecall?: () => void; // выполнить отзыв (revoke/recall) для записей строки
  // WI-10: внешний сигнал «открыть отзыв» (клик по 🔒-ячейке) — инкремент числа
  // открывает меню сразу на подтверждении отзыва. Так клик по замку не тупик.
  openRecallSignal?: number;
};

type Item = {
  label: string;
  onClick: () => void;
  danger?: boolean;
  icon?: 'clear' | 'trash'; // W3A.10: иконки только у деструктивных действий
  hint?: string;
  dividerBefore?: boolean; // визуальный разделитель кластеров
};

// Режим поповера: список действий / форма комментариев (WI-01) / подтверждение
// удаления строки (W3A.11) / подтверждение отзыва согласования (WI-10).
type View = 'menu' | 'comment' | 'confirm-delete' | 'confirm-recall';

// WI-10 подписи действия отзыва (revoke руководителя / recall сотрудника).
const RECALL_LABEL: Record<'recall' | 'revoke', { item: string; hint: string; title: string; body: string; cta: string }> = {
  revoke: {
    item: 'Отозвать согласование для правки',
    hint: 'вернуть согласованную запись в работу',
    title: 'Отозвать согласование?',
    body: 'Запись вернётся со статуса «Согласовано» на «На согласовании» — её снова можно будет править. Действие зафиксируется в аудите.',
    cta: 'Отозвать',
  },
  recall: {
    item: 'Отозвать отправку для правки',
    hint: 'вернуть отправленную запись в черновик',
    title: 'Отозвать отправку?',
    body: 'Запись вернётся со статуса «На согласовании» в «Черновик» — её снова можно будет править и отправить заново.',
    cta: 'Отозвать',
  },
};

// WI-01: дни-цели для комментария — только с проставленными часами (без часов
// записи нет, комментировать нечего). Чистый предикат — SSOT для пункта меню
// «Комментарий к записи…» и для панели комментариев.
export const commentTargets = (days?: CommentDay[]): CommentDay[] =>
  (days ?? []).filter((d) => d.hours > 0);

export const RowMenu = ({
  rowLocked,
  hasHours,
  recordCount,
  onDuplicate,
  onFillWeekdays,
  onClearRow,
  onDeleteRow,
  commentDays,
  onCommitComment,
  recall,
  onRecall,
  openRecallSignal,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('menu');

  const close = () => {
    setOpen(false);
    setView('menu');
  };

  // WI-10: клик по 🔒-ячейке (внешний сигнал) → открыть меню сразу на отзыве.
  // Срабатывает только при наличии recall-плана (есть что отзывать).
  useEffect(() => {
    if (openRecallSignal && recall) {
      setView('confirm-recall');
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRecallSignal]);

  const run = (fn: () => void) => () => {
    fn();
    close();
  };

  // WI-01: коммент доступен, если есть колбэк и хотя бы один день с часами.
  const targets = commentTargets(commentDays);
  const canComment = !rowLocked && !!onCommitComment && targets.length > 0;

  // W3A.9: порядок по частоте использования — ежедневное наверх, деструктив вниз:
  //   Заполнить будни → Комментарий → Дублировать → [разд] → Обнулить → Убрать.
  // W3A.10: иконки только у деструктивных (Обнулить/Убрать). W3A.11: «Убрать» через
  // confirm со счётчиком записей; «Обнулить» мгновенно (undo-тост — на уровне сетки).
  const items: Item[] = [];
  if (!rowLocked) {
    items.push({
      label: 'Заполнить будни нормой',
      onClick: run(onFillWeekdays),
      hint: 'норма дня в пустые будни этой строки',
    });
    if (canComment)
      items.push({
        label: 'Комментарий к записи…',
        onClick: () => setView('comment'),
        hint: 'что делали в этот день',
      });
  }
  items.push({
    label: 'Дублировать строку',
    onClick: run(onDuplicate),
    hint: 'тот же проект, новый вид работ',
  });
  // WI-10: отзыв согласования/отправки — выход из «залоченной» строки (раньше
  // клик по 🔒 был тупиком). Доступно, когда есть APPROVED/SUBMITTED-записи.
  // denied → пункт ведёт в подсказку (почему нельзя), не в действие.
  if (recall) {
    const lbl = RECALL_LABEL[recall.mode];
    items.push({
      label: lbl.item,
      onClick: () => setView('confirm-recall'),
      hint: recall.denied ? 'нужно право руководителя' : lbl.hint,
      dividerBefore: true,
    });
  }
  if (!rowLocked) {
    if (hasHours)
      items.push({
        label: 'Обнулить часы',
        onClick: run(onClearRow),
        icon: 'clear',
        hint: 'все часы строки → пусто',
        dividerBefore: true,
      });
    items.push({
      label: 'Убрать строку',
      // W3A.11: необратимо → сначала подтверждение (счётчик записей).
      onClick: () => setView('confirm-delete'),
      icon: 'trash',
      danger: true,
      dividerBefore: !hasHours, // разделитель, если «Обнулить» выше нет
    });
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
          width: 26,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          // Заметность (заказчик «⋯ незаметна»): видимая рамка + фон-чип, не голый глиф.
          border: `1px solid ${open ? T.accent : T.borderStrong}`,
          borderRadius: 6,
          background: open ? T.accentSoft : T.surface,
          color: open ? T.accent : T.text,
          cursor: 'pointer',
          fontSize: 16,
          fontWeight: 700,
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
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
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
                    {/* W3A.10: иконка только у деструктивных — акцент на риске. */}
                    {it.icon && (
                      <ActionIcon kind={it.icon} color={it.danger ? T.over : T.textMuted} />
                    )}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 500 }}>{it.label}</span>
                      {it.hint && (
                        <span style={{ display: 'block', fontSize: 11, color: T.textFaint, marginTop: 1 }}>
                          {it.hint}
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          ) : view === 'confirm-delete' ? (
            <ConfirmDelete
              count={recordCount ?? 0}
              onConfirm={run(onDeleteRow)}
              onBack={() => setView('menu')}
            />
          ) : view === 'confirm-recall' ? (
            <ConfirmRecall
              mode={recall?.mode ?? 'recall'}
              denied={recall?.denied ?? null}
              onConfirm={onRecall ? run(onRecall) : () => setView('menu')}
              onBack={() => setView('menu')}
            />
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

// W3A.11: подтверждение удаления строки. Не window.confirm (запрещён в RemDOM) —
// инлайн-панель со счётчиком записей, которые будут удалены. Счётчик 0 → строка
// пуста (записей нет, удаляется только из сетки) — формулировка мягче.
const ConfirmDelete = ({
  count,
  onConfirm,
  onBack,
}: {
  count: number;
  onConfirm: () => void;
  onBack: () => void;
}) => (
  <div
    role="menu"
    onClick={(e) => e.stopPropagation()}
    style={{
      position: 'absolute',
      top: 28,
      left: 0,
      zIndex: 21,
      width: 240,
      background: T.surface,
      border: `1px solid ${T.borderStrong}`,
      borderRadius: 10,
      boxShadow: '0 10px 30px rgba(29,31,38,0.16)',
      padding: 12,
    }}
  >
    <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, marginBottom: 4 }}>
      Убрать строку?
    </div>
    <div style={{ fontSize: 11.5, color: T.textMuted, marginBottom: 10, lineHeight: 1.4 }}>
      {count > 0
        ? `Будет удалено ${count} ${pluralRecords(count)}. Действие необратимо.`
        : 'В строке нет записей — она просто исчезнет из таблицы.'}
    </div>
    <div style={{ display: 'flex', gap: 6 }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          flex: 1,
          height: 30,
          border: `1px solid ${T.border}`,
          borderRadius: 7,
          background: T.surface,
          color: T.text,
          cursor: 'pointer',
          fontSize: 12,
          fontFamily: 'inherit',
        }}
      >
        Отмена
      </button>
      <button
        type="button"
        onClick={onConfirm}
        style={{
          flex: 1,
          height: 30,
          border: 'none',
          borderRadius: 7,
          background: T.over,
          color: T.onAccent,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'inherit',
        }}
      >
        {count > 0 ? 'Удалить' : 'Убрать'}
      </button>
    </div>
  </div>
);

// WI-10: подтверждение отзыва согласования/отправки (revoke/recall). Не window.confirm
// (RemDOM) — инлайн-панель. denied → показываем подсказку (почему нельзя) без CTA-действия,
// чтобы клик по 🔒 не был тупиком: пользователь видит, кто может отозвать.
const ConfirmRecall = ({
  mode,
  denied,
  onConfirm,
  onBack,
}: {
  mode: 'recall' | 'revoke';
  denied: string | null;
  onConfirm: () => void;
  onBack: () => void;
}) => {
  const lbl = RECALL_LABEL[mode];
  return (
    <div
      role="menu"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 28,
        left: 0,
        zIndex: 21,
        width: 260,
        background: T.surface,
        border: `1px solid ${T.borderStrong}`,
        borderRadius: 10,
        boxShadow: '0 10px 30px rgba(29,31,38,0.16)',
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, marginBottom: 4 }}>
        {denied ? 'Отозвать нельзя' : lbl.title}
      </div>
      <div style={{ fontSize: 11.5, color: T.textMuted, marginBottom: 10, lineHeight: 1.45 }}>
        {denied ?? lbl.body}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            flex: 1,
            height: 30,
            border: `1px solid ${T.border}`,
            borderRadius: 7,
            background: T.surface,
            color: T.text,
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'inherit',
          }}
        >
          {denied ? 'Понятно' : 'Отмена'}
        </button>
        {!denied && (
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              height: 30,
              border: 'none',
              borderRadius: 7,
              background: T.accent,
              color: T.onAccent,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            {lbl.cta}
          </button>
        )}
      </div>
    </div>
  );
};

// Склонение «запись/записи/записей» (1 запись, 2 записи, 5 записей). Чистая функция.
export const pluralRecords = (n: number): string => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'запись';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'записи';
  return 'записей';
};

// W3A.10: иконки деструктивных действий. clear=обнулить (ластик/× в круге),
// trash=убрать (корзина). Тонкие штрихи, aria-hidden (смысл в подписи).
const ActionIcon = ({ kind, color }: { kind: 'clear' | 'trash'; color: string }) =>
  kind === 'trash' ? (
    <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
      <path d="M3 4.5h10M6.5 4.5V3.2a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.3M5 4.5l.6 8a1 1 0 0 0 1 .9h2.8a1 1 0 0 0 1-.9l.6-8" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
      <circle cx="8" cy="8" r="5.6" stroke={color} strokeWidth="1.2" />
      <path d="M6 6l4 4M10 6l-4 4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );

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
