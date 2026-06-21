import { useCallback, useRef, useState } from 'react';

// Координатная навигация по сетке часов. Ячейка адресуется (row, col).
// Стрелки/Tab/Enter двигают активную ячейку; печать цифры → режим ввода.
// Сами ячейки читают активность по равенству координат (без портала фокуса).

export type Cell = { row: number; col: number };

// Действия, привязанные к ShortcutId из keymap (SSOT, E4.14).
export type KeyAction =
  | { type: 'move'; dRow: number; dCol: number }
  | { type: 'edit'; seed: string }
  | { type: 'bulkFillRow' } // Shift+Enter: часы активной ячейки на будни строки (E4.5)
  | { type: 'fillDown' } // Ctrl+D: значение активной ячейки вниз по столбцу (E1.20/E4.6)
  | { type: 'copy' } // Ctrl+C: в внутренний буфер виджета (E1.18)
  | { type: 'paste' } // Ctrl+V: из внутреннего буфера в активную ячейку (E1.18)
  | { type: 'none' };

type KeyEvent = { key: string; shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean };

// Чистая функция: какое действие соответствует клавише. Cmd(meta)/Ctrl —
// синонимы (mac/win). SSOT горячих клавиш — keymap.ts.
export const keyAction = (e: KeyEvent): KeyAction => {
  const k = e.key;
  const mod = e.ctrlKey || e.metaKey; // Cmd/Ctrl
  // Модификаторные действия (Excel-паттерн) — раньше стрелок/ввода.
  if (mod && (k === 'd' || k === 'D')) return { type: 'fillDown' };
  if (mod && (k === 'c' || k === 'C')) return { type: 'copy' };
  if (mod && (k === 'v' || k === 'V')) return { type: 'paste' };
  if (k === 'Enter' && e.shiftKey) return { type: 'bulkFillRow' };
  if (k === 'ArrowUp') return { type: 'move', dRow: -1, dCol: 0 };
  if (k === 'ArrowDown' || k === 'Enter') return { type: 'move', dRow: 1, dCol: 0 };
  if (k === 'ArrowLeft') return { type: 'move', dRow: 0, dCol: -1 };
  if (k === 'ArrowRight') return { type: 'move', dRow: 0, dCol: 1 };
  if (k === 'Tab') return { type: 'move', dRow: 0, dCol: e.shiftKey ? -1 : 1 };
  if (/^[0-9.,]$/.test(k)) return { type: 'edit', seed: k };
  if (k === 'Delete' || k === 'Backspace') return { type: 'edit', seed: '0' };
  return { type: 'none' };
};

// E1.3: диапазон ячеек прямоугольником от якоря до текущей (Shift+клик/Shift-стрелки).
// Чистая функция на координатах (row,col) — без host-DOM. Возвращает список ячеек
// внутри прямоугольника [anchor..focus] включительно.
export const cellRange = (anchor: Cell, focus: Cell): Cell[] => {
  const r0 = Math.min(anchor.row, focus.row);
  const r1 = Math.max(anchor.row, focus.row);
  const c0 = Math.min(anchor.col, focus.col);
  const c1 = Math.max(anchor.col, focus.col);
  const cells: Cell[] = [];
  for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) cells.push({ row, col });
  return cells;
};

// Принадлежит ли ячейка прямоугольнику [anchor..focus]. Для подсветки выделения.
export const inRange = (anchor: Cell | null, focus: Cell | null, row: number, col: number): boolean => {
  if (!anchor || !focus) return false;
  return (
    row >= Math.min(anchor.row, focus.row) &&
    row <= Math.max(anchor.row, focus.row) &&
    col >= Math.min(anchor.col, focus.col) &&
    col <= Math.max(anchor.col, focus.col)
  );
};

// Чистая функция: применить сдвиг (dRow, dCol) к ячейке в сетке rows×cols.
export const clampCell = (
  prev: Cell | null,
  dRow: number,
  dCol: number,
  rows: number,
  cols: number,
): Cell | null => {
  if (!prev || rows === 0 || cols === 0) return prev;
  return {
    row: Math.max(0, Math.min(rows - 1, prev.row + dRow)),
    col: Math.max(0, Math.min(cols - 1, prev.col + dCol)),
  };
};

