import { useCallback, useRef, useState } from 'react';

// Координатная навигация по сетке часов. Ячейка адресуется (row, col).
// Стрелки/Tab/Enter двигают активную ячейку; печать цифры → режим ввода.
// Сами ячейки читают активность по равенству координат (без портала фокуса).

export type Cell = { row: number; col: number };

export type KeyAction =
  | { type: 'move'; dRow: number; dCol: number }
  | { type: 'edit'; seed: string }
  | { type: 'none' };

// Чистая функция: какое действие соответствует клавише.
export const keyAction = (e: { key: string; shiftKey: boolean }): KeyAction => {
  const k = e.key;
  if (k === 'ArrowUp') return { type: 'move', dRow: -1, dCol: 0 };
  if (k === 'ArrowDown' || k === 'Enter') return { type: 'move', dRow: 1, dCol: 0 };
  if (k === 'ArrowLeft') return { type: 'move', dRow: 0, dCol: -1 };
  if (k === 'ArrowRight') return { type: 'move', dRow: 0, dCol: 1 };
  if (k === 'Tab') return { type: 'move', dRow: 0, dCol: e.shiftKey ? -1 : 1 };
  if (/^[0-9.,]$/.test(k)) return { type: 'edit', seed: k };
  if (k === 'Delete' || k === 'Backspace') return { type: 'edit', seed: '0' };
  return { type: 'none' };
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
  isActive: (row: number, col: number) => boolean;
  setActive: (cell: Cell | null) => void;
  // true, если событие обработано навигацией (вызывающий делает preventDefault).
  handleKey: (e: { key: string; shiftKey: boolean }) => 'moved' | 'edit' | null;
  editSeed: string | null; // первый символ, с которого начали печатать
  consumeSeed: () => void;
};

export const useKeyboard = (rows: number, cols: number): Nav => {
  const [active, setActiveState] = useState<Cell | null>(null);
  const [editSeed, setEditSeed] = useState<string | null>(null);
  const dims = useRef({ rows, cols });
  dims.current = { rows, cols };

  const setActive = useCallback((cell: Cell | null) => {
    setActiveState(cell);
    setEditSeed(null);
  }, []);

  const move = useCallback((dRow: number, dCol: number) => {
    setActiveState((prev) => clampCell(prev, dRow, dCol, dims.current.rows, dims.current.cols));
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

  const consumeSeed = useCallback(() => setEditSeed(null), []);

  return { active, isActive, setActive, handleKey, editSeed, consumeSeed };
};
