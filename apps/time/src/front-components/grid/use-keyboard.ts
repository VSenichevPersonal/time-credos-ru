import { useCallback, useRef, useState } from 'react';

// Координатная навигация по сетке часов. Ячейка адресуется (row, col).
// Стрелки/Tab/Enter двигают активную ячейку; печать цифры → режим ввода.
// Сами ячейки читают активность по равенству координат (без портала фокуса).

export type Cell = { row: number; col: number };

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
    setActiveState((prev) => {
      const { rows: r, cols: c } = dims.current;
      if (!prev || r === 0 || c === 0) return prev;
      const row = Math.max(0, Math.min(r - 1, prev.row + dRow));
      const col = Math.max(0, Math.min(c - 1, prev.col + dCol));
      return { row, col };
    });
    setEditSeed(null);
  }, []);

  const handleKey = useCallback(
    (e: { key: string; shiftKey: boolean }): 'moved' | 'edit' | null => {
      const k = e.key;
      if (k === 'ArrowUp') return move(-1, 0), 'moved';
      if (k === 'ArrowDown' || k === 'Enter') return move(1, 0), 'moved';
      if (k === 'ArrowLeft') return move(0, -1), 'moved';
      if (k === 'ArrowRight') return move(0, 1), 'moved';
      if (k === 'Tab') return move(0, e.shiftKey ? -1 : 1), 'moved';
      // Печать цифры/разделителя → вход в редактирование с этим символом.
      if (/^[0-9.,]$/.test(k)) {
        setEditSeed(k);
        return 'edit';
      }
      // Очистка ячейки.
      if (k === 'Delete' || k === 'Backspace') {
        setEditSeed('0');
        return 'edit';
      }
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
