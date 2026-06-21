import { describe, expect, it } from 'vitest';

import { parsePlanHours } from './employee-plan-panel';

// Чистая функция парсинга часов персонального плана (план на человека).

describe('parsePlanHours', () => {
  it('целое число', () => {
    expect(parsePlanHours('40')).toBe(40);
  });

  it('запятая как разделитель → точка', () => {
    expect(parsePlanHours('7,5')).toBe(7.5);
  });

  it('точка как разделитель', () => {
    expect(parsePlanHours('7.5')).toBe(7.5);
  });

  it('пустая строка → null (часы не заданы)', () => {
    expect(parsePlanHours('')).toBe(null);
    expect(parsePlanHours('   ')).toBe(null);
  });

  it('отрицательное → null', () => {
    expect(parsePlanHours('-5')).toBe(null);
  });

  it('нечисло → null', () => {
    expect(parsePlanHours('abc')).toBe(null);
  });

  it('0 допустим (явный «нет часов» → удаление слота на бэке)', () => {
    expect(parsePlanHours('0')).toBe(0);
  });

  it('округление до 2 знаков', () => {
    expect(parsePlanHours('7.456')).toBe(7.46);
  });
});
