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

  it('Shift+Enter описан как «вверх» (W3A.5: освобождён от bulk-fill)', () => {
    const se = SHORTCUTS.find((s) => s.id === 'commit-up');
    expect(se?.keys).toContain('Shift+Enter');
  });

  it('bulk-fill перевешен на Alt+→ (W3A.5: без коллизии с Ctrl+D)', () => {
    const bf = SHORTCUTS.find((s) => s.id === 'bulk-fill-row');
    expect(bf?.keys).toContain('Alt');
    expect(bf?.keys).not.toContain('Shift+Enter');
  });

  it('Home/End и Ctrl+Home/End в списке (W3A.8)', () => {
    expect(SHORTCUTS.find((s) => s.id === 'row-edge')?.keys).toMatch(/Home|End/);
    expect(SHORTCUTS.find((s) => s.id === 'grid-edge')?.keys).toMatch(/Home|End/);
  });
});

// E4.5: каждая «модификаторная» клавиша из подсказки ДОЛЖНА давать действие в
// keyAction (не оставаться 'none'). Это и есть антидрейф док↔код.
describe('keymap ↔ keyAction — нет осиротевших клавиш', () => {
  it('Shift+Enter → не none (W3A.5: теперь навигация вверх)', () => {
    expect(keyAction({ key: 'Enter', shiftKey: true }).type).not.toBe('none');
  });

  it('Alt+→ → не none (W3A.5: bulk-fill будней)', () => {
    expect(keyAction({ key: 'ArrowRight', shiftKey: false, altKey: true }).type).not.toBe('none');
  });

  it('Home/End → не none (W3A.8)', () => {
    expect(keyAction({ key: 'Home', shiftKey: false }).type).not.toBe('none');
    expect(keyAction({ key: 'End', shiftKey: false }).type).not.toBe('none');
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
