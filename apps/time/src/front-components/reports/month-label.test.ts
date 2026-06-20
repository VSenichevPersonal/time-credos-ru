import { describe, expect, it } from 'vitest';

import { monthLabel, splitMonth } from './month-label';

describe('splitMonth', () => {
  it('валидный YYYY-MM → месяц + год', () => {
    expect(splitMonth('2026-01')).toEqual({ mon: 'янв', year: '2026' });
    expect(splitMonth('2026-12')).toEqual({ mon: 'дек', year: '2026' });
    expect(splitMonth('2025-06')).toEqual({ mon: 'июн', year: '2025' });
  });

  it('невалидный вход → пустые поля', () => {
    expect(splitMonth('2026')).toEqual({ mon: '', year: '' });
    expect(splitMonth('')).toEqual({ mon: '', year: '' });
    expect(splitMonth('2026-13')).toEqual({ mon: '', year: '2026' });
  });
});

describe('monthLabel', () => {
  it('без года → только месяц', () => {
    expect(monthLabel('2026-03')).toBe('мар');
  });

  it('с годом → «месяц год»', () => {
    expect(monthLabel('2026-03', true)).toBe('мар 2026');
  });

  it('невалидный вход → деградация (как есть)', () => {
    expect(monthLabel('garbage')).toBe('garbage');
  });
});
