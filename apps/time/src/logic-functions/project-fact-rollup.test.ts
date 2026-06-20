import { describe, expect, it } from 'vitest';

import {
  computeBudgetRemaining,
  computeFactHours,
  computeProjectRollup,
  isUuidLike,
} from './project-fact-rollup';

// SSOT-ядро rollup-поля проекта (баг «пустые Факт/Остаток»). Тестируем чистую
// формулу — она общая для триггеров, /s/time-entry и backfill, поэтому её
// корректность = корректность всего жизненного цикла.

describe('computeFactHours', () => {
  it('суммирует часы записей', () => {
    expect(computeFactHours([{ hours: 2 }, { hours: 3 }, { hours: 1.5 }])).toBe(6.5);
  });

  it('пустой набор → 0 (а не null/пусто — закрывает дрейф «пустое поле»)', () => {
    expect(computeFactHours([])).toBe(0);
  });

  it('null/NaN-часы трактуются как 0', () => {
    expect(computeFactHours([{ hours: null }, { hours: 4 }])).toBe(4);
    expect(computeFactHours([{ hours: Number.NaN as unknown as number }, { hours: 2 }])).toBe(2);
  });

  it('округляет до 2 знаков (как decimals поля)', () => {
    expect(computeFactHours([{ hours: 0.1 }, { hours: 0.2 }])).toBe(0.3);
  });
});

describe('computeBudgetRemaining', () => {
  it('остаток = план − факт', () => {
    expect(computeBudgetRemaining(100, 30)).toBe(70);
  });

  it('перерасход = отрицательное', () => {
    expect(computeBudgetRemaining(40, 50)).toBe(-10);
  });

  it('план не задан → null (нечего считать)', () => {
    expect(computeBudgetRemaining(null, 50)).toBeNull();
    expect(computeBudgetRemaining(undefined, 50)).toBeNull();
  });

  it('план 0 — валиден, остаток = −факт (не путать с null)', () => {
    expect(computeBudgetRemaining(0, 5)).toBe(-5);
  });
});

describe('computeProjectRollup', () => {
  it('собирает оба поля из записей и плана', () => {
    const r = computeProjectRollup([{ hours: 10 }, { hours: 5 }], 40);
    expect(r).toEqual({ factHours: 15, budgetRemaining: 25 });
  });

  it('проект без записей → factHours 0, budgetRemaining = весь план (не пусто)', () => {
    expect(computeProjectRollup([], 80)).toEqual({ factHours: 0, budgetRemaining: 80 });
  });

  it('проект без записей и без плана → 0 / null', () => {
    expect(computeProjectRollup([], null)).toEqual({ factHours: 0, budgetRemaining: null });
  });

  it('идемпотентность: тот же вход → тот же результат (повтор события безопасен)', () => {
    const entries = [{ hours: 3 }, { hours: 7 }];
    expect(computeProjectRollup(entries, 20)).toEqual(computeProjectRollup(entries, 20));
  });
});

describe('isUuidLike', () => {
  it('пропускает UUID v4, режет мусор/инъекцию (CISO-006 guard перед REST)', () => {
    expect(isUuidLike('00a4d3f7-a783-4bb8-a71c-4142d9c0aabc')).toBe(true);
    expect(isUuidLike('not-a-uuid')).toBe(false);
    expect(isUuidLike('id[eq]:x,status[neq]:DRAFT')).toBe(false);
    expect(isUuidLike(null)).toBe(false);
    expect(isUuidLike(undefined)).toBe(false);
  });
});
