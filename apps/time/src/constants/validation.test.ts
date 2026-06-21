import { describe, expect, it } from 'vitest';

import {
  VALIDATION_CODE,
  VALIDATION_DEFAULTS,
  VALIDATION_LEVEL,
  type ValidationThresholds,
  hasBlockingError,
  validateEntry,
  validatePositiveHours,
  validateWeekUnderfill,
} from 'src/constants/validation';

// gap-аудит v3 #4: правила валидации как данные + уровни Ошибка/Предупреждение.
// Соглашение: лимит часов/день = ERROR (блок); переработка/недобор = WARNING.

const thresholds = (over: Partial<ValidationThresholds> = {}): ValidationThresholds => ({
  maxHoursPerDay: 24,
  overtimeWarnHours: 12,
  minHoursPerWeek: 0,
  ...over,
});

describe('validateEntry — лимит часов/день (ERROR)', () => {
  it('часы в норме → нет нарушений', () => {
    expect(validateEntry({ hours: 8 }, thresholds())).toEqual([]);
  });

  it('превышение лимита → ERROR max_hours_per_day, блокирует', () => {
    const f = validateEntry({ hours: 25 }, thresholds());
    expect(f).toHaveLength(1);
    expect(f[0].level).toBe(VALIDATION_LEVEL.ERROR);
    expect(f[0].code).toBe(VALIDATION_CODE.MAX_HOURS_PER_DAY);
    expect(hasBlockingError(f)).toBe(true);
  });

  it('отрицательные часы → ERROR', () => {
    const f = validateEntry({ hours: -1 }, thresholds());
    expect(f[0].level).toBe(VALIDATION_LEVEL.ERROR);
  });

  it('NaN → ERROR', () => {
    const f = validateEntry({ hours: Number.NaN }, thresholds());
    expect(f[0].level).toBe(VALIDATION_LEVEL.ERROR);
  });

  it('пользовательский лимит из настроек (maxHoursPerDay=10): 11 → ERROR', () => {
    const f = validateEntry({ hours: 11 }, thresholds({ maxHoursPerDay: 10 }));
    expect(f[0].code).toBe(VALIDATION_CODE.MAX_HOURS_PER_DAY);
    expect(f[0].message).toContain('10');
  });

  it('ровно лимит (24) → нет ERROR (лимит не превышен)', () => {
    const f = validateEntry({ hours: 24 }, thresholds());
    expect(hasBlockingError(f)).toBe(false);
  });

  it('ровно лимит без переработки (overtime=0) → нет нарушений', () => {
    expect(validateEntry({ hours: 24 }, thresholds({ overtimeWarnHours: 0 }))).toEqual([]);
  });
});

describe('validateEntry — переработка (WARNING, не блок)', () => {
  it('часы выше порога, но ниже лимита → WARNING overtime_per_day', () => {
    const f = validateEntry({ hours: 14 }, thresholds());
    expect(f).toHaveLength(1);
    expect(f[0].level).toBe(VALIDATION_LEVEL.WARNING);
    expect(f[0].code).toBe(VALIDATION_CODE.OVERTIME_PER_DAY);
    expect(hasBlockingError(f)).toBe(false);
  });

  it('ровно порог (12) → нет предупреждения', () => {
    expect(validateEntry({ hours: 12 }, thresholds())).toEqual([]);
  });

  it('overtimeWarnHours=0 → предупреждения выключены', () => {
    expect(validateEntry({ hours: 20 }, thresholds({ overtimeWarnHours: 0 }))).toEqual([]);
  });

  it('превышение лимита не дублирует WARNING переработки (только ERROR)', () => {
    const f = validateEntry({ hours: 30 }, thresholds());
    expect(f).toHaveLength(1);
    expect(f[0].level).toBe(VALIDATION_LEVEL.ERROR);
  });
});

describe('validateWeekUnderfill — недобор недели (WARNING)', () => {
  it('порог 0 → правило выключено (null)', () => {
    expect(validateWeekUnderfill(10, 0)).toBeNull();
  });

  it('недели достаточно → null', () => {
    expect(validateWeekUnderfill(40, 40)).toBeNull();
  });

  it('недобор → WARNING min_hours_per_week с дельтой', () => {
    const f = validateWeekUnderfill(32, 40);
    expect(f).not.toBeNull();
    expect(f?.level).toBe(VALIDATION_LEVEL.WARNING);
    expect(f?.code).toBe(VALIDATION_CODE.MIN_HOURS_PER_WEEK);
    expect(f?.message).toContain('8');
  });
});

describe('validatePositiveHours — WI-52 / W5C.27 (пустая запись = ERROR)', () => {
  it('часы > 0 → null (корректно)', () => {
    expect(validatePositiveHours(8)).toBeNull();
    expect(validatePositiveHours(0.5)).toBeNull();
  });

  it('hours=0 → ERROR positive_hours_required (не сохранять пустую)', () => {
    const f = validatePositiveHours(0);
    expect(f).not.toBeNull();
    expect(f?.level).toBe(VALIDATION_LEVEL.ERROR);
    expect(f?.code).toBe(VALIDATION_CODE.POSITIVE_HOURS_REQUIRED);
  });

  it('отрицательные часы → ERROR', () => {
    expect(validatePositiveHours(-3)?.level).toBe(VALIDATION_LEVEL.ERROR);
  });

  it('NaN/Infinity → ERROR', () => {
    expect(validatePositiveHours(Number.NaN)?.code).toBe(VALIDATION_CODE.POSITIVE_HOURS_REQUIRED);
    expect(validatePositiveHours(Number.POSITIVE_INFINITY)?.code).toBe(
      VALIDATION_CODE.POSITIVE_HOURS_REQUIRED,
    );
  });

  it('finding попадает в hasBlockingError', () => {
    expect(hasBlockingError([validatePositiveHours(0)!])).toBe(true);
  });
});

describe('VALIDATION_DEFAULTS', () => {
  it('дефолтный лимит = 24 (back-compat HOURS_MAX)', () => {
    expect(VALIDATION_DEFAULTS.maxHoursPerDay).toBe(24);
  });

  it('недельный недобор по умолчанию выключен (0)', () => {
    expect(VALIDATION_DEFAULTS.minHoursPerWeek).toBe(0);
  });
});
