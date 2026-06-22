import { describe, expect, it } from 'vitest';

import { LEGEND_LABELS } from './grid-legend';
import { ENTRY_STATUS_LABELS } from 'src/constants/labels';

// Легенда поясняет РЕАЛЬНЫЕ визуальные сигналы недельной сетки (hour-cell):
// замок (locked=APPROVED), тинт-заливка по часам, цвет переработки, норма-хинт.
// Тест держит легенду в синхроне с этим набором — без рендера (env=node).

describe('LEGEND_LABELS — подписи легенды сетки', () => {
  it('7 визуальных сигналов сетки покрыты (lock / заливка / точка / переработка / норма / сегодня / выходной)', () => {
    expect(LEGEND_LABELS).toHaveLength(7);
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

  it('есть пояснение заливки и переработки', () => {
    expect(LEGEND_LABELS.some((l) => l.toLowerCase().includes('заливк'))).toBe(true);
    expect(LEGEND_LABELS.some((l) => l.includes('Переработка'))).toBe(true);
  });

  it('есть пояснение нормы дня (бледный хинт пустой ячейки)', () => {
    expect(LEGEND_LABELS.some((l) => l.toLowerCase().includes('норма дня'))).toBe(true);
  });

  it('есть пояснение точки-заполнения будней', () => {
    expect(LEGEND_LABELS.some((l) => l.toLowerCase().includes('будни'))).toBe(true);
  });

  it('есть пояснение сегодня и выходного', () => {
    expect(LEGEND_LABELS.some((l) => l.includes('Сегодня'))).toBe(true);
    expect(LEGEND_LABELS.some((l) => l.toLowerCase().includes('выходной'))).toBe(true);
  });
});
