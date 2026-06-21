import { describe, expect, it } from 'vitest';

import { monthLabel, splitMonth, weekRangeLabel } from './month-label';

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

describe('weekRangeLabel', () => {
  it('неделя внутри одного месяца → «13–19 января 2026»', () => {
    expect(weekRangeLabel('2026-01-13', '2026-01-19')).toBe('13–19 января 2026');
  });

  it('неделя на стыке месяцев одного года → «30 декабря – 5 января 2026»', () => {
    expect(weekRangeLabel('2025-12-30', '2026-01-05')).toBe('30 декабря 2025 – 5 января 2026');
  });

  it('стык месяцев в одном году → левая дата без года', () => {
    expect(weekRangeLabel('2026-03-30', '2026-04-05')).toBe('30 марта – 5 апреля 2026');
  });

  it('невалидный вход → деградация «from – to»', () => {
    expect(weekRangeLabel('garbage', '2026-01-05')).toBe('garbage – 2026-01-05');
  });
});
