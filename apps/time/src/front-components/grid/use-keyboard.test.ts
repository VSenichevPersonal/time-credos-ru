import { describe, expect, it } from 'vitest';

import { clampCell, firstEmptyCell, keyAction } from './use-keyboard';
import type { Cell } from './use-keyboard';

const cell = (row: number, col: number): Cell => ({ row, col });

// ─── keyAction ────────────────────────────────────────────────────────────────

describe('keyAction — стрелки', () => {
  it('ArrowUp → move dRow=-1', () => {
    expect(keyAction({ key: 'ArrowUp', shiftKey: false })).toEqual({ type: 'move', dRow: -1, dCol: 0 });
  });

  it('ArrowDown → move dRow=+1', () => {
    expect(keyAction({ key: 'ArrowDown', shiftKey: false })).toEqual({ type: 'move', dRow: 1, dCol: 0 });
  });

  it('Enter → move dRow=+1 (как ArrowDown)', () => {
    expect(keyAction({ key: 'Enter', shiftKey: false })).toEqual({ type: 'move', dRow: 1, dCol: 0 });
  });

  it('ArrowLeft → move dCol=-1', () => {
    expect(keyAction({ key: 'ArrowLeft', shiftKey: false })).toEqual({ type: 'move', dRow: 0, dCol: -1 });
  });

  it('ArrowRight → move dCol=+1', () => {
    expect(keyAction({ key: 'ArrowRight', shiftKey: false })).toEqual({ type: 'move', dRow: 0, dCol: 1 });
  });

  it('Tab → move dCol=+1', () => {
    expect(keyAction({ key: 'Tab', shiftKey: false })).toEqual({ type: 'move', dRow: 0, dCol: 1 });
  });

  it('Shift+Tab → move dCol=-1', () => {
    expect(keyAction({ key: 'Tab', shiftKey: true })).toEqual({ type: 'move', dRow: 0, dCol: -1 });
  });
});

describe('keyAction — ввод', () => {
  it('цифра "5" → edit seed=5', () => {
    expect(keyAction({ key: '5', shiftKey: false })).toEqual({ type: 'edit', seed: '5' });
  });

  it('цифра "0" → edit seed=0', () => {
    expect(keyAction({ key: '0', shiftKey: false })).toEqual({ type: 'edit', seed: '0' });
  });

  it('"." → edit (разделитель)', () => {
    expect(keyAction({ key: '.', shiftKey: false })).toEqual({ type: 'edit', seed: '.' });
  });

  it('"," → edit (разделитель)', () => {
    expect(keyAction({ key: ',', shiftKey: false })).toEqual({ type: 'edit', seed: ',' });
  });

  it('Delete → edit seed="0" (очистка)', () => {
    expect(keyAction({ key: 'Delete', shiftKey: false })).toEqual({ type: 'edit', seed: '0' });
  });

  it('Backspace → edit seed="0" (очистка)', () => {
    expect(keyAction({ key: 'Backspace', shiftKey: false })).toEqual({ type: 'edit', seed: '0' });
  });
});

describe('keyAction — игнор', () => {
  it('Escape → none', () => {
    expect(keyAction({ key: 'Escape', shiftKey: false })).toEqual({ type: 'none' });
  });

  it('F1 → none', () => {
    expect(keyAction({ key: 'F1', shiftKey: false })).toEqual({ type: 'none' });
  });

  it('Space → none (не цифра)', () => {
    expect(keyAction({ key: ' ', shiftKey: false })).toEqual({ type: 'none' });
  });

  it('буква "a" → none', () => {
    expect(keyAction({ key: 'a', shiftKey: false })).toEqual({ type: 'none' });
  });
});

// ─── clampCell ────────────────────────────────────────────────────────────────

describe('clampCell — базовый сдвиг', () => {
  it('вниз (dRow=+1)', () => {
    expect(clampCell(cell(0, 0), 1, 0, 3, 5)).toEqual({ row: 1, col: 0 });
  });

  it('вправо (dCol=+1)', () => {
    expect(clampCell(cell(0, 0), 0, 1, 3, 5)).toEqual({ row: 0, col: 1 });
  });

  it('вверх (dRow=-1)', () => {
    expect(clampCell(cell(2, 2), -1, 0, 3, 5)).toEqual({ row: 1, col: 2 });
  });
});

describe('clampCell — ограничение границами', () => {
  it('не выйти за последнюю строку', () => {
    expect(clampCell(cell(2, 0), 1, 0, 3, 5)).toEqual({ row: 2, col: 0 });
  });

  it('не выйти за последний столбец', () => {
    expect(clampCell(cell(0, 4), 0, 1, 3, 5)).toEqual({ row: 0, col: 4 });
  });

  it('не выйти за первую строку', () => {
    expect(clampCell(cell(0, 0), -1, 0, 3, 5)).toEqual({ row: 0, col: 0 });
  });

  it('не выйти за первый столбец', () => {
    expect(clampCell(cell(0, 0), 0, -1, 3, 5)).toEqual({ row: 0, col: 0 });
  });
});

describe('clampCell — граничные случаи', () => {
  it('prev=null → null (нет активной ячейки)', () => {
    expect(clampCell(null, 1, 0, 3, 5)).toBeNull();
  });

  it('rows=0 → prev без изменений', () => {
    expect(clampCell(cell(0, 0), 1, 0, 0, 5)).toEqual({ row: 0, col: 0 });
  });

  it('cols=0 → prev без изменений', () => {
    expect(clampCell(cell(0, 0), 0, 1, 3, 0)).toEqual({ row: 0, col: 0 });
  });

  it('сетка 1×1 → всегда (0,0)', () => {
    expect(clampCell(cell(0, 0), 1, 1, 1, 1)).toEqual({ row: 0, col: 0 });
  });
});

// ─── firstEmptyCell (UC1: автофокус) ───────────────────────────────────────────

describe('firstEmptyCell', () => {
  it('первая нулевая ячейка слева-направо, построчно', () => {
    expect(
      firstEmptyCell([
        [8, 8, 0, 0],
        [0, 0, 0, 0],
      ]),
    ).toEqual({ row: 0, col: 2 });
  });

  it('пропускает заполненные строки целиком', () => {
    expect(
      firstEmptyCell([
        [8, 8, 8],
        [8, 0, 8],
      ]),
    ).toEqual({ row: 1, col: 1 });
  });

  it('пропускает заблокированные (locked) пустые ячейки', () => {
    expect(
      firstEmptyCell(
        [[0, 0, 0]],
        [[true, true, false]],
      ),
    ).toEqual({ row: 0, col: 2 });
  });

  it('все заполнены → null', () => {
    expect(firstEmptyCell([[8, 8], [8, 8]])).toBeNull();
  });

  it('все пустые заблокированы → null', () => {
    expect(firstEmptyCell([[0, 0]], [[true, true]])).toBeNull();
  });

  it('пустая сетка → null', () => {
    expect(firstEmptyCell([])).toBeNull();
  });
});
