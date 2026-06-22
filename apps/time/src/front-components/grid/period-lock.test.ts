import { describe, expect, it } from 'vitest';

import {
  effectiveBoundaryDay,
  isDayLockedByPeriod,
  PERIOD_LOCKED_MESSAGE,
  PERIOD_LOCKED_CELL_TITLE,
  type LockdownView,
} from 'src/front-components/grid/period-lock';

const OFF: LockdownView = { lockdownDate: null, graceDays: 0 };

describe('effectiveBoundaryDay', () => {
  it('lockdown выключен → null', () => {
    expect(effectiveBoundaryDay(OFF)).toBeNull();
  });

  it('нечитаемая дата → null', () => {
    expect(effectiveBoundaryDay({ lockdownDate: 'not-a-date', graceDays: 0 })).toBeNull();
  });

  it('без грейса граница = сама дата', () => {
    expect(effectiveBoundaryDay({ lockdownDate: '2026-06-30', graceDays: 0 })).toBe('2026-06-30');
  });

  it('грейс сдвигает границу назад на N дней', () => {
    expect(effectiveBoundaryDay({ lockdownDate: '2026-06-30', graceDays: 5 })).toBe('2026-06-25');
  });

  it('грейс переносит границу через начало месяца', () => {
    expect(effectiveBoundaryDay({ lockdownDate: '2026-07-02', graceDays: 5 })).toBe('2026-06-27');
  });

  it('дробный/отрицательный грейс нормализуется (0)', () => {
    expect(effectiveBoundaryDay({ lockdownDate: '2026-06-30', graceDays: -3 })).toBe('2026-06-30');
    expect(effectiveBoundaryDay({ lockdownDate: '2026-06-30', graceDays: 2.9 })).toBe('2026-06-28');
  });
});

describe('isDayLockedByPeriod', () => {
  const cfg: LockdownView = { lockdownDate: '2026-06-30', graceDays: 0 };

  it('lockdown выключен → день не закрыт', () => {
    expect(isDayLockedByPeriod('2026-01-01', OFF)).toBe(false);
  });

  it('пустой/нечитаемый день → не закрыт (fail-open)', () => {
    expect(isDayLockedByPeriod(null, cfg)).toBe(false);
    expect(isDayLockedByPeriod('garbage', cfg)).toBe(false);
  });

  it('день до границы → закрыт', () => {
    expect(isDayLockedByPeriod('2026-06-29', cfg)).toBe(true);
  });

  it('день на границе → закрыт (включительно)', () => {
    expect(isDayLockedByPeriod('2026-06-30', cfg)).toBe(true);
  });

  it('день после границы → открыт', () => {
    expect(isDayLockedByPeriod('2026-07-01', cfg)).toBe(false);
  });

  it('грейс открывает дни между датой и границей', () => {
    const g: LockdownView = { lockdownDate: '2026-06-30', graceDays: 5 };
    // эффективная граница = 2026-06-25
    expect(isDayLockedByPeriod('2026-06-25', g)).toBe(true);
    expect(isDayLockedByPeriod('2026-06-26', g)).toBe(false); // в грейс-окне — ещё можно
    expect(isDayLockedByPeriod('2026-06-30', g)).toBe(false);
  });

  it('принимает DATE_TIME-вход (берёт первые 10 символов)', () => {
    expect(isDayLockedByPeriod('2026-06-29T10:00:00.000Z', cfg)).toBe(true);
  });
});

describe('тексты', () => {
  it('сообщения по-русски и непустые', () => {
    expect(PERIOD_LOCKED_MESSAGE).toContain('Период закрыт');
    expect(PERIOD_LOCKED_CELL_TITLE).toContain('Период закрыт');
  });
});
