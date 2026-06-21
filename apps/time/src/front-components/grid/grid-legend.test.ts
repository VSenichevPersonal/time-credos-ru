import { describe, expect, it } from 'vitest';

import { LEGEND_LABELS } from './grid-legend';
import { ENTRY_STATUS_LABELS } from 'src/constants/labels';

// Легенда поясняет РЕАЛЬНЫЕ визуальные сигналы недельной сетки (hour-cell):
// замок (locked=APPROVED), тинт-заливка по часам, цвет переработки, норма-хинт.
// Тест держит легенду в синхроне с этим набором — без рендера (env=node).

describe('LEGEND_LABELS — подписи легенды сетки', () => {
  it('ровно 4 сигнала (lock / заливка / переработка / норма) — не перегружено', () => {
    expect(LEGEND_LABELS).toHaveLength(4);
  });

  it('подписи непустые и без англицизмов в видимом тексте', () => {
    for (const label of LEGEND_LABELS) {
      expect(label.trim().length).toBeGreaterThan(0);
      // латиница в подписи легенды недопустима (русский UI)
      expect(label).not.toMatch(/[a-zA-Z]/);
    }
  });

  it('замок описан как «только чтение» (поясняет 🔒 — задача заказчика)', () => {
    expect(LEGEND_LABELS[0]).toContain('только чтение');
  });

  it('статус замка согласован со словарём (D4.15: «Согласовано»)', () => {
    expect(LEGEND_LABELS[0]).toContain(ENTRY_STATUS_LABELS.Approved);
  });

  it('есть пояснение цвета-заливки и переработки', () => {
    expect(LEGEND_LABELS.some((l) => l.includes('Цвет'))).toBe(true);
    expect(LEGEND_LABELS.some((l) => l.includes('Переработка'))).toBe(true);
  });

  it('есть пояснение нормы дня (бледный хинт пустой ячейки)', () => {
    expect(LEGEND_LABELS.some((l) => l.includes('Норма дня'))).toBe(true);
  });
});