// UC1: координаты первой пустой редактируемой ячейки (быстрый старт ввода).
// Скан построчно слева-направо: первая ячейка с 0 ч и без блокировки (locked).
// null — нет подходящей (все заполнены/заблокированы либо сетка пуста).
// Песочница-safe: возвращает только координаты, фокус ставит nav.setActive
// (host-DOM document.querySelector/focus недоступны в Remote DOM).
export const firstEmptyCell = (
  hoursByRow: number[][],
  lockedByRow?: boolean[][],
): Cell | null => {
  for (let row = 0; row < hoursByRow.length; row++) {
    const hours = hoursByRow[row];
    for (let col = 0; col < hours.length; col++) {
      if (hours[col] === 0 && !lockedByRow?.[row]?.[col]) return { row, col };
    }
  }
  return null;
};

export type Nav = {
  active: Cell | null;
  anchor: Cell | null; // E1.3: якорь диапазона (Shift+клик)
  isActive: (row: number, col: number) => boolean;
  isSelected: (row: number, col: number) => boolean; // в прямоугольнике выделения
  setActive: (cell: Cell | null) => void;
  // Shift+клик: задать активную, сохранив якорь (диапазон от прошлой активной).
  extendTo: (cell: Cell) => void;
  selection: () => Cell[]; // ячейки текущего выделения (одна, если диапазона нет)
  // true, если событие обработано навигацией (вызывающий делает preventDefault).
  handleKey: (e: { key: string; shiftKey: boolean }) => 'moved' | 'edit' | null;
  editSeed: string | null; // первый символ, с которого начали печатать
  consumeSeed: () => void;
};

export const useKeyboard = (rows: number, cols: number): Nav => {
  const [active, setActiveState] = useState<Cell | null>(null);
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const [editSeed, setEditSeed] = useState<string | null>(null);
  const dims = useRef({ rows, cols });
  dims.current = { rows, cols };

  const setActive = useCallback((cell: Cell | null) => {
    setActiveState(cell);
    setAnchor(cell); // обычный клик сбрасывает диапазон (якорь = сама ячейка)
    setEditSeed(null);
  }, []);

  // E1.3: Shift+клик — расширить выделение от якоря (прошлой активной) до cell.
  const extendTo = useCallback((cell: Cell) => {
    setActiveState((prev) => {
      setAnchor((a) => a ?? prev ?? cell); // якорь = существующий, иначе прошлая активная
      return cell;
    });
    setEditSeed(null);
  }, []);

  const move = useCallback((dRow: number, dCol: number) => {
    setActiveState((prev) => {
      const next = clampCell(prev, dRow, dCol, dims.current.rows, dims.current.cols);
      setAnchor(next); // стрелки без Shift сбрасывают диапазон
      return next;
    });
    setEditSeed(null);
  }, []);

  const handleKey = useCallback(
    (e: { key: string; shiftKey: boolean }): 'moved' | 'edit' | null => {
      const action = keyAction(e);
      if (action.type === 'move') return move(action.dRow, action.dCol), 'moved';
      if (action.type === 'edit') { setEditSeed(action.seed); return 'edit'; }
      return null;
    },
    [move],
  );

  const isActive = useCallback(
    (row: number, col: number) => active?.row === row && active?.col === col,
    [active],
  );

  const isSelected = useCallback(
    (row: number, col: number) => inRange(anchor, active, row, col),
    [anchor, active],
  );

  const selection = useCallback(
    (): Cell[] => (anchor && active ? cellRange(anchor, active) : active ? [active] : []),
    [anchor, active],
  );

  const consumeSeed = useCallback(() => setEditSeed(null), []);

  return { active, anchor, isActive, isSelected, setActive, extendTo, selection, handleKey, editSeed, consumeSeed };
};
