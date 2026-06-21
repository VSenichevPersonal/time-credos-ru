import { describe, expect, it } from 'vitest';

import { SHORTCUTS } from './keymap';
import { keyAction } from './use-keyboard';

// SSOT-инвариант (E4.14): cheatsheet и обработчик берут клавиши из одного списка.
// Эти тесты ловят дрейф — добавили в keymap, но забыли обработать (как был E4.5).

describe('SHORTCUTS — целостность SSOT', () => {
  it('все id уникальны', () => {
    const ids = SHORTCUTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('у каждой записи непустые keys и desc', () => {
    for (const s of SHORTCUTS) {
      expect(s.keys.trim().length).toBeGreaterThan(0);
      expect(s.desc.trim().length).toBeGreaterThan(0);
    }
  });

  it('Shift+Enter есть в списке (E4.5: раньше был в подсказке без обработчика)', () => {
    const se = SHORTCUTS.find((s) => s.id === 'bulk-fill-row');
    expect(se?.keys).toContain('Shift+Enter');
  });
});

// E4.5: каждая «модификаторная» клавиша из подсказки ДОЛЖНА давать действие в
// keyAction (не оставаться 'none'). Это и есть антидрейф док↔код.
describe('keymap ↔ keyAction — нет осиротевших клавиш', () => {
  it('Shift+Enter → не none', () => {
    expect(keyAction({ key: 'Enter', shiftKey: true }).type).not.toBe('none');
  });

  it('Ctrl+D → не none', () => {
    expect(keyAction({ key: 'd', shiftKey: false, ctrlKey: true }).type).not.toBe('none');
  });

  it('Ctrl+C → не none', () => {
    expect(keyAction({ key: 'c', shiftKey: false, ctrlKey: true }).type).not.toBe('none');
  });

  it('Ctrl+V → не none', () => {
    expect(keyAction({ key: 'v', shiftKey: false, ctrlKey: true }).type).not.toBe('none');
  });
});
